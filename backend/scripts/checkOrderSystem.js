import "dotenv/config";
import mongoose from "mongoose";
import { Product } from "../src/modules/products/product.model.js";
import { Order } from "../src/modules/orders/order.model.js";

async function main() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI missing");
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000
  });

  const hello = await mongoose.connection.db
    .admin().command({ hello: 1 });

  const [products, orders] = await Promise.all([
    Product.countDocuments(),
    Order.countDocuments()
  ]);

  console.log("EverythingBD Database Diagnostic");
  console.log("--------------------------------");
  console.log("MongoDB Connection: PASS");
  console.log("Product Model:", Product.modelName);
  console.log("Order Model:", Order.modelName);
  console.log("Total Products:", products);
  console.log("Total Orders:", orders);

  const capable = Boolean(
    hello.setName || hello.msg === "isdbgrid"
  );

  console.log(
    "Transaction-capable topology:",
    capable ? "YES" : "NOT CONFIRMED"
  );

  for (const field of [
    "requestId", "orderNumber", "customer",
    "shippingAddress", "items", "subtotal",
    "deliveryCharge", "total", "orderStatus"
  ]) {
    console.log(
      "Schema " + field + ":",
      Order.schema.path(field) ? "OK" : "MISSING"
    );
  }

  for (const key of [
    "DELIVERY_INSIDE_DHAKA",
    "DELIVERY_OUTSIDE_DHAKA"
  ]) {
    const raw = process.env[key];

    const valid =
      typeof raw === "string" &&
      raw.trim() !== "" &&
      Number.isFinite(Number(raw)) &&
      Number(raw) >= 0;

    console.log(key + ":", valid ? "SET" : "PENDING");
  }
}

main()
  .catch(error => {
    console.error("Diagnostic failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
