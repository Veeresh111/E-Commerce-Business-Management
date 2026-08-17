import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../app.js";
import Order from "../models/order.model.js";
import Coupon from "../models/coupon.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import { setupTestDb, teardownTestDb, clearDb, signupAndGetAgent, createTestProduct, createTestUser } from "./helpers.js";
import { stripe } from "../lib/stripe.js";

const redisStore = vi.hoisted(() => new Map());

vi.mock("../lib/stripe.js", () => ({
	stripe: {
		checkout: {
			sessions: {
				create: vi.fn(async () => ({ id: "cs_mock_default" })),
				retrieve: vi.fn(),
			},
		},
		coupons: {
			create: vi.fn(async () => ({ id: "coupon_mock" })),
		},
		webhooks: {
			constructEvent: vi.fn(),
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

const makeSession = (overrides = {}) => ({
	id: "cs_test_123",
	payment_status: "paid",
	amount_total: 1999,
	customer_details: {
		name: "Test User",
		address: { line1: "1 Test St", city: "Testville", country: "US" },
	},
	metadata: {
		userId: "user-placeholder",
		couponCode: "",
		products: JSON.stringify([{ id: "product-placeholder", quantity: 1, price: 19.99 }]),
	},
	...overrides,
});

describe("Payment API", () => {
	let agent;
	let user;
	let product;

	beforeAll(setupTestDb);

	beforeEach(async () => {
		await clearDb();
		redisStore.clear();
		vi.clearAllMocks();

		({ agent, user } = await signupAndGetAgent());
		product = await createTestProduct({ price: 19.99, stock: 5 });
	});

	afterAll(async () => {
		await teardownTestDb();
	});

	describe("POST /api/payments/create-checkout-session", () => {
		it("rejects an empty products array", async () => {
			const res = await agent.post("/api/payments/create-checkout-session").send({ products: [] });
			expect(res.status).toBe(400);
		});

		it("rejects products that do not exist", async () => {
			const res = await agent.post("/api/payments/create-checkout-session").send({
				products: [{ _id: "507f1f77bcf86cd799439011", name: "Ghost", quantity: 1 }],
			});
			expect(res.status).toBe(400);
		});

		it("rejects orders exceeding available stock", async () => {
			const res = await agent.post("/api/payments/create-checkout-session").send({
				products: [{ _id: String(product._id), name: product.name, quantity: 99 }],
			});
			expect(res.status).toBe(400);
			expect(res.body.error).toMatch(/stock/i);
		});

		it("rejects an invalid coupon", async () => {
			const res = await agent.post("/api/payments/create-checkout-session").send({
				products: [{ _id: String(product._id), name: product.name, quantity: 1 }],
				couponCode: "BOGUS",
			});
			expect(res.status).toBe(400);
			expect(res.body.error).toMatch(/coupon/i);
		});

		it("creates a checkout session for valid items", async () => {
			stripe.checkout.sessions.create.mockResolvedValue({ id: "cs_new_1" });

			const res = await agent.post("/api/payments/create-checkout-session").send({
				products: [{ _id: String(product._id), name: product.name, quantity: 2 }],
			});

			expect(res.status).toBe(200);
			expect(res.body.id).toBe("cs_new_1");
			expect(stripe.checkout.sessions.create).toHaveBeenCalledTimes(1);

			const callArgs = stripe.checkout.sessions.create.mock.calls[0][0];
			expect(callArgs.line_items).toHaveLength(1);
			expect(callArgs.line_items[0].quantity).toBe(2);
			expect(callArgs.metadata.userId).toBe(String(user._id));
		});

		it("issues a gift coupon for orders over $200", async () => {
			const bigProduct = await createTestProduct({ price: 250, stock: 10 });
			stripe.checkout.sessions.create.mockResolvedValue({ id: "cs_gift_1" });

			const res = await agent.post("/api/payments/create-checkout-session").send({
				products: [{ _id: String(bigProduct._id), name: bigProduct.name, quantity: 1 }],
			});

			expect(res.status).toBe(200);

			const coupon = await Coupon.findOne({ userId: user._id });
			expect(coupon).not.toBeNull();
			expect(coupon.code).toMatch(/^GIFT/);
			expect(coupon.discountPercentage).toBe(10);
		});
	});

	describe("POST /api/payments/checkout-success", () => {
		it("rejects sessions that are not paid", async () => {
			stripe.checkout.sessions.retrieve.mockResolvedValue({
				...makeSession({ payment_status: "unpaid" }),
			});

			const res = await agent.post("/api/payments/checkout-success").send({ sessionId: "cs_test_123" });
			expect(res.status).toBe(400);
		});

		it("rejects sessions belonging to another user", async () => {
			const otherUser = await createTestUser();
			stripe.checkout.sessions.retrieve.mockResolvedValue(
				makeSession({ metadata: { userId: String(otherUser._id), couponCode: "", products: "[]" } })
			);

			const res = await agent.post("/api/payments/checkout-success").send({ sessionId: "cs_test_123" });
			expect(res.status).toBe(403);
		});

		it("creates an order, decrements stock, clears the cart and deactivates the coupon", async () => {
			const coupon = await Coupon.create({
				code: "SAVE10",
				discountPercentage: 10,
				expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
				userId: user._id,
			});

			await agent.post("/api/cart").send({ productId: String(product._id) });

			stripe.checkout.sessions.retrieve.mockResolvedValue(
				makeSession({
					amount_total: 1799,
					metadata: {
						userId: String(user._id),
						couponCode: "SAVE10",
						products: JSON.stringify([{ id: String(product._id), quantity: 2, price: 19.99 }]),
					},
				})
			);

			const res = await agent.post("/api/payments/checkout-success").send({ sessionId: "cs_test_123" });

			expect(res.status).toBe(200);
			expect(res.body.orderId).toBeDefined();

			const order = await Order.findOne({ stripeSessionId: "cs_test_123" });
			expect(order).not.toBeNull();
			expect(order.status).toBe("paid");
			expect(order.totalAmount).toBe(17.99);
			expect(order.shippingAddress.city).toBe("Testville");
			expect(order.inventoryShortfall).toBe(false);

			const updatedProduct = await Product.findById(product._id);
			expect(updatedProduct.stock).toBe(3); // 5 - 2

			const updatedCoupon = await Coupon.findById(coupon._id);
			expect(updatedCoupon.isActive).toBe(false);

			const cartRes = await agent.get("/api/cart");
			expect(cartRes.body).toEqual([]);
		});

		it("is idempotent - repeated calls create only one order and decrement stock once", async () => {
			stripe.checkout.sessions.retrieve.mockResolvedValue(
				makeSession({
					metadata: {
						userId: String(user._id),
						couponCode: "",
						products: JSON.stringify([{ id: String(product._id), quantity: 2, price: 19.99 }]),
					},
				})
			);

			await agent.post("/api/payments/checkout-success").send({ sessionId: "cs_test_123" });
			await agent.post("/api/payments/checkout-success").send({ sessionId: "cs_test_123" });

			const orderCount = await Order.countDocuments({ stripeSessionId: "cs_test_123" });
			expect(orderCount).toBe(1);

			const updatedProduct = await Product.findById(product._id);
			expect(updatedProduct.stock).toBe(3); // decremented only once
		});
	});

	describe("POST /api/payments/webhook", () => {
		it("rejects requests with an invalid signature", async () => {
			stripe.webhooks.constructEvent.mockImplementation(() => {
				throw new Error("No signatures found matching the expected signature");
			});

			const res = await request(app)
				.post("/api/payments/webhook")
				.set("stripe-signature", "bad_sig")
				.send({ type: "checkout.session.completed" });

			expect(res.status).toBe(400);
		});

		it("creates an order from a completed session and clears the cart", async () => {
			stripe.webhooks.constructEvent.mockReturnValue({
				type: "checkout.session.completed",
				data: {
					object: makeSession({
						metadata: {
							userId: String(user._id),
							couponCode: "",
							products: JSON.stringify([{ id: String(product._id), quantity: 1, price: 19.99 }]),
						},
					}),
				},
			});

			await agent.post("/api/cart").send({ productId: String(product._id) });

			const res = await request(app)
				.post("/api/payments/webhook")
				.set("stripe-signature", "valid_sig")
				.send({ type: "checkout.session.completed" });

			expect(res.status).toBe(200);
			expect(res.body.received).toBe(true);

			const order = await Order.findOne({ stripeSessionId: "cs_test_123" });
			expect(order).not.toBeNull();
			expect(order.status).toBe("paid");

			const updatedProduct = await Product.findById(product._id);
			expect(updatedProduct.stock).toBe(4);

			const cartRes = await agent.get("/api/cart");
			expect(cartRes.body).toEqual([]);
		});

		it("is idempotent - duplicate webhook events create one order", async () => {
			stripe.webhooks.constructEvent.mockReturnValue({
				type: "checkout.session.completed",
				data: {
					object: makeSession({
						metadata: {
							userId: String(user._id),
							couponCode: "",
							products: JSON.stringify([{ id: String(product._id), quantity: 1, price: 19.99 }]),
						},
					}),
				},
			});

			await request(app).post("/api/payments/webhook").set("stripe-signature", "sig").send({});
			await request(app).post("/api/payments/webhook").set("stripe-signature", "sig").send({});

			const orderCount = await Order.countDocuments({ stripeSessionId: "cs_test_123" });
			expect(orderCount).toBe(1);

			const updatedProduct = await Product.findById(product._id);
			expect(updatedProduct.stock).toBe(4);
		});

		it("ignores non-relevant event types", async () => {
			stripe.webhooks.constructEvent.mockReturnValue({
				type: "checkout.session.expired",
				data: { object: makeSession() },
			});

			const res = await request(app).post("/api/payments/webhook").set("stripe-signature", "sig").send({});

			expect(res.status).toBe(200);
			expect(await Order.countDocuments({})).toBe(0);
		});
	});
});