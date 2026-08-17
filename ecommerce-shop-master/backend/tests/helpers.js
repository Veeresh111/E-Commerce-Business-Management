import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import app from "../app.js";
import User from "../models/user.model.js";
import Product from "../models/product.model.js";

let mongo;

export const setupTestDb = async () => {
	mongo = await MongoMemoryServer.create();
	await mongoose.connect(mongo.getUri());
};

export const teardownTestDb = async () => {
	await mongoose.disconnect();
	if (mongo) {
		await mongo.stop();
	}
};

export const clearDb = async () => {
	const { collections } = mongoose.connection;
	for (const key of Object.keys(collections)) {
		await collections[key].deleteMany({});
	}
};

export const createTestUser = async (overrides = {}) => {
	const user = await User.create({
		name: "Test User",
		email: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@test.com`,
		password: "password123",
		...overrides,
	});
	return user;
};

export const signupAndGetAgent = async (overrides = {}) => {
	const agent = request.agent(app);
	const user = await createTestUser(overrides);
	const loginRes = await agent.post("/api/auth/login").send({ email: user.email, password: "password123" });
	if (loginRes.status !== 200) {
		throw new Error(`Login failed for test user: ${loginRes.status} ${JSON.stringify(loginRes.body)}`);
	}
	return { agent, user };
};

export const createTestProduct = async (overrides = {}) => {
	const product = await Product.create({
		name: "Test Product",
		description: "A test product",
		price: 19.99,
		image: "https://example.com/image.jpg",
		category: "jeans",
		stock: 10,
		...overrides,
	});
	return product;
};