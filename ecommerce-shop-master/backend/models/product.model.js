import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
	{
		user: {
			type: String,
			required: true,
			default: "Verified Buyer",
		},
		rating: {
			type: Number,
			required: true,
			min: 1,
			max: 5,
			default: 5,
		},
		comment: {
			type: String,
			required: true,
		},
	},
	{ timestamps: true }
);

const productSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			required: true,
		},
		price: {
			type: Number,
			min: 0,
			required: true,
		},
		originalPrice: {
			type: Number,
			min: 0,
		},
		discountPercentage: {
			type: Number,
			default: 0,
			min: 0,
			max: 100,
		},
		image: {
			type: String,
			required: [true, "Image is required"],
		},
		gallery: {
			type: [String],
			default: [],
		},
		category: {
			type: String,
			required: true,
		},
		isFeatured: {
			type: Boolean,
			default: false,
		},
		stock: {
			type: Number,
			required: true,
			default: 100,
			min: 0,
		},
		rating: {
			type: Number,
			default: 4.8,
			min: 1,
			max: 5,
		},
		reviewCount: {
			type: Number,
			default: 24,
		},
		reviews: [reviewSchema],
		specs: {
			type: Map,
			of: String,
			default: {},
		},
		tags: {
			type: [String],
			default: [],
		},
		visualTags: {
			type: [String],
			default: [],
		},
		competitorPrices: {
			amazon: { type: Number },
			flipkart: { type: Number },
		},
	},
	{ timestamps: true }
);

productSchema.index({ category: 1 });
productSchema.index({ name: "text", description: "text", tags: "text" });

const Product = mongoose.model("Product", productSchema);

export default Product;
