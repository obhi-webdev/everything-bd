import "dotenv/config";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import { Product } from "../src/modules/products/product.model.js";
import { Order } from "../src/modules/orders/order.model.js";
import { createOrder } from "../src/modules/orders/order.controller.js";

const DB = "everythingbd_size_variation_test";
const uri = process.env.MONGODB_URI;
const tag = crypto.randomUUID();
const requestIds = [];
let productId = null;

function response() {
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

async function placeOrder(requestId) {
  const res = response();

  await createOrder({
    body: {
      requestId,
      customer: {
        name: "Size Concurrency Test",
        phone: "01712345678"
      },
      shippingAddress: {
        district: "Mymensingh",
        area: "Sadar",
        address: "Temporary size concurrency test address",
        deliveryZone: "outside_dhaka"
      },
      items: [{
        productId: String(productId),
        size: "M",
        quantity: 4
      }],
      paymentMethod: "cod"
    }
  }, res);

  return res;
}

async function main() {
  assert.ok(uri, "MongoDB URI missing");

  const configuredDb = new URL(uri).pathname
    .replace(/^\//, "")
    .split("?")[0];

  assert.notEqual(
    configuredDb.toLowerCase(),
    DB.toLowerCase(),
    "Unsafe database selection"
  );

  const { readFile } = await import("node:fs/promises");
  const source = await readFile(
    new URL("../src/modules/orders/order.controller.js", import.meta.url),
    "utf8"
  );

  assert.ok(
    source.includes(
      'mongoose.connection.name !== "everythingbd_size_variation_test"'
    ),
    "Test Meta tracking guard missing"
  );

  process.env.DELIVERY_INSIDE_DHAKA = "80";
  process.env.DELIVERY_OUTSIDE_DHAKA = "130";

  await mongoose.connect(uri, {
    dbName: DB,
    serverSelectionTimeoutMS: 10000
  });

  assert.equal(mongoose.connection.name, DB);
  console.log("PASS: Isolated database selected");

  await Product.init();
  await Order.init();

  const product = await Product.create({
    name: "Temporary Concurrent Size Test",
    slug: `size-concurrent-${tag}`,
    sku: `SIZE-CONCURRENT-${tag}`,
    category: "Clothing",
    price: 1200,
    stock: 5,
    hasSizeVariants: true,
    sizeVariants: [
      { size: "M", stock: 5 }
    ],
    status: "active",
    images: []
  });

  productId = product._id;

  const id1 = crypto.randomUUID();
  const id2 = crypto.randomUUID();
  requestIds.push(id1, id2);

  const results = await Promise.all([
    placeOrder(id1),
    placeOrder(id2)
  ]);

  const codes = results.map(r => r.statusCode).sort();

  console.log("Concurrent HTTP statuses:", codes.join(", "));

  const updated = await Product.findById(productId).lean();

  const mStock = updated.sizeVariants.find(
    v => v.size === "M"
  )?.stock;

  const count = await Order.countDocuments({
    requestId: { $in: requestIds }
  });

  console.log("Total stock:", updated.stock);
  console.log("M stock:", mStock);
  console.log("Saved orders:", count);

  assert.equal(
    count,
    1,
    "Exactly one order must be saved"
  );

  assert.equal(updated.stock, 1);
  assert.equal(mStock, 1);

  console.log("PASS: No overselling");
  console.log("PASS: Total and size stock consistent");

  assert.deepEqual(
    codes,
    [201, 409],
    "Expected one success and one stock rejection"
  );

  console.log("PASS: Concurrent order conflict handled");
  console.log("SIZE CONCURRENCY TEST PASSED");
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

      if (productId) {
        await Product.deleteOne({ _id: productId });
      }

      console.log("Temporary test records cleaned up");
    }
  } catch (error) {
    console.error("CLEANUP FAILED:", error.message);
    process.exitCode = 1;
  }

  await mongoose.disconnect();
}
