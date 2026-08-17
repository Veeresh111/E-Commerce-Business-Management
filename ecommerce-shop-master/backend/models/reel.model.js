import mongoose from "mongoose";

const reelSchema = new mongoose.Schema(
	{
		videoUrl: {
			type: String,
			required: [true, "Video URL is required"],
		},
		thumbnail: {
			type: String,
			default: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800",
		},
		title: {
			type: String,
			required: [true, "Reel title is required"],
			trim: true,
		},
		description: {
			type: String,
			default: "",
		},
		creator: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		creatorName: {
			type: String,
			required: true,
		},
		creatorAvatar: {
			type: String,
			default: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
		},
		region: {
			type: String,
			enum: ["Global", "US", "India", "UK", "Japan", "Europe"],
			default: "Global",
		},
		city: {
			type: String,
			default: "New York",
		},
		// Linked Shoppable Product
		product: {
			name: { type: String, required: true },
			price: { type: Number, required: true },
			originalPrice: { type: Number },
			image: { type: String, required: true },
			category: { type: String, default: "trending" },
			productId: { type: mongoose.Schema.Types.ObjectId },
			isP2P: { type: Boolean, default: false },
		},
		likes: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		likesCount: {
			type: Number,
			default: 0,
		},
		viewsCount: {
			type: Number,
			default: 120,
		},
		comments: [
			{
				user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
				userName: { type: String, required: true },
				text: { type: String, required: true },
				createdAt: { type: Date, default: Date.now },
			},
		],
		tags: {
			type: [String],
			default: ["trending", "style", "musthave"],
		},
	},
	{
		timestamps: true,
	}
);

reelSchema.index({ region: 1, createdAt: -1 });
reelSchema.index({ creator: 1 });

const Reel = mongoose.model("Reel", reelSchema);

export default Reel;
