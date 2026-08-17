import mongoose from "mongoose";

const p2pMessageSchema = new mongoose.Schema(
	{
		listing: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "MarketplaceProduct",
			required: true,
		},
		listingTitle: {
			type: String,
			required: true,
		},
		listingImage: {
			type: String,
			default: "",
		},
		listingPrice: {
			type: Number,
			required: true,
		},
		buyer: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		buyerName: {
			type: String,
			required: true,
		},
		seller: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		sellerName: {
			type: String,
			required: true,
		},
		messages: [
			{
				sender: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
					required: true,
				},
				senderName: {
					type: String,
					required: true,
				},
				text: {
					type: String,
					required: true,
				},
				offerAmount: {
					type: Number,
				},
				createdAt: {
					type: Date,
					default: Date.now,
				},
			},
		],
		currentOffer: {
			type: Number,
		},
		status: {
			type: String,
			enum: ["inquiry", "offer_made", "offer_accepted", "offer_rejected", "completed", "closed"],
			default: "inquiry",
		},
		lastMessage: {
			type: String,
			default: "",
		},
	},
	{
		timestamps: true,
	}
);

p2pMessageSchema.index({ buyer: 1, listing: 1 });
p2pMessageSchema.index({ seller: 1 });

const P2PMessage = mongoose.model("P2PMessage", p2pMessageSchema);

export default P2PMessage;
