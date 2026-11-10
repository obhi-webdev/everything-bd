import "dotenv/config";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import mongoose from "mongoose";
import { readFile } from "node:fs/promises";

import { Product } from "../src/modules/products/product.model.js";
import { Order } from "../src/modules/orders/order.model.js";
import { adminUpdateProduct } from "../src/modules/products/product.admin.controller.js";
import { createOrder } from "../src/modules/orders/order.controller.js";
import { updateAdminOrderStatus } from "../src/modules/orders/order.admin.controller.js";

const DB = "everythingbd_size_variation_test";
const uri = process.env.MONGODB_URI;
const tag = crypto.randomUUID();
const productIds = [];
const requestIds = [];

let passed = 0;

function pass(name) {
  passed++;
  console.log("PASS:", name);
}

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    set() { return this; },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

async function invoke(controller, req) {
  const res = mockRes();
  let forwardedError;

  await controller(req, res, error => {
    forwardedError = error;
  });

  if (forwardedError) throw forwardedError;
  return res;
}

async function adminEdit(id, version, data) {
  return invoke(adminUpdateProduct, {
    params: { id: String(id) },
    body: data,
    get(header) {
      return header.toLowerCase() === "if-match"
        ? String(version)
        : undefined;
    }
  });
}

async function placeOrder(id, quantity) {
  const requestId = crypto.randomUUID();
  requestIds.push(requestId);

  const result = await invoke(createOrder, {
    body: {
      requestId,
      customer: {
        name: "Version Test Customer",
        phone: "01712345678"
      },
      shippingAddress: {
        district: "Mymensingh",
        area: "Sadar",
        address: "Temporary inventory version test address",
        deliveryZone: "outside_dhaka"
      },
      items: [{
        productId: String(id),
        quantity
      }],
      paymentMethod: "cod"
    }
  });

  return { result, requestId };
}

async function main() {
  assert.ok(uri, "MONGODB_URI missing");

  const configuredDb = new URL(uri).pathname
    .replace(/^\//, "")
    .split("?")[0];

  assert.notEqual(
    configuredDb.toLowerCase(),
    DB.toLowerCase(),
    "Unsafe test database selection"
  );

  const source = await readFile(
    new URL("../src/modules/orders/order.controller.js", import.meta.url),
    "utf8"
  );

  assert.ok(
    source.includes(
      'mongoose.connection.name !== "everythingbd_size_variation_test"'
    ),
    "Meta tracking safety guard missing"
  );

  process.env.DELIVERY_INSIDE_DHAKA = "80";
  process.env.DELIVERY_OUTSIDE_DHAKA = "130";

  await mongoose.connect(uri, {
    dbName: DB,
    serverSelectionTimeoutMS: 10000
  });

  assert.equal(mongoose.connection.name, DB);
  pass("Isolated test database");

  await Product.init();
  await Order.init();

  // Test 1: Customer order changes inventory version.
  const normal = await Product.create({
    name: "Temporary Version Test Product",
    slug: `version-test-${tag}`,
    sku: `VERSION-${tag}`,
    category: "Skincare",
    price: 500,
    stock: 10,
    status: "active"
  });

  productIds.push(normal._id);

  const originalVersion = normal.__v;
  const { result: ordered, requestId } =
    await placeOrder(normal._id, 2);

  assert.equal(ordered.statusCode, 201);

  let updated = await Product.findById(normal._id);
  assert.equal(updated.stock, 8);
  assert.equal(updated.__v, originalVersion + 1);
  pass("Customer order increments inventory version");

  // Test 2: Admin submits stale stock version.
  const stale = await adminEdit(
    normal._id,
    originalVersion,
    { stock: 10 }
  );

  assert.equal(stale.statusCode, 409);

  updated = await Product.findById(normal._id);
  assert.equal(updated.stock, 8);
  pass("Stale admin stock edit rejected");

  // Test 3: Admin uses the current version.
  const fresh = await adminEdit(
    normal._id,
    updated.__v,
    { stock: 9 }
  );

  assert.equal(fresh.statusCode, 200, JSON.stringify(fresh.body));

  updated = await Product.findById(normal._id);
  assert.equal(updated.stock, 9);
  assert.equal(updated.__v, originalVersion + 2);
  pass("Fresh admin stock edit accepted");

  // Test 4: Cancellation increments inventory version.
  const order = await Order.findOne({ requestId });
  assert.ok(order);

  const beforeCancel = updated.__v;

  const cancelled = await invoke(updateAdminOrderStatus, {
    params: { id: String(order._id) },
    body: { status: "cancelled" }
  });

  assert.equal(cancelled.statusCode, 200);

  updated = await Product.findById(normal._id);
  assert.equal(updated.stock, 11);
  assert.equal(updated.__v, beforeCancel + 1);
  pass("Cancellation increments inventory version");

  // Test 5: An older form cannot overwrite restoration.
  const staleAfterCancel = await adminEdit(
    normal._id,
    beforeCancel,
    { stock: 9 }
  );

  assert.equal(staleAfterCancel.statusCode, 409);

  updated = await Product.findById(normal._id);
  assert.equal(updated.stock, 11);
  pass("Stale edit after cancellation rejected");

  // Test 6: Two admins edit the same draft clothing product.
  const clothing = await Product.create({
    name: "Temporary Version Test Dress",
    slug: `version-dress-${tag}`,
    sku: `VERSION-DRESS-${tag}`,
    category: "Women's Clothing",
    price: 1200,
    stock: 10,
    hasSizeVariants: true,
    sizeVariants: [
      { size: "M", stock: 5 },
      { size: "XL", stock: 5 }
    ],
    status: "draft"
  });

  productIds.push(clothing._id);

  const version = clothing.__v;

  const firstAdmin = await adminEdit(
    clothing._id,
    version,
    {
      stock: 12,
      sizeVariants: [
        { size: "M", stock: 7 },
        { size: "XL", stock: 5 }
      ]
    }
  );

  assert.equal(
    firstAdmin.statusCode,
    200,
    JSON.stringify(firstAdmin.body)
  );

  const secondAdmin = await adminEdit(
    clothing._id,
    version,
    {
      stock: 14,
      sizeVariants: [
        { size: "M", stock: 9 },
        { size: "XL", stock: 5 }
      ]
    }
  );

  assert.equal(secondAdmin.statusCode, 409);

  const finalClothing = await Product.findById(clothing._id);

  assert.equal(finalClothing.stock, 12);
  assert.equal(finalClothing.sizeVariants[0].stock, 7);
  assert.equal(finalClothing.sizeVariants[1].stock, 5);

  pass("Two-admin version conflict rejected");

  console.log(`RESULT: ${passed}/7 tests passed`);
  console.log("INVENTORY VERSION SAFETY TEST PASSED");
}

try {
  await main();
} catch (error) {
  console.error("TEST FAILED:", error.message);
  process.exitCode = 1;
} finally {
  try {
    if (mongoose.connection.readyState === 1) {
      assert.equal(mongoose.connection.name, DB);

      if (requestIds.length) {
        await Order.deleteMany({
          requestId: { $in: requestIds }
        });
      }

      if (productIds.length) {
        await Product.deleteMany({
          _id: { $in: productIds }
        });
      }

      console.log("Temporary test records cleaned up");
    }
  } catch (error) {
    console.error("CLEANUP FAILED:", error.message);
    process.exitCode = 1;
  }

  await mongoose.disconnect();
}
