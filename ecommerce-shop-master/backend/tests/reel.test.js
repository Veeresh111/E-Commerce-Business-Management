import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../app.js";
import { setupTestDb, teardownTestDb, clearDb } from "./helpers.js";

describe("Shoppable Video Reels API", () => {
	let userCookie;

	beforeAll(async () => {
		await setupTestDb();
	});

	afterAll(async () => {
		await teardownTestDb();
	});

	beforeEach(async () => {
		await clearDb();

		const res = await request(app).post("/api/auth/signup").send({
			name: "Creator User",
			email: "creator@test.com",
			password: "Password123!",
		});
		userCookie = res.headers["set-cookie"];
	});

	it("POST /api/reels > creates a shoppable video short", async () => {
		const res = await request(app)
			.post("/api/reels")
			.set("Cookie", userCookie)
			.send({
				videoUrl: "https://example.com/video.mp4",
				title: "My Favorite Sneakers Review",
				region: "US",
				city: "New York",
				product: {
					name: "Super Sneakers",
					price: 99.99,
					image: "https://example.com/shoe.jpg",
				},
			});

		expect(res.status).toBe(201);
		expect(res.body.title).toBe("My Favorite Sneakers Review");
		expect(res.body.product.name).toBe("Super Sneakers");
	});

	it("POST /api/reels/:id/like > toggles like count on a reel", async () => {
		const createRes = await request(app)
			.post("/api/reels")
			.set("Cookie", userCookie)
			.send({
				videoUrl: "https://example.com/video.mp4",
				title: "Trending Reel",
				product: { name: "Product A", price: 50, image: "https://example.com/p.jpg" },
			});

		const reelId = createRes.body._id;

		const likeRes = await request(app)
			.post(`/api/reels/${reelId}/like`)
			.set("Cookie", userCookie);

		expect(likeRes.status).toBe(200);
		expect(likeRes.body.likesCount).toBe(1);
		expect(likeRes.body.isLiked).toBe(true);
	});

	it("POST /api/reels/:id/comment > adds a comment to a reel", async () => {
		const createRes = await request(app)
			.post("/api/reels")
			.set("Cookie", userCookie)
			.send({
				videoUrl: "https://example.com/video.mp4",
				title: "Review Reel",
				product: { name: "Product B", price: 40, image: "https://example.com/b.jpg" },
			});

		const reelId = createRes.body._id;

		const commentRes = await request(app)
			.post(`/api/reels/${reelId}/comment`)
			.set("Cookie", userCookie)
			.send({ text: "Love this video!" });

		expect(commentRes.status).toBe(201);
		expect(commentRes.body.length).toBe(1);
		expect(commentRes.body[0].text).toBe("Love this video!");
	});
});
