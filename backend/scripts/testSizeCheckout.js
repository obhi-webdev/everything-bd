import "dotenv/config";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import mongoose from "mongoose";
import { readFile } from "node:fs/promises";

import { Product } from "../src/modules/products/product.model.js";
import { Order } from "../src/modules/orders/order.model.js";
import { createOrder } from "../src/modules/orders/order.controller.js";
import { updateAdminOrderStatus } from "../src/modules/orders/order.admin.controller.js";

const DB = "everythingbd_size_variation_test";
const uri = process.env.MONGODB_URI;
const tag = crypto.randomUUID();
const products = [];
const requests = [];
let passed = 0;

function pass(name) {
  passed++;
  console.log("PASS:", name);
}

function response() {
  return {
    statusCode: 200,
    body: null,
    status(n) { this.statusCode = n; return this; },
    set() { return this; },
    json(data) { this.body = data; return this; }
  };
}

async function invoke(controller, req) {
  const res = response();
  let error = null;

  await controller(req, res, err => {
    error = err;
  });

  if (error) throw error;
  return res;
}

async function order(items, requestId = crypto.randomUUID()) {
  requests.push(requestId);

  return invoke(createOrder, {
    body: {
      requestId,
      customer: {
        name: "Temporary Size Test Customer",
        phone: "01712345678"
      },
      shippingAddress: {
        district: "Mymensingh",
        area: "Sadar",
        address: "Temporary EverythingBD test address",
        deliveryZone: "outside_dhaka"
      },
      items,
      paymentMethod: "cod"
    }
  });
}

async function inventory() {
  const p = await Product.findById(products[0]).lean();
  assert.ok(p, "Test product missing");

  return {
    total: p.stock,
    sizes: Object.fromEntries(
      p.sizeVariants.map(v => [v.size, v.stock])
    )
  };
}

async function expectInventory(total, m, xl) {
  const data = await inventory();

  assert.deepEqual(data, {
    total,
    sizes: { M: m, XL: xl }
  });
}

async function main() {
  assert.ok(uri, "MONGODB_URI missing");

  const configuredDb = new URL(uri).pathname
    .replace(/^\//, "")
    .split("?")[0];

  assert.ok(
    configuredDb.toLowerCase() !== DB.toLowerCase(),
    "Unsafe database selection"
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

  const hello = await mongoose.connection.db
    .admin().command({ hello: 1 });

  assert.ok(
    hello.setName || hello.msg === "isdbgrid",
    "Transactions are not supported"
  );

  pass("Isolated transaction-capable database");

  await Product.init();
  await Order.init();

  const p = await Product.create({
    name: "Temporary Size Checkout Test",
    slug: `checkout-size-${tag}`,
    sku: `CHECKOUT-SIZE-${tag}`,
    category: "Clothing",
    price: 1200,
    stock: 15,
    hasSizeVariants: true,
    sizeVariants: [
      { size: "M", stock: 5 },
      { size: "XL", stock: 10 }
    ],
    status: "active",
    images: []
  });

  products.push(p._id);

  await expectInventory(15, 5, 10);
  pass("Initial inventory");

  const items = [
    { productId: String(p._id), size: "M", quantity: 2 },
    { productId: String(p._id), size: "XL", quantity: 3 }
  ];

  const requestId = crypto.randomUUID();
  const created = await order(items, requestId);

  assert.equal(created.statusCode, 201, JSON.stringify(created.body));
  await expectInventory(10, 3, 7);

  const saved = await Order.findOne({ requestId });

  assert.ok(saved);
  assert.equal(saved.items.length, 2);
  assert.deepEqual(
    saved.items.map(item => item.size),
    ["M", "XL"]
  );

  pass("M and XL checkout with separate order items");

  const duplicate = await order(items, requestId);
  assert.equal(duplicate.statusCode, 409);
  await expectInventory(10, 3, 7);
  pass("Duplicate checkout rejected");

  const invalidSize = await order([
    { productId: String(p._id), size: "XXL", quantity: 1 }
  ]);

  assert.equal(invalidSize.statusCode, 409);
  await expectInventory(10, 3, 7);
  pass("Unavailable size rejected");

  const missingSize = await order([
    { productId: String(p._id), quantity: 1 }
  ]);

  assert.equal(missingSize.statusCode, 409);
  await expectInventory(10, 3, 7);
  pass("Variant product without size rejected");

  const failed = await order([
    { productId: String(p._id), size: "M", quantity: 1 },
    { productId: String(p._id), size: "XL", quantity: 20 }
  ]);

  assert.equal(failed.statusCode, 409);
  await expectInventory(10, 3, 7);
  pass("Failed multi-size order rolls back");

  const cancelled = await invoke(updateAdminOrderStatus, {
    params: { id: String(saved._id) },
    body: { status: "cancelled" }
  });

  assert.equal(cancelled.statusCode, 200);
  await expectInventory(15, 5, 10);
  pass("Cancellation restores both sizes");

  const again = await invoke(updateAdminOrderStatus, {
    params: { id: String(saved._id) },
    body: { status: "cancelled" }
  });

  assert.equal(again.statusCode, 409);
  await expectInventory(15, 5, 10);
  pass("Double cancellation blocked");

  console.log(`RESULT: ${passed}/8 tests passed`);
  console.log("SIZE CHECKOUT CONTROLLER TEST PASSED");
}

async function cleanup() {
  if (mongoose.connection.readyState !== 1) return;

  assert.equal(
    mongoose.connection.name,
    DB,
    "Unsafe cleanup database"
  );

  if (requests.length) {
    await Order.deleteMany({
      requestId: { $in: requests }
    });
  }

  if (products.length) {
    await Product.deleteMany({
      _id: { $in: products }
    });
  }

  console.log("Temporary test records cleaned up");
}

try {
  await main();
} catch (err) {
  console.error("TEST FAILED:", err.message);
  process.exitCode = 1;
} finally {
  try {
    await cleanup();
  } catch (err) {
    console.error("CLEANUP FAILED:", err.message);
    process.exitCode = 1;
  }

  await mongoose.disconnect();
}
