import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import Coupon from "../models/coupon.model.js";
import { connectDB } from "./db.js";

dotenv.config();

const sampleProducts = [
	{
		name: "Nexus Cyberpunk Leather Biker Jacket",
		description: "Hand-finished full-grain leather jacket with weatherproof thermal insulation and reinforced titanium hardware.",
		price: 189.99,
		originalPrice: 249.99,
		discountPercentage: 24,
		image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=800",
		category: "jackets",
		isFeatured: true,
		stock: 45,
		rating: 4.9,
		reviewCount: 42,
		tags: ["jackets", "leather", "biker", "apparel", "outerwear"],
		visualTags: ["leather", "black", "jacket", "fashion"],
		competitorPrices: {
			amazon: 229.99,
			flipkart: 239.99,
		},
		reviews: [
			{ user: "Marcus V.", rating: 5, comment: "Insane quality. Saved over $40 compared to Amazon and arrived in less than 2 hours!" },
			{ user: "Samantha K.", rating: 5, comment: "The leather feel is genuine and thick. Highly recommend!" },
		],
	},
	{
		name: "HyperFlex Stretch Selvedge Denim Jeans",
		description: "Organic Japanese raw selvedge denim tailored with 4-way mechanical stretch for all-day comfort.",
		price: 79.99,
		originalPrice: 110.0,
		discountPercentage: 27,
		image: "https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&q=80&w=800",
		category: "jeans",
		isFeatured: true,
		stock: 80,
		rating: 4.8,
		reviewCount: 38,
		tags: ["jeans", "denim", "selvedge", "pants", "casual"],
		visualTags: ["denim", "blue", "jeans", "apparel"],
		competitorPrices: {
			amazon: 99.99,
			flipkart: 104.99,
		},
		reviews: [
			{ user: "Rohan D.", rating: 5, comment: "Best jeans I have ever worn. Much better fit than Levis on Flipkart." },
			{ user: "Elena P.", rating: 4, comment: "Comfortable and durable after 10 washes." },
		],
	},
	{
		name: "AeroPulse Boost Running Sneakers",
		description: "Ultralight aerodynamic running shoes engineered with high-rebound nitrogen-infused foam and breathable carbon weave.",
		price: 129.99,
		originalPrice: 169.99,
		discountPercentage: 23,
		image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800",
		category: "shoes",
		isFeatured: true,
		stock: 60,
		rating: 4.9,
		reviewCount: 56,
		tags: ["shoes", "sneakers", "running", "footwear", "sports"],
		visualTags: ["shoes", "red", "sneakers", "athletic"],
		competitorPrices: {
			amazon: 154.99,
			flipkart: 159.99,
		},
		reviews: [
			{ user: "David T.", rating: 5, comment: "Like walking on clouds. Flipkart is charging $30 more for the exact same pair." },
		],
	},
	{
		name: "Titanium Polarized Stealth Sunglasses",
		description: "Aerospace-grade titanium frame with Category 3 UV400 anti-glare polarized lenses.",
		price: 59.99,
		originalPrice: 89.99,
		discountPercentage: 33,
		image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=800",
		category: "glasses",
		isFeatured: true,
		stock: 100,
		rating: 4.7,
		reviewCount: 29,
		tags: ["glasses", "sunglasses", "eyewear", "accessories", "polarized"],
		visualTags: ["sunglasses", "black", "eyewear"],
		competitorPrices: {
			amazon: 79.99,
			flipkart: 84.99,
		},
		reviews: [
			{ user: "Aria M.", rating: 5, comment: "Crystal clear vision and super lightweight." },
		],
	},
	{
		name: "Executive Wool Blend Slim-Fit Suit",
		description: "Super 140s Italian merino wool blend 2-piece modern slim tailored suit with breathable silk lining.",
		price: 299.99,
		originalPrice: 420.0,
		discountPercentage: 28,
		image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=800",
		category: "suits",
		isFeatured: true,
		stock: 30,
		rating: 4.9,
		reviewCount: 19,
		tags: ["suits", "formal", "blazer", "executive", "wool"],
		visualTags: ["suit", "navy", "formal", "men"],
		competitorPrices: {
			amazon: 380.0,
			flipkart: 395.0,
		},
		reviews: [
			{ user: "Jonathan B.", rating: 5, comment: "Looked bespoke for my conference. Fantastic quality." },
		],
	},
	{
		name: "Modular Waterproof Techpack Backpack",
		description: "Cordura 1000D waterproof commuter backpack with TSA quick-access 16-inch laptop compartment and hidden RFID safe pocket.",
		price: 89.99,
		originalPrice: 129.99,
		discountPercentage: 30,
		image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800",
		category: "bags",
		isFeatured: true,
		stock: 75,
		rating: 4.8,
		reviewCount: 47,
		tags: ["bags", "backpack", "travel", "waterproof", "accessories"],
		visualTags: ["backpack", "black", "bag"],
		competitorPrices: {
			amazon: 119.99,
			flipkart: 124.99,
		},
		reviews: [
			{ user: "Kavita R.", rating: 5, comment: "Best travel bag ever. Fits under airplane seat perfectly." },
		],
	},
	{
		name: "Supima Heavyweight Cotton Minimalist T-Shirt",
		description: "280 GSM 100% organic Californian Supima cotton tee with anti-pilling and drop-shoulder silhouette.",
		price: 34.99,
		originalPrice: 49.99,
		discountPercentage: 30,
		image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800",
		category: "t-shirts",
		isFeatured: true,
		stock: 120,
		rating: 4.9,
		reviewCount: 65,
		tags: ["t-shirts", "cotton", "supima", "basics", "minimalist"],
		visualTags: ["tshirt", "white", "clothing"],
		competitorPrices: {
			amazon: 44.99,
			flipkart: 49.99,
		},
		reviews: [
			{ user: "Leo G.", rating: 5, comment: "Thick premium cotton that maintains structure after washing." },
		],
	},
];

async function seedDatabase() {
	try {
		await connectDB();
		console.log("Connected to MongoDB for database seeding...");

		// Clean up existing products
		await Product.deleteMany({});
		console.log("Cleared existing products.");

		// Insert enriched products
		const inserted = await Product.insertMany(sampleProducts);
		console.log(`Successfully seeded ${inserted.length} enriched products with competitor price deltas, ratings, and reviews!`);

		// Seed initial global promo coupons
		await Coupon.deleteMany({ code: "NEXUS10" });
		await Coupon.create({
			code: "NEXUS10",
			discountPercentage: 10,
			expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
			isActive: true,
		});
		console.log("Created global welcome coupon: NEXUS10 (10% OFF)");

		console.log("✅ Seed completed successfully!");
		process.exit(0);
	} catch (error) {
		console.error("Error seeding database:", error);
		process.exit(1);
	}
}

seedDatabase();
