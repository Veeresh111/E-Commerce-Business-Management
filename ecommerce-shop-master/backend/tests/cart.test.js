import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import app from "../app.js";
import { setupTestDb, teardownTestDb, clearDb, signupAndGetAgent, createTestProduct } from "./helpers.js";

const redisStore = vi.hoisted(() => new Map());

vi.mock("../lib/redis.js", () => ({
	redis: {
		get: vi.fn(async (key) => (redisStore.has(key) ? redisStore.get(key) : null)),
		set: vi.fn(async (key, value) => {
			redisStore.set(key, value);
			return "OK";
		}),
		del: vi.fn(async (key) => {
			const existed = redisStore.delete(key);
			return existed ? 1 : 0;
		}),
		quit: vi.fn(),
	},
}));

describe("Cart API", () => {
	let agent;

	beforeAll(setupTestDb);

	beforeEach(async () => {
		await clearDb();
		redisStore.clear();
		({ agent } = await signupAndGetAgent());
	});

	afterAll(async () => {
		await teardownTestDb();
	});

	describe("POST /api/cart (addToCart)", () => {
		it("rejects an invalid product id", async () => {
			const res = await agent.post("/api/cart").send({ productId: "not-an-object-id" });
			expect(res.status).toBe(400);
		});

		it("returns 404 for a nonexistent product", async () => {
			const res = await agent.post("/api/cart").send({ productId: "507f1f77bcf86cd799439011" });
			expect(res.status).toBe(404);
		});

		it("rejects adding an out-of-stock product", async () => {
			const product = await createTestProduct({ stock: 0 });
			const res = await agent.post("/api/cart").send({ productId: String(product._id) });
			expect(res.status).toBe(400);
			expect(res.body.message).toMatch(/out of stock/i);
		});

		it("adds a product to the cart", async () => {
			const product = await createTestProduct();
			const res = await agent.post("/api/cart").send({ productId: String(product._id) });
			expect(res.status).toBe(200);
			expect(res.body).toHaveLength(1);
		});

		it("increments quantity for repeated adds but caps at stock", async () => {
			const product = await createTestProduct({ stock: 2 });
			await agent.post("/api/cart").send({ productId: String(product._id) });
			await agent.post("/api/cart").send({ productId: String(product._id) });

			const res = await agent.post("/api/cart").send({ productId: String(product._id) });
			expect(res.status).toBe(400);
			expect(res.body.message).toMatch(/maximum quantity/i);
		});
	});

	describe("PUT /api/cart/:id (updateQuantity)", () => {
		it("rejects negative quantities", async () => {
			const product = await createTestProduct();
			await agent.post("/api/cart").send({ productId: String(product._id) });

			const res = await agent.put(`/api/cart/${product._id}`).send({ quantity: -5 });
			expect(res.status).toBe(400);
		});

		it("rejects non-numeric quantities", async () => {
			const product = await createTestProduct();
			await agent.post("/api/cart").send({ productId: String(product._id) });

			const res = await agent.put(`/api/cart/${product._id}`).send({ quantity: "abc" });
			expect(res.status).toBe(400);
		});

		it("removes the item when quantity is 0", async () => {
			const product = await createTestProduct();
			await agent.post("/api/cart").send({ productId: String(product._id) });

			const res = await agent.put(`/api/cart/${product._id}`).send({ quantity: 0 });
			expect(res.status).toBe(200);
			expect(res.body).toHaveLength(0);
		});

		it("caps quantity at available stock", async () => {
			const product = await createTestProduct({ stock: 3 });
			await agent.post("/api/cart").send({ productId: String(product._id) });

			const res = await agent.put(`/api/cart/${product._id}`).send({ quantity: 99 });
			expect(res.status).toBe(200);
			expect(res.body[0].quantity).toBe(3);
		});

		it("returns 404 for items not in the cart", async () => {
			const product = await createTestProduct();
			const res = await agent.put(`/api/cart/${product._id}`).send({ quantity: 2 });
			expect(res.status).toBe(404);
		});
	});

	describe("GET /api/cart (getCartProducts)", () => {
		it("returns cart items with quantities and stock", async () => {
			const product = await createTestProduct({ stock: 5 });
			await agent.post("/api/cart").send({ productId: String(product._id) });

			const res = await agent.get("/api/cart");
			expect(res.status).toBe(200);
			expect(res.body).toHaveLength(1);
			expect(res.body[0]._id).toBe(String(product._id));
			expect(res.body[0].quantity).toBe(1);
			expect(res.body[0].availableStock).toBe(5);
		});
	});

	describe("DELETE /api/cart (removeAllFromCart)", () => {
		it("clears the whole cart without a productId", async () => {
			const product = await createTestProduct();
			await agent.post("/api/cart").send({ productId: String(product._id) });

			const res = await agent.delete("/api/cart");
			expect(res.status).toBe(200);
			expect(res.body).toHaveLength(0);
		});

		it("removes a single product", async () => {
			const product = await createTestProduct();
			await agent.post("/api/cart").send({ productId: String(product._id) });

			const res = await agent.delete("/api/cart").send({ productId: String(product._id) });
			expect(res.status).toBe(200);
			expect(res.body).toHaveLength(0);
		});
	});
});