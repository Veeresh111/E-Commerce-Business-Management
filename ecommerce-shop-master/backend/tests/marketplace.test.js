import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../app.js";
import { setupTestDb, teardownTestDb, clearDb } from "./helpers.js";

describe("Marketplace API (C2C Buying & Selling)", () => {
	let buyerCookie;
	let sellerCookie;
	let sellerUser;
	let buyerUser;

	beforeAll(async () => {
		await setupTestDb();
	});

	afterAll(async () => {
		await teardownTestDb();
	});

	beforeEach(async () => {
		await clearDb();

		const sellerRes = await request(app).post("/api/auth/signup").send({
			name: "Seller One",
			email: "seller@test.com",
			password: "Password123!",
		});
		sellerCookie = sellerRes.headers["set-cookie"];
		sellerUser = sellerRes.body.user;

		const buyerRes = await request(app).post("/api/auth/signup").send({
			name: "Buyer One",
			email: "buyer@test.com",
			password: "Password123!",
		});
		buyerCookie = buyerRes.headers["set-cookie"];
		buyerUser = buyerRes.body.user;
	});

	it("POST /api/marketplace > creates a new C2C product listing", async () => {
		const res = await request(app)
			.post("/api/marketplace")
			.set("Cookie", sellerCookie)
			.send({
				title: "Used iPad Air M1 64GB",
				description: "Excellent battery, minimal scratches.",
				price: 399,
				originalRetailPrice: 599,
				condition: "like_new",
				category: "electronics",
				images: ["https://example.com/ipad.jpg"],
				location: { city: "Seattle", state: "WA", country: "USA" },
			});

		expect(res.status).toBe(201);
		expect(res.body.title).toBe("Used iPad Air M1 64GB");
		expect(res.body.sellerName).toBe("Seller One");
		expect(res.body.status).toBe("active");
	});

	it("GET /api/marketplace > lists active items filtered by city", async () => {
		await request(app)
			.post("/api/marketplace")
			.set("Cookie", sellerCookie)
			.send({
				title: "Seattle Listing",
				description: "Desc",
				price: 100,
				category: "electronics",
				location: { city: "Seattle" },
			});

		await request(app)
			.post("/api/marketplace")
			.set("Cookie", sellerCookie)
			.send({
				title: "Boston Listing",
				description: "Desc",
				price: 200,
				category: "books",
				location: { city: "Boston" },
			});

		const res = await request(app).get("/api/marketplace?city=Seattle");
		expect(res.status).toBe(200);
		expect(res.body.listings.length).toBe(1);
		expect(res.body.listings[0].title).toBe("Seattle Listing");
	});

	it("POST /api/marketplace/inquire > allows a buyer to make an offer & start a chat", async () => {
		const listRes = await request(app)
			.post("/api/marketplace")
			.set("Cookie", sellerCookie)
			.send({
				title: "Leather Boots",
				description: "Size 10",
				price: 80,
				category: "shoes",
				location: { city: "Austin" },
			});

		const listingId = listRes.body._id;

		const inqRes = await request(app)
			.post("/api/marketplace/inquire")
			.set("Cookie", buyerCookie)
			.send({
				listingId,
				message: "Would you take $70 for this?",
				offerAmount: 70,
			});

		expect(inqRes.status).toBe(201);
		expect(inqRes.body.currentOffer).toBe(70);
		expect(inqRes.body.messages.length).toBe(1);
		expect(inqRes.body.buyerName).toBe("Buyer One");
	});
});
