import "dotenv/config";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import mongoose from "mongoose";
import { readFile } from "node:fs/promises";

import { Product } from "../src/modules/products/product.model.js";
import { Order } from "../src/modules/orders/order.model.js";
import { createOrder } from "../src/modules/orders/order.controller.js";
import { adminUpdateProduct } from "../src/modules/products/product.admin.controller.js";

const DB = "everythingbd_size_variation_test";
const uri = process.env.MONGODB_URI;
const tag = crypto.randomUUID();
const requestId = crypto.randomUUID();

let productId = null;

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    set() { return this; },
    json(data) { this.body = data; return this; }
  };
}

async function callController(fn, req) {
  const res = mockRes();
  let forwarded;

  await fn(req, res, err => { forwarded = err; });

  if (forwarded) throw forwarded;
  return res;
}

async function placeOrder() {
  return callController(createOrder, {
    body: {
      requestId,
      customer: {
        name: "Temporary Race Test Customer",
        phone: "01712345678"
      },
      shippingAddress: {
        district: "Mymensingh",
        area: "Sadar",
        address: "Temporary race condition test address",
        deliveryZone: "outside_dhaka"
      },
      items: [{
        productId: String(productId),
        quantity: 2
      }],
      paymentMethod: "cod"
    }
  });
}

async function enableSizes(version) {
  return callController(adminUpdateProduct, {
    params: { id: String(productId) },
    get(name) {
      return name.toLowerCase() === "if-match"
        ? String(version)
        : undefined;
    },
    body: {
      hasSizeVariants: true,
      stock: 5,
      sizeVariants: [
        { size: "M", stock: 3 },
        { size: "L", stock: 2 }
      ]
    }
  });
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
    "Meta tracking isolation guard missing"
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
    "Transaction-capable database required"
  );

  console.log("PASS: Isolated test database");

  await Product.init();
  await Order.init();

  const product = await Product.create({
    name: "Temporary Race Test Clothing",
    slug: `size-race-${tag}`,
    sku: `SIZE-RACE-${tag}`,
    category: "Clothing",
    price: 1200,
    stock: 5,
    hasSizeVariants: false,
    sizeVariants: [],
    status: "active"
  });

  productId = product._id;

  const results = await Promise.allSettled([
    placeOrder(),
    enableSizes(product.__v)
  ]);

  const [orderResult, adminResult] = results.map(result =>
    result.status === "fulfilled"
      ? result.value
      : {
          statusCode: 500,
          body: { message: String(result.reason) }
        }
  );

  console.log("Customer order HTTP:", orderResult.statusCode);
  console.log("Admin update HTTP:", adminResult.statusCode);

  const saved = await Product.findById(productId).lean();
  const orders = await Order.find({ requestId }).lean();

  assert.ok(saved);
  assert.ok(orders.length <= 1);

  const orderSucceeded = orderResult.statusCode === 201;
  const adminSucceeded = adminResult.statusCode === 200;

  assert.equal(
    Number(orderSucceeded) + Number(adminSucceeded),
    1,
    "Exactly one conflicting operation should succeed"
  );

  console.log("PASS: Conflicting operations cannot both succeed");

  if (orderSucceeded) {
    assert.equal(orders.length, 1);
    assert.equal(saved.hasSizeVariants, false);
    assert.equal(saved.stock, 3);

    console.log("PASS: Order won; original inventory preserved");
  } else {
    assert.equal(orders.length, 0);
    assert.equal(saved.hasSizeVariants, true);
    assert.equal(saved.stock, 5);

    const sizes = Object.fromEntries(
      saved.sizeVariants.map(v => [v.size, v.stock])
    );

    assert.deepEqual(sizes, { M: 3, L: 2 });

    console.log("PASS: Admin won; size inventory consistent");
  }

  console.log("ADMIN/CHECKOUT RACE SAFETY: PASSED");

  if (
    orderResult.statusCode === 500 ||
    adminResult.statusCode === 500
  ) {
    console.log(
      "WARNING: Conflict produced HTTP 500. " +
      "Error handling needs improvement before release."
    );
    process.exitCode = 1;
  }
}

try {
  await main();
} catch (error) {
  console.error("RACE TEST FAILED:", error.message);
  process.exitCode = 1;
} finally {
  try {
    if (mongoose.connection.readyState === 1) {
      assert.equal(mongoose.connection.name, DB);

      await Order.deleteMany({ requestId });

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
