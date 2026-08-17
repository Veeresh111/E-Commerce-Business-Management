import mongoose from "mongoose";

const timelineEventSchema = new mongoose.Schema({
	status: {
		type: String,
		required: true,
	},
	title: {
		type: String,
		required: true,
	},
	location: {
		type: String,
		default: "Nexus Automated Fulfillment Center",
	},
	timestamp: {
		type: Date,
		default: Date.now,
	},
	completed: {
		type: Boolean,
		default: true,
	},
});

const orderSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		products: [
			{
				product: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Product",
					required: true,
				},
				quantity: {
					type: Number,
					required: true,
					min: 1,
				},
				price: {
					type: Number,
					required: true,
					min: 0,
				},
			},
		],
		totalAmount: {
			type: Number,
			required: true,
			min: 0,
		},
		paymentMethod: {
			type: String,
			enum: ["stripe", "upi", "cod", "crypto", "bnpl"],
			default: "stripe",
		},
		paymentDetails: {
			type: mongoose.Schema.Types.Mixed,
			default: {},
		},
		stripeSessionId: {
			type: String,
			sparse: true,
		},
		status: {
			type: String,
			enum: ["pending", "paid", "packed", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"],
			default: "pending",
		},
		estimatedDelivery: {
			type: Date,
		},
		trackingTimeline: [timelineEventSchema],
		dispute: {
			disputeId: String,
			status: String,
			reason: String,
			description: String,
			aiVerdict: String,
			returnTrackingNumber: String,
			resolvedAt: Date,
		},
		shippingAddress: {
			name: String,
			line1: String,
			line2: String,
			city: String,
			state: String,
			postal_code: String,
			country: String,
		},
		inventoryShortfall: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;
