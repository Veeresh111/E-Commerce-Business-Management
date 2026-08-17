import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import { stripe } from "../lib/stripe.js";

const MAX_QUANTITY_PER_ITEM = 99;

export const createCheckoutSession = async (req, res) => {
	try {
		const { products, couponCode } = req.body;

		if (!Array.isArray(products) || products.length === 0) {
			return res.status(400).json({ error: "Invalid or empty products array" });
		}

		const productIds = products.map((p) => p._id);
		const dbProducts = await Product.find({ _id: { $in: productIds } });
		const dbProductMap = new Map(dbProducts.map((p) => [p._id.toString(), p]));

		let totalAmount = 0;
		const lineItems = [];

		for (const product of products) {
			const quantity = Number(product.quantity) || 1;
			if (quantity < 1 || quantity > MAX_QUANTITY_PER_ITEM) {
				return res.status(400).json({ error: `Invalid quantity for product: ${product.name}` });
			}

			const dbProduct = dbProductMap.get(product._id);
			if (!dbProduct) {
				return res.status(400).json({ error: `Product not found: ${product.name}` });
			}
			if (dbProduct.stock < quantity) {
				return res.status(400).json({
					error: `Only ${dbProduct.stock} left in stock for "${dbProduct.name}"`,
				});
			}

			const amount = Math.round(dbProduct.price * 100);
			totalAmount += amount * quantity;

			lineItems.push({
				price_data: {
					currency: "usd",
					product_data: {
						name: dbProduct.name,
						images: [dbProduct.image],
					},
					unit_amount: amount,
				},
				quantity,
			});
		}

		let coupon = null;
		if (couponCode) {
			coupon = await Coupon.findOne({ code: couponCode, userId: req.user._id, isActive: true });
			if (!coupon) {
				return res.status(400).json({ error: "Invalid or expired coupon code" });
			}
			if (coupon.expirationDate < new Date()) {
				coupon.isActive = false;
				await coupon.save();
				return res.status(400).json({ error: "Coupon has expired" });
			}
			totalAmount -= Math.round((totalAmount * coupon.discountPercentage) / 100);
		}

		const session = await stripe.checkout.sessions.create({
			payment_method_types: ["card"],
			line_items: lineItems,
			mode: "payment",
			success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
			shipping_address_collection: {
				allowed_countries: ["US", "IN", "GB", "CA", "AU", "DE", "FR", "NL"],
			},
			discounts: coupon
				? [
						{
							coupon: await createStripeCoupon(coupon.discountPercentage),
						},
				  ]
				: [],
			metadata: {
				userId: req.user._id.toString(),
				couponCode: couponCode || "",
				products: JSON.stringify(
					products.map((p) => ({
						id: p._id,
						quantity: Number(p.quantity) || 1,
						price: dbProductMap.get(p._id)?.price ?? p.price,
					}))
				),
			},
		});

		if (totalAmount >= 20000 && !coupon) {
			await createNewCoupon(req.user._id);
		}

		res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 });
	} catch (error) {
		console.error("Error processing checkout:", error);
		res.status(500).json({ message: "Error processing checkout", error: error.message });
	}
};

export const checkoutSuccess = async (req, res) => {
	try {
		const { sessionId } = req.body;

		if (!sessionId || typeof sessionId !== "string") {
			return res.status(400).json({ message: "Missing session_id" });
		}

		const session = await stripe.checkout.sessions.retrieve(sessionId);

		if (session.payment_status !== "paid") {
			return res.status(400).json({ message: "Payment has not been completed" });
		}

		if (session.metadata?.userId !== req.user._id.toString()) {
			return res.status(403).json({ message: "Forbidden - session does not belong to you" });
		}

		const order = await finalizeOrder(session);

		res.status(200).json({
			success: true,
			message: "Payment successful, order created, and coupon deactivated if used.",
			orderId: order._id,
		});
	} catch (error) {
		console.error("Error processing successful checkout:", error);
		res.status(500).json({ message: "Error processing successful checkout", error: error.message });
	}
};

export const stripeWebhook = async (req, res) => {
	const sig = req.headers["stripe-signature"];

	let event;
	try {
		event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
	} catch (err) {
		console.error(`Webhook signature verification failed: ${err.message}`);
		return res.status(400).send(`Webhook Error: ${err.message}`);
	}

	switch (event.type) {
		case "checkout.session.completed": {
			const session = event.data.object;
			try {
				await finalizeOrder(session);
			} catch (error) {
				console.error("Error finalizing order from webhook:", error);
				return res.status(500).json({ received: false, error: error.message });
			}
			break;
		}
		case "checkout.session.expired":
		case "checkout.session.async_payment_failed":
			// No action required; cart remains intact for the user to retry.
			break;
		default:
			break;
	}

	res.json({ received: true });
};

/**
 * Alternative Direct Multi-Gateway Payment Handlers:
 * UPI (QR Code / VPA), Cash on Delivery (COD), Crypto Web3, and BNPL EMI
 */

