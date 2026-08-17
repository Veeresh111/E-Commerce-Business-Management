import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

/**
 * Minimal in-memory Redis shim used only when UPSTASH_REDIS_URL is not set
 * (local development without a Redis server). Supports the subset of
 * commands the app uses: get, set (with EX), del, quit.
 */
class InMemoryRedis {
	constructor() {
		this.store = new Map();
	}

	async get(key) {
		const entry = this.store.get(key);
		if (!entry) return null;
		if (entry.expiresAt && entry.expiresAt < Date.now()) {
			this.store.delete(key);
			return null;
		}
		return entry.value;
	}

	async set(key, value, mode, ttl) {
		let expiresAt = null;
		if (mode === "EX" && Number.isFinite(ttl)) {
			expiresAt = Date.now() + ttl * 1000;
		}
		this.store.set(key, { value: String(value), expiresAt });
		return "OK";
	}

	async del(...keys) {
		let count = 0;
		for (const key of keys) {
			if (this.store.delete(key)) count += 1;
		}
		return count;
	}

	async quit() {
		this.store.clear();
		return "OK";
	}

	on() {
		// no-op for the in-memory fallback
	}
}

const redisUrl = process.env.UPSTASH_REDIS_URL;

let redis;
if (redisUrl) {
	redis = new Redis(redisUrl, {
		connectTimeout: 5000,
		maxRetriesPerRequest: 3,
		retryStrategy: (times) => Math.min(times * 200, 2000),
	});
	redis.on("error", (err) => {
		console.error("Redis connection error:", err.message);
	});
} else {
	console.warn(
		"[redis] UPSTASH_REDIS_URL not set — using in-memory fallback (dev only, resets on restart)."
	);
	redis = new InMemoryRedis();
}

export { redis };