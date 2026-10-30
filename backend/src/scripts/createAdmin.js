import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import readline from "node:readline/promises";
import { execFileSync } from "node:child_process";
import { stdin, stdout } from "node:process";
import { User } from "../modules/users/user.model.js";

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI missing");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const adminExists = await User.exists({ role: "admin" });

  if (adminExists) {
    console.log("An admin already exists. No changes made.");
    return;
  }

  if (!stdin.isTTY) {
    throw new Error("Run this script in an interactive Terminal");
  }

  const rl = readline.createInterface({
    input: stdin,
    output: stdout
  });

  let name;
  let email;

  try {
    name = (await rl.question("Admin name: ")).trim();
    email = (await rl.question("Admin email: "))
      .trim()
      .toLowerCase();
  } finally {
    rl.close();
  }

  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Valid name and email required");
  }

  if (await User.exists({ email })) {
    throw new Error("Email already registered");
  }

  // Disable terminal echo before reading password.
  execFileSync("stty", ["-echo"], {
    stdio: ["inherit", "inherit", "inherit"]
  });

  let password;

  try {
    const passwordReader = readline.createInterface({
      input: stdin,
      output: stdout
    });

    try {
      password = await passwordReader.question(
        "Admin password (hidden): "
      );
    } finally {
      passwordReader.close();
    }
  } finally {
    execFileSync("stty", ["echo"], {
      stdio: ["inherit", "inherit", "inherit"]
    });
    stdout.write("\n");
  }

  if (password.length < 12 || password.length > 72) {
    throw new Error("Password must be 12-72 characters");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Avoid retaining plaintext password unnecessarily.
  password = null;

  const admin = await User.create({
    name,
    email,
    passwordHash,
    role: "admin",
    isActive: true
  });

  console.log("Admin account created successfully!");
  console.log("Admin ID:", String(admin._id));
}

try {
  await main();
} catch (error) {
  console.error("Admin setup failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
