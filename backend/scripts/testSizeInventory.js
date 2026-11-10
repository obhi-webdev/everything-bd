import "dotenv/config";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { Product } from "../src/modules/products/product.model.js";

const TEST_DB = "everythingbd_size_variation_test";
const uri = process.env.MONGODB_URI;
const tag = crypto.randomUUID();
let productId = null;
let passed = 0;

function pass(message) {
  passed++;
  console.log("PASS:", message);
}

async function getProduct() {
  return Product.findById(productId).lean();
}

async function checkStock(total, m, xl) {
  const product = await getProduct();
  assert.ok(product);

  const sizes = Object.fromEntries(
    product.sizeVariants.map(v => [v.size, v.stock])
  );

  assert.equal(product.stock, total);
  assert.equal(sizes.M, m);
  assert.equal(sizes.XL, xl);
  assert.equal(sizes.M + sizes.XL, total);
}

async function changeStock(size, quantity, direction = -1) {
  await mongoose.connection.transaction(async session => {
    const filter = {
      _id: productId,
      hasSizeVariants: true,
      "sizeVariants": {
        $elemMatch: {
          size,
          ...(direction < 0 ? { stock: { $gte: quantity } } : {})
        }
      }
    };

    if (direction < 0) {
      filter.stock = { $gte: quantity };
    }

    const result = await Product.updateOne(
      filter,
      {
        $inc: {
          stock: direction * quantity,
          "sizeVariants.$.stock": direction * quantity
        }
      },
      { session }
    );

    if (result.matchedCount !== 1) {
      throw new Error(`Insufficient stock or missing size: ${size}`);
    }
  });
}

async function main() {
  assert.ok(uri, "MONGODB_URI is missing");

  const configuredDb = new URL(uri).pathname
    .replace(/^\//, "")
    .split("?")[0];

  assert.notEqual(
    configuredDb.toLowerCase(),
    TEST_DB.toLowerCase(),
    "Configured database must not be the test database"
  );

  await mongoose.connect(uri, {
    dbName: TEST_DB,
    serverSelectionTimeoutMS: 10000
  });

  assert.equal(mongoose.connection.name, TEST_DB);
  pass("Separate test database selected");

  const hello = await mongoose.connection.db
    .admin().command({ hello: 1 });

  assert.ok(
    hello.setName || hello.msg === "isdbgrid",
    "MongoDB topology does not support transactions"
  );

  pass("Transaction-capable MongoDB");

  const product = await Product.create({
    name: "Temporary Clothing Size Test",
    slug: `size-test-${tag}`,
    sku: `SIZE-TEST-${tag}`,
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

  productId = product._id;

  await checkStock(15, 5, 10);
  pass("Initial inventory M=5 XL=10 Total=15");

  await changeStock("M", 2);
  await checkStock(13, 3, 10);
  pass("M size purchase reduces only M and total");

  await changeStock("XL", 3);
  await checkStock(10, 3, 7);
  pass("XL size purchase reduces only XL and total");

  let rejected = false;

  try {
    await changeStock("M", 100);
  } catch {
    rejected = true;
  }

  assert.equal(rejected, true);
  await checkStock(10, 3, 7);
  pass("Insufficient size stock rejected");

  // Two writes in one transaction: second fails.
  // First write must also roll back.
  let rolledBack = false;

  try {
    await mongoose.connection.transaction(async session => {
      const first = await Product.updateOne(
        {
          _id: productId,
          "sizeVariants": {
            $elemMatch: { size: "M", stock: { $gte: 1 } }
          }
        },
        {
          $inc: {
            stock: -1,
            "sizeVariants.$.stock": -1
          }
        },
        { session }
      );

      assert.equal(first.matchedCount, 1);

      const second = await Product.updateOne(
        {
          _id: productId,
          "sizeVariants": {
            $elemMatch: { size: "XL", stock: { $gte: 100 } }
          }
        },
        {
          $inc: {
            stock: -100,
            "sizeVariants.$.stock": -100
          }
        },
        { session }
      );

      if (second.matchedCount !== 1) {
        throw new Error("Second size unavailable");
      }
    });
  } catch (error) {
    if (error.message === "Second size unavailable") {
      rolledBack = true;
    } else {
      throw error;
    }
  }

  assert.equal(rolledBack, true);
  await checkStock(10, 3, 7);
  pass("Failed multi-size transaction rolls back");

  await changeStock("M", 2, 1);
  await checkStock(12, 5, 7);
  pass("M size stock can be restored atomically");

  await changeStock("XL", 3, 1);
  await checkStock(15, 5, 10);
  pass("XL size stock can be restored atomically");

  console.log(`RESULT: ${passed}/${passed} tests passed`);
  console.log("SIZE INVENTORY TRANSACTION TEST PASSED");
}

try {
  await main();
} catch (error) {
  console.error("TEST FAILED:", error.message);
  process.exitCode = 1;
} finally {
  try {
    if (mongoose.connection.readyState === 1) {
      if (mongoose.connection.name !== TEST_DB) {
        throw new Error("Unsafe cleanup database");
      }

      if (productId) {
        await Product.deleteOne({ _id: productId });
        console.log("Temporary test product cleaned up");
      }
    }
  } catch (error) {
    console.error("CLEANUP FAILED:", error.message);
    process.exitCode = 1;
  }

  await mongoose.disconnect();
}
