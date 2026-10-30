import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/database.js";

const PORT = Number(process.env.PORT || 5001);

const connected = await connectDB();

if (!connected) {
  console.error("Database unavailable. API not started.");
  process.exitCode = 1;
} else {
  const server = app.listen(PORT, "127.0.0.1", () => {
    console.log("EverythingBD Backend Running");
    console.log(`API: http://localhost:${PORT}`);
    console.log("MongoDB: Connected");
  });

  process.on("SIGTERM", () => {
    server.close(() => process.exit(0));
  });
}
