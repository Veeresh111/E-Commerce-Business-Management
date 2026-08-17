import dotenv from "dotenv";
import app from "./app.js";
import { connectDB } from "./lib/db.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
	console.log("Server is running on http://localhost:" + PORT);
	connectDB();
});

// --- Graceful shutdown ---
const shutdown = async () => {
	console.log("Shutting down gracefully...");
	server.close(async () => {
		const { redis } = await import("./lib/redis.js");
		redis.quit();
		process.exit(0);
	});
	setTimeout(() => process.exit(1), 10000).unref();
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);