import "dotenv/config";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { Product } from "../src/modules/products/product.model.js";
import { Order } from "../src/modules/orders/order.model.js";
import { createOrder } from "../src/modules/orders/order.controller.js";

const DB = "everythingbd_transaction_test";
const tag = crypto.randomUUID();
const ids = [];
let productId;

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    set() { return this; },
    json(data) { this.body = data; return this; }
  };
}

async function place(requestId, quantity) {
  const res = response();

  await createOrder({
    body: {
      requestId,
      customer: {
        name: "Concurrent Test Customer",
        phone: "01712345678"
      },
      shippingAddress: {
        district: "Mymensingh",
        area: "Sadar",
        address: "Temporary concurrent checkout test address",
        deliveryZone: "outside_dhaka"
      },
      items: [{ productId: String(productId), quantity }],
      paymentMethod: "cod"
    }
  }, res);

  return res;
}

async function currentStock() {
  return (await Product.findById(productId).lean()).stock;
}

async function main() {
  assert.ok(process.env.MONGODB_URI);

  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: DB,
    serverSelectionTimeoutMS: 10000
  });

  assert.equal(mongoose.connection.name, DB);
  console.log("Test Database Isolation: PASS");

  process.env.DELIVERY_INSIDE_DHAKA = "80";
  process.env.DELIVERY_OUTSIDE_DHAKA = "130";

  await Product.init();
  await Order.init();

  const product = await Product.create({
    name: "Concurrent Test Product",
    slug: `concurrent-${tag}`,
    sku: `TEST-${tag}`,
    category: "Skincare",
    price: 500,
    stock: 5,
    status: "active"
  });

  productId = product._id;
  assert.equal(await currentStock(), 5);
  console.log("Initial Stock: 5");

  const firstId = crypto.randomUUID();
  const secondId = crypto.randomUUID();
  ids.push(firstId, secondId);

  const results = await Promise.all([
    place(firstId, 4),
    place(secondId, 4)
  ]);

  console.log(
    "Concurrent HTTP Results:",
    results.map(r => r.statusCode).join(", ")
  );

  const successful = results.filter(r => r.statusCode === 201);
  const rejected = results.filter(r => r.statusCode === 409);

  const saved = await Order.countDocuments({
    requestId: { $in: ids }
  });

  const remaining = await currentStock();

  console.log("Successful Orders:", successful.length);
  console.log("Rejected Orders:", rejected.length);
  console.log("Saved Orders:", saved);
  console.log("Remaining Stock:", remaining);

  assert.equal(successful.length, 1);
  assert.equal(rejected.length, 1);
  assert.equal(saved, 1);
  assert.equal(remaining, 1);

  console.log("CONCURRENT ORDER TEST: PASS");
  console.log("OVERSELLING PROTECTION: PASS");
}

async function cleanup() {
  if (mongoose.connection.readyState !== 1) return;

  assert.equal(mongoose.connection.name, DB);

  if (ids.length) {
    await Order.deleteMany({ requestId: { $in: ids } });
  }

  if (productId) {
    await Product.deleteOne({ _id: productId });
  }

  console.log("Temporary Test Records: CLEANED");
}

try {
  await main();
} catch (error) {
  console.error("CONCURRENT TEST FAILED:", error.message);
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
