import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import request from "supertest";
import app from "../app.js";
import Product from "../models/product.model.js";
import { setupTestDb, teardownTestDb, clearDb, signupAndGetAgent } from "./helpers.js";

describe("AI Engine & Competitor Intelligence API", () => {
	let product;
	let userAgent;

	beforeAll(setupTestDb);

	beforeEach(async () => {
		await clearDb();
		({ agent: userAgent } = await signupAndGetAgent());

		product = await Product.create({
			name: "Ultra Noise Cancelling Headphones",
			description: "State-of-the-art wireless headphones with 40h battery.",
			price: 199.99,
			originalPrice: 249.99,
			image: "https://example.com/headphones.jpg",
			category: "electronics",
			stock: 50,
			tags: ["electronics", "audio", "headphones"],
		});
	});

	afterAll(async () => {
		await teardownTestDb();
	});

	it("POST /api/ai/chat > responds with AI shopping recommendations", async () => {
		const res = await request(app)
			.post("/api/ai/chat")
			.send({ message: "Find me the best headphones with noise cancelling" });

		expect(res.status).toBe(200);
		expect(res.body.reply).toBeDefined();
		expect(typeof res.body.reply).toBe("string");
	});

	it("GET /api/ai/compare-prices/:id > returns Amazon & Flipkart price comparison", async () => {
		const res = await request(app).get(`/api/ai/compare-prices/${product._id}`);

		expect(res.status).toBe(200);
		expect(res.body.ourPrice).toBe(199.99);
		expect(res.body.amazon.price).toBeGreaterThan(199.99);
		expect(res.body.flipkart.price).toBeGreaterThan(199.99);
		expect(res.body.maxSavings).toBeGreaterThan(0);
		expect(res.body.pricePrediction.recommendation).toBeDefined();
	});

	it("POST /api/ai/negotiate > facilitates dynamic price bargaining", async () => {
		const res = await userAgent
			.post("/api/ai/negotiate")
			.send({
				productId: product._id.toString(),
				userOffer: 180,
			});

		expect(res.status).toBe(200);
		expect(res.body.status).toBeDefined();
		expect(res.body.message).toBeDefined();
	});

	it("GET /api/ai/analyze-reviews/:id > analyzes customer sentiment and authenticity", async () => {
		const res = await request(app).get(`/api/ai/analyze-reviews/${product._id}`);

		expect(res.status).toBe(200);
		expect(res.body.authenticityScore).toBeDefined();
		expect(res.body.pros).toBeInstanceOf(Array);
		expect(res.body.cons).toBeInstanceOf(Array);
	});

	it("POST /api/ai/auth-risk > checks security risk for disposable emails", async () => {
		const res = await request(app)
			.post("/api/ai/auth-risk")
			.send({ email: "spammer@tempmail.com" });

		expect(res.status).toBe(200);
		expect(res.body.isSafe).toBe(false);
		expect(res.body.riskScore).toBeGreaterThan(50);
	});

	it("GET /api/ai/flash-deals > returns PriorityQueue ranked deals", async () => {
		const res = await request(app).get("/api/ai/flash-deals");

		expect(res.status).toBe(200);
		expect(res.body).toBeInstanceOf(Array);
		expect(res.body.length).toBeGreaterThan(0);
	});

	it("GET /api/ai/delivery-estimate > computes Haversine spatial routing", async () => {
		const res = await request(app).get("/api/ai/delivery-estimate?lat=12.9716&lon=77.5946");

		expect(res.status).toBe(200);
		expect(res.body.hub).toBeDefined();
		expect(res.body.dispatchSpeedText).toBeDefined();
	});
});
