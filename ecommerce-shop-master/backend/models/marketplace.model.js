import mongoose from "mongoose";

const marketplaceSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: [true, "Listing title is required"],
			trim: true,
		},
		description: {
			type: String,
			required: [true, "Listing description is required"],
		},
		price: {
			type: Number,
			required: [true, "Price is required"],
			min: [0, "Price cannot be negative"],
		},
		originalRetailPrice: {
			type: Number,
			default: 0,
		},
		condition: {
			type: String,
			enum: ["brand_new", "like_new", "good", "fair", "refurbished"],
			default: "like_new",
		},
		category: {
			type: String,
			required: [true, "Category is required"],
		},
		images: {
			type: [String],
			default: ["https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=800"],
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
		location: {
			city: { type: String, required: true },
			state: { type: String, default: "" },
			country: { type: String, default: "USA" },
			neighborhood: { type: String, default: "" },
		},
		status: {
			type: String,
			enum: ["active", "reserved", "sold"],
			default: "active",
		},
		isNegotiable: {
			type: Boolean,
			default: true,
		},
		phoneContact: {
			type: String,
			default: "",
		},
		views: {
			type: Number,
			default: 0,
		},
		inquiriesCount: {
			type: Number,
			default: 0,
		},
	},
	{
		timestamps: true,
	}
);

marketplaceSchema.index({ category: 1, status: 1 });
marketplaceSchema.index({ "location.city": 1 });
marketplaceSchema.index({ seller: 1 });
marketplaceSchema.index({ title: "text", description: "text" });

const MarketplaceProduct = mongoose.model("MarketplaceProduct", marketplaceSchema);

export default MarketplaceProduct;
