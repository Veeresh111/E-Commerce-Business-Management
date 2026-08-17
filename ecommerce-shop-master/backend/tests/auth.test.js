import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../app.js";
import User from "../models/user.model.js";
import { setupTestDb, teardownTestDb, clearDb } from "./helpers.js";

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

describe("Auth API", () => {
	beforeAll(setupTestDb);

	beforeEach(async () => {
		await clearDb();
		redisStore.clear();
	});

	afterAll(async () => {
		await teardownTestDb();
	});

	describe("POST /api/auth/signup", () => {
		it("creates a user and sets auth cookies", async () => {
			const res = await request(app).post("/api/auth/signup").send({
				name: "Alice",
				email: "alice@test.com",
				password: "secret123",
			});

			expect(res.status).toBe(201);
			expect(res.body.email).toBe("alice@test.com");
			expect(res.body.password).toBeUndefined();
			expect(res.headers["set-cookie"]).toBeDefined();
			expect(res.headers["set-cookie"].some((c) => c.startsWith("accessToken="))).toBe(true);
			expect(res.headers["set-cookie"].some((c) => c.includes("HttpOnly"))).toBe(true);
		});

		it("rejects duplicate emails", async () => {
			const payload = { name: "Alice", email: "alice@test.com", password: "secret123" };
			await request(app).post("/api/auth/signup").send(payload);
			const res = await request(app).post("/api/auth/signup").send(payload);

			expect(res.status).toBe(400);
			expect(res.body.message).toMatch(/already exists/i);
		});

		it("rejects missing fields", async () => {
			const res = await request(app).post("/api/auth/signup").send({ email: "a@b.com" });
			expect(res.status).toBe(400);
		});

		it("rejects short passwords", async () => {
			const res = await request(app)
				.post("/api/auth/signup")
				.send({ name: "Bob", email: "bob@test.com", password: "123" });
			expect(res.status).toBe(400);
		});
	});

	describe("POST /api/auth/login", () => {
		it("logs in with correct credentials", async () => {
			await User.create({ name: "Alice", email: "alice@test.com", password: "secret123" });

			const res = await request(app).post("/api/auth/login").send({
				email: "alice@test.com",
				password: "secret123",
			});

			expect(res.status).toBe(200);
			expect(res.body.email).toBe("alice@test.com");
			expect(res.headers["set-cookie"]).toBeDefined();
		});

		it("rejects wrong password", async () => {
			await User.create({ name: "Alice", email: "alice@test.com", password: "secret123" });

			const res = await request(app).post("/api/auth/login").send({
				email: "alice@test.com",
				password: "wrongpass",
			});

			expect(res.status).toBe(400);
		});
	});

	describe("GET /api/auth/profile", () => {
		it("returns 401 without a token", async () => {
			const res = await request(app).get("/api/auth/profile");
			expect(res.status).toBe(401);
		});

		it("returns the user profile with a valid token", async () => {
			const user = await User.create({ name: "Alice", email: "alice@test.com", password: "secret123" });

			const agent = request.agent(app);
			await agent.post("/api/auth/login").send({ email: "alice@test.com", password: "secret123" });

			const res = await agent.get("/api/auth/profile");

			expect(res.status).toBe(200);
			expect(res.body._id).toBe(String(user._id));
			expect(res.body.password).toBeUndefined();
			expect(res.body.resetPasswordToken).toBeUndefined();
		});
	});

	describe("POST /api/auth/refresh-token", () => {
		const extractRefreshToken = (res) => {
			const header = res.headers["set-cookie"]?.find((c) => c.startsWith("refreshToken="));
			return header ? header.split(";")[0].replace("refreshToken=", "") : null;
		};

		it("rotates the refresh token", async () => {
			await User.create({ name: "Alice", email: "alice@test.com", password: "secret123" });

			const agent = request.agent(app);
			const loginRes = await agent.post("/api/auth/login").send({ email: "alice@test.com", password: "secret123" });
			const originalToken = extractRefreshToken(loginRes);
			expect(originalToken).toBeDefined();

			const refreshRes = await agent.post("/api/auth/refresh-token");
			expect(refreshRes.status).toBe(200);

			const newToken = extractRefreshToken(refreshRes);
			expect(newToken).toBeDefined();
			expect(newToken).not.toBe(originalToken);
		});

		it("rejects a reused refresh token", async () => {
			await User.create({ name: "Alice", email: "alice@test.com", password: "secret123" });

			const agent = request.agent(app);
			const loginRes = await agent.post("/api/auth/login").send({ email: "alice@test.com", password: "secret123" });
			const originalToken = extractRefreshToken(loginRes);

			// First refresh rotates the token in Redis; the old one must be dead afterwards.
			await agent.post("/api/auth/refresh-token");

			const res = await request(app)
				.post("/api/auth/refresh-token")
				.set("Cookie", `refreshToken=${originalToken}`);

			expect(res.status).toBe(401);
		});
	});

	describe("Email verification", () => {
		it("verifies a user with a valid token", async () => {
			const user = await User.create({
				name: "Alice",
				email: "alice@test.com",
				password: "secret123",
				emailVerified: false,
				emailVerificationToken: "valid-token-abc",
				emailVerificationExpires: new Date(Date.now() + 60 * 60 * 1000),
			});

			const res = await request(app).get("/api/auth/verify-email?token=valid-token-abc");

			expect(res.status).toBe(200);
			const updated = await User.findById(user._id);
			expect(updated.emailVerified).toBe(true);
			expect(updated.emailVerificationToken).toBeUndefined();
		});

		it("rejects an invalid token", async () => {
			const res = await request(app).get("/api/auth/verify-email?token=bogus");
			expect(res.status).toBe(400);
		});
	});

	describe("Password reset flow", () => {
		it("does not reveal whether an email exists", async () => {
			const res = await request(app)
				.post("/api/auth/forgot-password")
				.send({ email: "nobody@test.com" });
			expect(res.status).toBe(200);
		});

		it("resets the password with a valid token", async () => {
			const user = await User.create({
				name: "Alice",
				email: "alice@test.com",
				password: "oldpassword",
				resetPasswordToken: "reset-token-xyz",
				resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000),
			});

			const res = await request(app).post("/api/auth/reset-password").send({
				token: "reset-token-xyz",
				password: "newpassword",
			});

			expect(res.status).toBe(200);

			// Old password no longer works, new one does.
			const oldLogin = await request(app).post("/api/auth/login").send({
				email: "alice@test.com",
				password: "oldpassword",
			});
			expect(oldLogin.status).toBe(400);

			const newLogin = await request(app).post("/api/auth/login").send({
				email: "alice@test.com",
				password: "newpassword",
			});
			expect(newLogin.status).toBe(200);

			const updated = await User.findById(user._id);
			expect(updated.resetPasswordToken).toBeUndefined();
		});

		it("rejects expired tokens", async () => {
			await User.create({
				name: "Alice",
				email: "alice@test.com",
				password: "oldpassword",
				resetPasswordToken: "expired-token",
				resetPasswordExpires: new Date(Date.now() - 1000),
			});

			const res = await request(app)
				.post("/api/auth/reset-password")
				.send({ token: "expired-token", password: "newpassword" });

			expect(res.status).toBe(400);
		});
	});
});