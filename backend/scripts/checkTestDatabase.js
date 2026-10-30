import "dotenv/config";
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
const testDb = "everythingbd_transaction_test";

async function main() {
  if (!uri) throw new Error("MongoDB URI missing");

  const uriDatabase = new URL(uri).pathname
    .replace(/^\//, "").split("?")[0];

  if (uriDatabase === testDb) {
    throw new Error("Test database matches URI database");
  }

  await mongoose.connect(uri, {
    dbName: testDb,
    autoIndex: false,
    serverSelectionTimeoutMS: 10000
  });

  if (mongoose.connection.name !== testDb) {
    throw new Error("Database isolation check failed");
  }

  const hello = await mongoose.connection.db
    .admin().command({ hello: 1 });

  console.log("MongoDB Connection: PASS");
  console.log("Selected Database:", mongoose.connection.name);
  console.log(
    "Transaction-capable topology:",
    hello.setName || hello.msg === "isdbgrid"
      ? "YES"
      : "NOT CONFIRMED"
  );

  console.log("No test data created");
}

main()
  .catch(error => {
    console.error("TEST FAILED:", error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
