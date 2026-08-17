import Order from "../models/order.model.js";
import Product from "../models/product.model.js";

const ORDER_STATUSES = ["pending", "paid", "packed", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"];

export const getMyOrders = async (req, res) => {
	try {
		const page = Math.max(parseInt(req.query.page) || 1, 1);
		const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
		const skip = (page - 1) * limit;

		const [orders, total] = await Promise.all([
			Order.find({ user: req.user._id })
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.populate("products.product", "name image price category rating specs competitorPrices"),
			Order.countDocuments({ user: req.user._id }),
		]);

		res.json({
			orders,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.log("Error in getMyOrders controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getOrderById = async (req, res) => {
	try {
		const order = await Order.findById(req.params.id)
			.populate("products.product", "name image price category rating specs competitorPrices")
			.populate("user", "name email");

		if (!order) {
			return res.status(404).json({ message: "Order not found" });
		}

		if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
			return res.status(403).json({ message: "Access forbidden" });
		}

		res.json(order);
	} catch (error) {
		console.log("Error in getOrderById controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getAllOrders = async (req, res) => {
	try {
		const page = Math.max(parseInt(req.query.page) || 1, 1);
		const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
		const skip = (page - 1) * limit;

		const filter = {};
		if (req.query.status && ORDER_STATUSES.includes(req.query.status)) {
			filter.status = req.query.status;
		}

		const [orders, total] = await Promise.all([
			Order.find(filter)
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.populate("user", "name email")
				.populate("products.product", "name image price"),
			Order.countDocuments(filter),
		]);

		res.json({
			orders,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.log("Error in getAllOrders controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const updateOrderStatus = async (req, res) => {
	try {
		const { status, note, location } = req.body;

		if (!ORDER_STATUSES.includes(status)) {
			return res.status(400).json({ message: `Invalid status. Allowed: ${ORDER_STATUSES.join(", ")}` });
		}

		const order = await Order.findById(req.params.id);
		if (!order) {
			return res.status(404).json({ message: "Order not found" });
		}

		if (order.status === "cancelled" || order.status === "delivered") {
			return res.status(400).json({ message: `Order is already ${order.status} and cannot be changed` });
		}

		order.status = status;
		order.trackingTimeline.push({
			status,
			title: note || `Status updated to ${status.toUpperCase()}`,
			location: location || "Nexus Automated Fulfillment Logistics",
			timestamp: new Date(),
			completed: true,
		});

		await order.save();
		res.json(order);
	} catch (error) {
		console.log("Error in updateOrderStatus controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const cancelOrder = async (req, res) => {
	try {
		const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
		if (!order) {
			return res.status(404).json({ message: "Order not found" });
		}

		if (order.status === "shipped" || order.status === "delivered" || order.status === "cancelled") {
			return res.status(400).json({ message: `Order cannot be cancelled in status ${order.status}` });
		}

		order.status = "cancelled";
		order.trackingTimeline.push({
			status: "cancelled",
			title: "Order Cancelled by Customer",
			location: "Customer Portal",
			timestamp: new Date(),
			completed: true,
		});

		// Restore stock
		for (const item of order.products) {
			await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
		}

		await order.save();
		res.json({ message: "Order cancelled successfully", order });
	} catch (error) {
		console.log("Error in cancelOrder controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};