import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/database.js";



async function startServer() {
  try {
    const connected = await connectDB();

    if (!connected) {
      throw new Error("MongoDB connection failed");
    }

    const PORT = Number(process.env.PORT || 3000);

    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`EverythingBD Backend running on port ${PORT}`);
      console.log("MongoDB: Connected");
    });

    server.on("error", (error) => {
      console.error("Server listen error:", error);
      process.exit(1);
    });

    process.on("SIGTERM", () => {
      server.close(() => process.exit(0));
    });
  } catch (error) {
    console.error("Backend startup failed:", error);
    process.exitCode = 1;
  }
}

startServer();
