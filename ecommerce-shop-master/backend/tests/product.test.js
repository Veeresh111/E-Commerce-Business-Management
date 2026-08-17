import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../app.js";
import Product from "../models/product.model.js";
import { setupTestDb, teardownTestDb, clearDb, signupAndGetAgent, createTestUser } from "./helpers.js";

const redisStore = vi.hoisted(() => new Map());

vi.mock("../lib/cloudinary.js", () => ({
	default: {
		uploader: {
			upload: vi.fn(async () => ({
				secure_url: "https://res.cloudinary.com/test/products/sample.jpg",
			})),
			destroy: vi.fn(async () => ({ result: "ok" })),
		},
	},
}));

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

describe("Product API", () => {
	let adminAgent;

	beforeAll(setupTestDb);

	beforeEach(async () => {
		await clearDb();
		redisStore.clear();
		({ agent: adminAgent } = await signupAndGetAgent({ role: "admin" }));
	});

	afterAll(async () => {
		await teardownTestDb();
	});

	describe("POST /api/products (createProduct)", () => {
		it("requires admin role", async () => {
			const { agent } = await signupAndGetAgent();
			const res = await agent.post("/api/products").send({ name: "X", description: "Y", price: 10, category: "jeans" });
			expect(res.status).toBe(403);
		});

		it("creates a product as admin", async () => {
			const res = await adminAgent.post("/api/products").send({
				name: "Classic Jeans",
				description: "Comfortable denim",
				price: 49.99,
				category: "jeans",
				image: "data:image/jpeg;base64,ZmFrZQ==",
			});

			expect(res.status).toBe(201);
			expect(res.body.name).toBe("Classic Jeans");
			expect(res.body.stock).toBe(100); // default stock
		});

		it("rejects invalid prices", async () => {
			const res = await adminAgent.post("/api/products").send({
				name: "Jeans",
				description: "Denim",
				price: -5,
				category: "jeans",
			});
			expect(res.status).toBe(400);
		});

		it("rejects missing required fields", async () => {
			const res = await adminAgent.post("/api/products").send({ name: "OnlyName" });
			expect(res.status).toBe(400);
		});
	});

	describe("GET /api/products (getAllProducts, admin)", () => {
		it("paginates results", async () => {
			await Product.insertMany(
				Array.from({ length: 25 }, (_, i) => ({
					name: `Product ${i}`,
					description: `Desc ${i}`,
					price: 10 + i,
					image: "https://example.com/img.jpg",
					category: "jeans",
				}))
			);

			const res = await adminAgent.get("/api/products?page=1&limit=10");

			expect(res.status).toBe(200);
			expect(res.body.products).toHaveLength(10);
			expect(res.body.pagination.total).toBe(25);
			expect(res.body.pagination.totalPages).toBe(3);
		});
	});

	describe("GET /api/products/category/:category", () => {
		it("returns only products in the category", async () => {
			await Product.create({ name: "Jeans A", description: "d", price: 10, image: "i", category: "jeans" });
			await Product.create({ name: "Shoes A", description: "d", price: 20, image: "i", category: "shoes" });

			const res = await request(app).get("/api/products/category/jeans");
			expect(res.status).toBe(200);
			expect(res.body.products).toHaveLength(1);
			expect(res.body.products[0].category).toBe("jeans");
		});
	});

	describe("GET /api/products/search", () => {
		it("finds products by query", async () => {
			await Product.create({ name: "Leather Jacket", description: "Premium leather", price: 120, image: "i", category: "jackets" });
			await Product.create({ name: "Denim Jacket", description: "Casual denim", price: 80, image: "i", category: "jackets" });
			await Product.create({ name: "Running Shoes", description: "Sporty", price: 90, image: "i", category: "shoes" });

			const res = await request(app).get("/api/products/search?q=jacket");

			expect(res.status).toBe(200);
			expect(res.body.products.length).toBeGreaterThanOrEqual(2);
			expect(res.body.products.every((p) => p.name.toLowerCase().includes("jacket"))).toBe(true);
		});

		it("requires a query", async () => {
			const res = await request(app).get("/api/products/search");
			expect(res.status).toBe(400);
		});
	});

	describe("GET /api/products/featured", () => {
		it("returns an empty array when nothing is featured", async () => {
			const res = await request(app).get("/api/products/featured");
			expect(res.status).toBe(200);
			expect(res.body).toEqual([]);
		});

		it("returns featured products", async () => {
			await Product.create({ name: "Featured A", description: "d", price: 10, image: "i", category: "jeans", isFeatured: true });
			const res = await request(app).get("/api/products/featured");
			expect(res.status).toBe(200);
			expect(res.body).toHaveLength(1);
		});
	});

	describe("PATCH /api/products/:id (toggleFeaturedProduct)", () => {
		it("toggles the featured flag as admin", async () => {
			const product = await Product.create({ name: "P", description: "d", price: 10, image: "i", category: "jeans" });

			const res = await adminAgent.patch(`/api/products/${product._id}`);
			expect(res.status).toBe(200);
			expect(res.body.isFeatured).toBe(true);

			const res2 = await adminAgent.patch(`/api/products/${product._id}`);
			expect(res2.status).toBe(200);
			expect(res2.body.isFeatured).toBe(false);
		});
	});

	describe("DELETE /api/products/:id", () => {
		it("deletes a product as admin", async () => {
			const product = await Product.create({
				name: "P",
				description: "d",
				price: 10,
				image: "https://res.cloudinary.com/test/products/p.jpg",
				category: "jeans",
			});

			const res = await adminAgent.delete(`/api/products/${product._id}`);
			expect(res.status).toBe(200);
			expect(await Product.findById(product._id)).toBeNull();
		});

		it("returns 404 for a missing product", async () => {
			const res = await adminAgent.delete("/api/products/507f1f77bcf86cd799439011");
			expect(res.status).toBe(404);
		});
	});
});