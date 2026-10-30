import "dotenv/config";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import { Product } from "../src/modules/products/product.model.js";
import { Order } from "../src/modules/orders/order.model.js";
import { createOrder } from "../src/modules/orders/order.controller.js";
import { updateAdminOrderStatus } from "../src/modules/orders/order.admin.controller.js";

const TEST_DB = "everythingbd_transaction_test";
const tag = crypto.randomUUID().slice(0, 12);
const requestIds = [];
let productId = null;

function mockResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    set() { return this; },
    json(data) { this.body = data; return this; }
  };
}

async function callController(fn, req) {
  const res = mockResponse();
  let capturedError = null;

  await fn(req, res, error => {
    capturedError = error;
  });

  if (capturedError) throw capturedError;
  return res;
}

async function stock() {
  const product = await Product.findById(productId).lean();
  return product?.stock;
}

function payload(id, quantity = 2) {
  return {
    requestId: id,
    customer: {
      name: "Transaction Test Customer",
      phone: "01712345678"
    },
    shippingAddress: {
      district: "Mymensingh",
      area: "Sadar",
      address: "Temporary transaction test address",
      deliveryZone: "outside_dhaka"
    },
    items: [{
      productId: String(productId),
      quantity
    }],
    paymentMethod: "cod"
  };
}

async function main() {
  const uri = process.env.MONGODB_URI;
  assert.ok(uri, "MongoDB URI missing");

  const productionDb = new URL(uri).pathname.replace(/^\//, "");
  assert.notEqual(productionDb, TEST_DB, "Unsafe database selection");

  await mongoose.connect(uri, {
    dbName: TEST_DB,
    serverSelectionTimeoutMS: 10000
  });

  assert.equal(mongoose.connection.name, TEST_DB);
  console.log("TEST DATABASE:", mongoose.connection.name);

  process.env.DELIVERY_INSIDE_DHAKA = "80";
  process.env.DELIVERY_OUTSIDE_DHAKA = "130";

  await Product.init();
  await Order.init();

  const product = await Product.create({
    name: "EverythingBD Temporary Test Product",
    slug: `ebd-transaction-${tag}`,
    sku: `EBD-TEST-${tag}`,
    category: "Skincare",
    price: 450,
    stock: 10,
    status: "active",
    images: []
  });

  productId = product._id;
  assert.equal(await stock(), 10);
  console.log("Test Product Created: PASS");

  const firstId = crypto.randomUUID();
  requestIds.push(firstId);

  const first = await callController(createOrder, {
    body: payload(firstId, 2)
  });

  assert.equal(first.statusCode, 201, JSON.stringify(first.body));
  assert.equal(first.body.data.total, 1030);
  assert.equal(await stock(), 8);
  console.log("Order Creation & Stock 10 -> 8: PASS");

  const repeated = await callController(createOrder, {
    body: payload(firstId, 2)
  });

  assert.equal(repeated.statusCode, 409);
  assert.equal(await Order.countDocuments({ requestId: firstId }), 1);
  assert.equal(await stock(), 8);
  console.log("Duplicate Request Protection: PASS");

  const firstOrder = await Order.findOne({ requestId: firstId });
  assert.ok(firstOrder);

  const cancel = await callController(updateAdminOrderStatus, {
    params: { id: String(firstOrder._id) },
    body: { status: "cancelled" }
  });

  assert.equal(cancel.statusCode, 200);
  assert.equal(await stock(), 10);
  console.log("Cancellation Stock Restore 8 -> 10: PASS");

  const cancelAgain = await callController(updateAdminOrderStatus, {
    params: { id: String(firstOrder._id) },
    body: { status: "cancelled" }
  });

  assert.equal(cancelAgain.statusCode, 409);
  assert.equal(await stock(), 10);
  console.log("Double Cancellation Protection: PASS");

  const secondId = crypto.randomUUID();
  requestIds.push(secondId);

  const second = await callController(createOrder, {
    body: payload(secondId, 1)
  });

  assert.equal(second.statusCode, 201, JSON.stringify(second.body));
  assert.equal(await stock(), 9);

  const secondOrder = await Order.findOne({ requestId: secondId });

  for (const status of [
    "confirmed", "processing", "shipped", "delivered"
  ]) {
    const result = await callController(updateAdminOrderStatus, {
      params: { id: String(secondOrder._id) },
      body: { status }
    });

    assert.equal(result.statusCode, 200, JSON.stringify(result.body));
    assert.equal(result.body.data.orderStatus, status);
  }

  assert.equal(await stock(), 9);
  console.log("Full Status Workflow: PASS");
  console.log("Delivered Order Stock Remains 9: PASS");
  console.log("ALL TRANSACTION TESTS PASSED");
}

async function cleanup() {
  if (mongoose.connection.readyState !== 1) return;
  if (mongoose.connection.name !== TEST_DB) {
    throw new Error("Cleanup stopped: wrong database");
  }

  if (requestIds.length) {
    await Order.deleteMany({ requestId: { $in: requestIds } });
  }

  if (productId) {
    await Product.deleteOne({ _id: productId });
  }

  console.log("Temporary Test Records: CLEANED");
}

try {
  await main();
} catch (error) {
  console.error("TRANSACTION TEST FAILED:", error.message);
  process.exitCode = 1;
} finally {
  try {
    await cleanup();
  } catch (error) {
    console.error("Cleanup failed:", error.message);
    process.exitCode = 1;
  }
  await mongoose.disconnect();
}