export const processDirectPayment = async (req, res) => {
	try {
		const { products, paymentMethod, paymentDetails = {}, couponCode, shippingAddress } = req.body;

		if (!Array.isArray(products) || products.length === 0) {
			return res.status(400).json({ error: "Invalid or empty products array" });
		}

		const validMethods = ["upi", "cod", "crypto", "bnpl"];
		if (!validMethods.includes(paymentMethod)) {
			return res.status(400).json({ error: `Invalid payment method: ${paymentMethod}` });
		}

		const productIds = products.map((p) => p._id);
		const dbProducts = await Product.find({ _id: { $in: productIds } });
		const dbProductMap = new Map(dbProducts.map((p) => [p._id.toString(), p]));

		let totalAmount = 0;
		const orderProducts = [];

		for (const product of products) {
			const quantity = Number(product.quantity) || 1;
			const dbProduct = dbProductMap.get(product._id);
			if (!dbProduct) {
				return res.status(400).json({ error: `Product not found: ${product.name}` });
			}
			if (dbProduct.stock < quantity) {
				return res.status(400).json({ error: `Only ${dbProduct.stock} left in stock for "${dbProduct.name}"` });
			}

			totalAmount += dbProduct.price * quantity;
			orderProducts.push({
				product: dbProduct._id,
				quantity,
				price: dbProduct.price,
			});
		}

		// Apply coupon discount if supplied
		if (couponCode) {
			const coupon = await Coupon.findOne({ code: couponCode, userId: req.user._id, isActive: true });
			if (coupon && coupon.expirationDate >= new Date()) {
				totalAmount -= (totalAmount * coupon.discountPercentage) / 100;
				coupon.isActive = false;
				await coupon.save();
			}
		}

		// Atomically decrement stock
		let inventoryShortfall = false;
		for (const item of orderProducts) {
			const result = await Product.findOneAndUpdate(
				{ _id: item.product, stock: { $gte: item.quantity } },
				{ $inc: { stock: -item.quantity } }
			);
			if (!result) inventoryShortfall = true;
		}

		// Create estimated delivery and initial timeline events
		const estimatedDelivery = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days
		const initialTimeline = [
			{
				status: paymentMethod === "cod" ? "pending" : "paid",
				title: paymentMethod === "cod" ? "Order Placed (COD Verified)" : `Payment Received via ${paymentMethod.toUpperCase()}`,
				location: "Nexus Automated Processing Center",
				timestamp: new Date(),
				completed: true,
			},
			{
				status: "packed",
				title: "AI Robotic Sorting & Quality Verified",
				location: "Robotic Fulfillment Hub #1",
				timestamp: new Date(Date.now() + 30 * 60 * 1000),
				completed: true,
			},
		];

		const newOrder = new Order({
			user: req.user._id,
			products: orderProducts,
			totalAmount: parseFloat(totalAmount.toFixed(2)),
			paymentMethod,
			paymentDetails,
			status: paymentMethod === "cod" ? "pending" : "paid",
			estimatedDelivery,
			trackingTimeline: initialTimeline,
			shippingAddress: shippingAddress || {
				name: req.user.name,
				line1: "123 Tech Park Ave",
				city: "Bengaluru",
				state: "KA",
				postal_code: "560001",
				country: "IN",
			},
			inventoryShortfall,
		});

		await newOrder.save();

		// Clear user's cart
		await User.updateOne({ _id: req.user._id }, { $set: { cartItems: [] } });

		res.status(201).json({
			success: true,
			message: `Order created successfully with ${paymentMethod.toUpperCase()}`,
			orderId: newOrder._id,
			order: newOrder,
		});
	} catch (error) {
		console.error("Error processing direct payment:", error);
		res.status(500).json({ message: "Error processing direct payment", error: error.message });
	}
};

async function finalizeOrder(session) {
	const sessionId = session.id;

	// Idempotency guard: only ever create one order per Stripe session.
	const existingOrder = await Order.findOne({ stripeSessionId: sessionId });
	if (existingOrder) {
		return existingOrder;
	}

	const userId = session.metadata?.userId;
	if (!userId) {
		throw new Error("Session metadata is missing userId");
	}

	if (session.metadata.couponCode) {
		await Coupon.findOneAndUpdate(
			{
				code: session.metadata.couponCode,
				userId,
			},
			{ isActive: false }
		);
	}

	const products = JSON.parse(session.metadata.products || "[]");

	// Atomically decrement stock; guard against overselling under concurrency.
	let inventoryShortfall = false;
	for (const item of products) {
		const result = await Product.findOneAndUpdate(
			{ _id: item.id, stock: { $gte: item.quantity } },
			{ $inc: { stock: -item.quantity } }
		);
		if (!result) {
			inventoryShortfall = true;
			console.error(`Inventory shortfall for product ${item.id} (qty ${item.quantity})`);
		}
	}

	const shipping = session.customer_details?.address || {};
	const newOrder = new Order({
		user: userId,
		products: products.map((product) => ({
			product: product.id,
			quantity: product.quantity,
			price: product.price,
		})),
		totalAmount: session.amount_total / 100,
		paymentMethod: "stripe",
		stripeSessionId: sessionId,
		status: "paid",
		estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
		trackingTimeline: [
			{
				status: "paid",
				title: "Payment Confirmed via Stripe",
				location: "Nexus Global Gateway",
				timestamp: new Date(),
				completed: true,
			},
		],
		shippingAddress: {
			name: session.customer_details?.name,
			line1: shipping.line1,
			line2: shipping.line2,
			city: shipping.city,
			state: shipping.state,
			postal_code: shipping.postal_code,
			country: shipping.country,
		},
		inventoryShortfall,
	});

	await newOrder.save();

	// Clear the user's cart now that the purchase is confirmed server-side.
	await User.updateOne({ _id: userId }, { $set: { cartItems: [] } });

	return newOrder;
}

async function createStripeCoupon(discountPercentage) {
	const coupon = await stripe.coupons.create({
		percent_off: discountPercentage,
		duration: "once",
	});

	return coupon.id;
}

async function createNewCoupon(userId) {
	await Coupon.findOneAndDelete({ userId });

	const newCoupon = new Coupon({
		code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
		discountPercentage: 10,
		expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
		userId: userId,
	});

	await newCoupon.save();

	return newCoupon;
}
