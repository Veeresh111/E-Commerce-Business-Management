import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../app.js";
import { setupTestDb, teardownTestDb, clearDb } from "./helpers.js";

describe("User Persona & Agentic Telemetry API", () => {
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
			name: "Engineer User",
			email: "engineer@test.com",
			password: "Password123!",
		});
		userCookie = res.headers["set-cookie"];
	});

	it("PUT /api/persona/profile > updates user profession, hobbies, and interests", async () => {
		const res = await request(app)
			.put("/api/persona/profile")
			.set("Cookie", userCookie)
			.send({
				profession: "Robotics Engineer",
				hobbies: ["Drone Racing", "3D Printing"],
				interests: ["Microcontrollers", "Autonomous Vehicles"],
			});

		expect(res.status).toBe(200);
		expect(res.body.persona.profession).toBe("Robotics Engineer");
		expect(res.body.persona.hobbies).toContain("Drone Racing");
	});

	it("POST /api/persona/telemetry > records user browsing telemetry", async () => {
		const res = await request(app)
			.post("/api/persona/telemetry")
			.set("Cookie", userCookie)
			.send({
				eventType: "view_product",
				targetCategory: "electronics",
				query: "mechanical keyboard",
			});

		expect(res.status).toBe(200);
		expect(res.body.status).toBe("telemetry_recorded");
	});
});
