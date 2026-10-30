import "dotenv/config";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { Product } from "../src/modules/products/product.model.js";
import { Order } from "../src/modules/orders/order.model.js";
import { createOrder } from "../src/modules/orders/order.controller.js";

const TEST_DB = "everythingbd_transaction_test";
const tag = crypto.randomUUID().slice(0, 12);
const productIds = [];
const requestIds = [];

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    set() { return this; },
    json(data) { this.body = data; return this; }
  };
}

async function sendOrder(requestId, items) {
  const res = mockRes();
  await createOrder({
    body: {
      requestId,
      customer: {
        name: "EverythingBD Test Customer",
        phone: "01712345678"
      },
      shippingAddress: {
        district: "Mymensingh",
        area: "Sadar",
        address: "Temporary safety test address",
        deliveryZone: "outside_dhaka"
      },
      items,
      paymentMethod: "cod"
    }
  }, res);
  return res;
}

async function createProduct(stock) {
  const product = await Product.create({
    name: "EverythingBD Safety Test",
    slug: `safety-${crypto.randomUUID()}`,
    sku: `SAFETY-${crypto.randomUUID()}`,
    category: "Skincare",
    price: 500,
    stock,
    status: "active",
    images: []
  });
  productIds.push(product._id);
  return product;
}

async function getStock(id) {
  const product = await Product.findById(id).lean();
  return product?.stock;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  assert.ok(uri, "MongoDB URI missing");

  // Never run these tests on the configured application database.
  const configuredDb = new URL(uri).pathname
    .replace(/^\//, "").split("?")[0];

  assert.notEqual(configuredDb, TEST_DB);

  await mongoose.connect(uri, {
    dbName: TEST_DB,
    serverSelectionTimeoutMS: 10000
  });

  assert.equal(mongoose.connection.name, TEST_DB);
  console.log("TEST DATABASE ISOLATION: PASS");

  process.env.DELIVERY_INSIDE_DHAKA = "80";
  process.env.DELIVERY_OUTSIDE_DHAKA = "130";

  await Product.init();
  await Order.init();

  // TEST 1: Transaction rollback after a stock failure.
  const first = await createProduct(10);
  const second = await createProduct(0);
  const rollbackId = crypto.randomUUID();
  requestIds.push(rollbackId);

  const failed = await sendOrder(rollbackId, [
    { productId: String(first._id), quantity: 2 },
    { productId: String(second._id), quantity: 1 }
  ]);

  console.log("ROLLBACK HTTP:", failed.statusCode);
  assert.equal(failed.statusCode, 409);
  assert.equal(await getStock(first._id), 10);
  assert.equal(await getStock(second._id), 0);
  assert.equal(
    await Order.countDocuments({ requestId: rollbackId }), 0
  );
  console.log("TRANSACTION ROLLBACK: PASS");

  // TEST 2: Simultaneous duplicate request IDs.
  const third = await createProduct(5);
  const duplicateId = crypto.randomUUID();
  requestIds.push(duplicateId);

  const item = [{
    productId: String(third._id),
    quantity: 2
  }];

  const outcomes = await Promise.all([
    sendOrder(duplicateId, item),
    sendOrder(duplicateId, item)
  ]);

  const codes = outcomes.map(x => x.statusCode).sort();
  const saved = await Order.countDocuments({
    requestId: duplicateId
  });
  const remaining = await getStock(third._id);

  console.log("DUPLICATE HTTP:", codes.join(", "));
  console.log("SAVED ORDERS:", saved);
  console.log("REMAINING STOCK:", remaining);

  assert.deepEqual(codes, [201, 409]);
  assert.equal(saved, 1);
  assert.equal(remaining, 3);

  console.log("SIMULTANEOUS DUPLICATE PROTECTION: PASS");
  console.log("ALL ORDER SAFETY TESTS PASSED");
}

async function cleanup() {
  if (mongoose.connection.readyState !== 1) return;
  assert.equal(mongoose.connection.name, TEST_DB);

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

  console.log("TEST RECORDS CLEANED");
}

try {
  await main();
} catch (error) {
  console.error("SAFETY TEST FAILED:", error.message);
  process.exitCode = 1;
} finally {
  try {
    await cleanup();
  } catch (error) {
    console.error("CLEANUP FAILED:", error.message);
    process.exitCode = 1;
  }
  await mongoose.disconnect();
}
