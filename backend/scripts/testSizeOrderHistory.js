import "dotenv/config";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import mongoose from "mongoose";

import { Product } from "../src/modules/products/product.model.js";
import { Order } from "../src/modules/orders/order.model.js";
import {
  adminUpdateProduct
} from "../src/modules/products/product.admin.controller.js";

const DB = "everythingbd_size_variation_test";
const uri = process.env.MONGODB_URI;
const tag = crypto.randomUUID();

const productIds = [];
const orderIds = [];
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
    json(data) {
      this.body = data;
      return this;
    }
  };
}

async function updateProduct(product, data) {
  const res = mockRes();

  await adminUpdateProduct({
    params: { id: String(product._id) },
    body: data,
    get(header) {
      return header.toLowerCase() === "if-match"
        ? String(product.__v)
        : undefined;
    }
  }, res);

  return res;
}

async function main() {
  assert.ok(uri, "MONGODB_URI missing");

  const configuredDb = new URL(uri).pathname
    .replace(/^\//, "").split("?")[0];

  assert.notEqual(
    configuredDb.toLowerCase(),
    DB.toLowerCase(),
    "Unsafe database selection"
  );

  await mongoose.connect(uri, {
    dbName: DB,
    serverSelectionTimeoutMS: 10000
  });

  assert.equal(mongoose.connection.name, DB);
  pass("Isolated test database");

  const product = await Product.create({
    name: "History Protection Test Dress",
    slug: `history-dress-${tag}`,
    sku: `HISTORY-DRESS-${tag}`,
    category: "Women's Clothing",
    price: 1500,
    stock: 10,
    hasSizeVariants: true,
    sizeVariants: [
      { size: "M", stock: 5 },
      { size: "XL", stock: 5 }
    ],
    status: "active"
  });

  productIds.push(product._id);

  // Simulate a historical order without invoking
  // checkout or sending any marketing event.
  const order = await Order.create({
    requestId: crypto.randomUUID(),
    orderNumber: `TEST-${tag}`,
    customer: {
      name: "History Test Customer",
      phone: "01712345678"
    },
    shippingAddress: {
      district: "Mymensingh",
      area: "Sadar",
      address: "Temporary size history test address",
      deliveryZone: "outside_dhaka"
    },
    items: [{
      product: product._id,
      sku: product.sku,
      name: product.name,
      size: "M",
      price: 1500,
      quantity: 1,
      subtotal: 1500
    }],
    subtotal: 1500,
    deliveryCharge: 130,
    total: 1630,
    paymentMethod: "cod",
    orderStatus: "pending"
  });

  orderIds.push(order._id);
  pass("Historical order created in test DB");

  // Test 1: Cannot turn off variation mode.
  const disable = await updateProduct(product, {
    hasSizeVariants: false,
    sizeVariants: [],
    stock: 10
  });

  assert.equal(
    disable.statusCode, 409,
    JSON.stringify(disable.body)
  );
  pass("Size variation mode change blocked");

  // Test 2: Cannot rename a historical size.
  const rename = await updateProduct(product, {
    stock: 10,
    sizeVariants: [
      { size: "L", stock: 5 },
      { size: "XL", stock: 5 }
    ]
  });

  assert.equal(
    rename.statusCode, 409,
    JSON.stringify(rename.body)
  );
  pass("Historical size label change blocked");

  // Test 3: Stock editing must remain possible.
  const stockUpdate = await updateProduct(product, {
    stock: 12,
    sizeVariants: [
      { size: "M", stock: 7 },
      { size: "XL", stock: 5 }
    ]
  });

  assert.equal(
    stockUpdate.statusCode, 200,
    JSON.stringify(stockUpdate.body)
  );

  const saved = await Product.findById(product._id).lean();

  assert.equal(saved.stock, 12);
  assert.equal(saved.sizeVariants[0].stock, 7);
  assert.equal(saved.sizeVariants[1].stock, 5);

  pass("Size-wise stock editing remains available");

  // Test 4: Existing size mode stays enabled.
  assert.equal(saved.hasSizeVariants, true);
  assert.deepEqual(
    saved.sizeVariants.map(v => v.size),
    ["M", "XL"]
  );

  pass("Historical size configuration preserved");

  // Test 5: Product with no history can enable sizes.
  const fresh = await Product.create({
    name: "New Size Test Clothing",
    slug: `new-size-${tag}`,
    sku: `NEW-SIZE-${tag}`,
    category: "Kids Clothing",
    price: 900,
    stock: 10,
    status: "draft"
  });

  productIds.push(fresh._id);

  const enable = await updateProduct(fresh, {
    hasSizeVariants: true,
    stock: 10,
    sizeVariants: [
      { size: "2-3Y", stock: 4 },
      { size: "4-5Y", stock: 6 }
    ]
  });

  assert.equal(
    enable.statusCode, 200,
    JSON.stringify(enable.body)
  );

  pass("Product without history can enable sizes");

  console.log(`RESULT: ${passed}/7 tests passed`);
  console.log("ORDER HISTORY SAFETY TEST PASSED");
}

try {
  await main();
} catch (error) {
  console.error("TEST FAILED:", error.message);
  process.exitCode = 1;
} finally {
  try {
    if (mongoose.connection.readyState === 1) {
      assert.equal(
        mongoose.connection.name,
        DB,
        "Unsafe cleanup database"
      );

      if (orderIds.length) {
        await Order.deleteMany({
          _id: { $in: orderIds }
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
