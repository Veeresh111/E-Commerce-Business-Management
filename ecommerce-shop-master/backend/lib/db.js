import mongoose from "mongoose";

export const connectDB = async () => {
	try {
		if (process.env.MONGO_URI) {
			try {
				const conn = await mongoose.connect(process.env.MONGO_URI, {
					serverSelectionTimeoutMS: 3000,
					socketTimeoutMS: 45000,
				});
				console.log(`MongoDB connected: ${conn.connection.host}`);
				await autoSeedIfEmpty();
				return conn;
			} catch (connErr) {
				console.log("Local MongoDB not reachable on MONGO_URI, starting In-Memory MongoDB engine for seamless development...");
			}
		}

		// Seamless In-Memory MongoDB Fallback
		const { MongoMemoryServer } = await import("mongodb-memory-server");
		const mongod = await MongoMemoryServer.create();
		const uri = mongod.getUri();
		const conn = await mongoose.connect(uri);
		console.log(`🚀 In-Memory MongoDB Server started and connected at: ${uri}`);
		await autoSeedIfEmpty();
		return conn;
	} catch (error) {
		console.error("Error connecting to MongoDB:", error.message);
		throw error;
	}
};

async function autoSeedIfEmpty() {
	try {
		const Product = (await import("../models/product.model.js")).default;
		const Coupon = (await import("../models/coupon.model.js")).default;
		const MarketplaceProduct = (await import("../models/marketplace.model.js")).default;
		const Reel = (await import("../models/reel.model.js")).default;
		const User = (await import("../models/user.model.js")).default;

		const count = await Product.countDocuments();
		if (count === 0) {
			console.log("Database empty. Auto-seeding initial catalog with Amazon & Flipkart competitor price deltas...");
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
					competitorPrices: { amazon: 229.99, flipkart: 239.99 },
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
					competitorPrices: { amazon: 99.99, flipkart: 104.99 },
					reviews: [
						{ user: "Rohan D.", rating: 5, comment: "Best jeans I have ever worn. Much better fit than Levis on Flipkart." },
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
					competitorPrices: { amazon: 154.99, flipkart: 159.99 },
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
					competitorPrices: { amazon: 79.99, flipkart: 84.99 },
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
					competitorPrices: { amazon: 380.0, flipkart: 395.0 },
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
					competitorPrices: { amazon: 119.99, flipkart: 124.99 },
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
					competitorPrices: { amazon: 44.99, flipkart: 49.99 },
				},
			];

			await Product.insertMany(sampleProducts);
			await Coupon.create({
				code: "NEXUS10",
				discountPercentage: 10,
				expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
				isActive: true,
			});
			console.log("✅ Auto-seeded 7 rich catalog products & NEXUS10 coupon!");
		}

		// Seed initial C2C Marketplace items if empty
		const marketCount = await MarketplaceProduct.countDocuments();
		if (marketCount === 0) {
			let demoUser = await User.findOne({});
			if (!demoUser) {
				demoUser = await User.create({
					name: "Alex Mercer",
					email: "alex.demo@nexusmart.com",
					password: "Password123!",
					profession: "Senior Product Designer",
					hobbies: ["Photography", "Gaming", "Mechanical Keyboards"],
					interests: ["Tech Hardware", "Minimalist Design"],
					location: { city: "New York", state: "NY", country: "USA", region: "US" },
				});
			}

			const sampleMarketListings = [
				{
					title: "Apple MacBook Pro 14 M2 Pro (16GB / 512GB Space Gray)",
					description: "Flawless condition, battery health 96%. Includes original 67W MagSafe charger and leather sleeve. Selling due to company upgrade.",
					price: 1199.0,
					originalRetailPrice: 1999.0,
					condition: "like_new",
					category: "electronics",
					images: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800"],
					seller: demoUser._id,
					sellerName: demoUser.name,
					location: { city: "New York", state: "NY", country: "USA", neighborhood: "Manhattan" },
					status: "active",
					isNegotiable: true,
					views: 142,
					inquiriesCount: 6,
				},
				{
					title: "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
					description: "Barely used for 2 weeks. Pristine audio quality, complete box and carrying case included.",
					price: 249.0,
					originalRetailPrice: 399.0,
					condition: "brand_new",
					category: "audio",
					images: ["https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=800"],
					seller: demoUser._id,
					sellerName: demoUser.name,
					location: { city: "San Francisco", state: "CA", country: "USA", neighborhood: "Mission District" },
					status: "active",
					isNegotiable: true,
					views: 89,
					inquiriesCount: 4,
				},
				{
					title: "Fujifilm X-T30 II Mirrorless Camera + 18-55mm F2.8-4 Lens",
					description: "Shutter count under 3,000. Super clean sensor, includes 2 extra batteries and SanDisk 128GB Extreme Pro SD.",
					price: 799.0,
					originalRetailPrice: 1299.0,
					condition: "like_new",
					category: "photography",
					images: ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800"],
					seller: demoUser._id,
					sellerName: demoUser.name,
					location: { city: "London", state: "England", country: "UK", neighborhood: "Soho" },
					status: "active",
					isNegotiable: true,
					views: 210,
					inquiriesCount: 11,
				},
			];

			await MarketplaceProduct.insertMany(sampleMarketListings);
			console.log("✅ Auto-seeded C2C OLX Marketplace listings!");
		}

		// Seed initial Shoppable Video Shorts Reels if empty
		const reelsCount = await Reel.countDocuments();
		if (reelsCount === 0) {
			let demoUser = await User.findOne({});
			const sampleReels = [
				{
					videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-fashion-portrait-40348-large.mp4",
					thumbnail: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800",
					title: "Cyberpunk Glow Biker Jacket Unboxing & Fit Check 🔥",
					description: "Testing out the thermal insulation and titanium hardware. Hands down 10/10 fit!",
					creator: demoUser._id,
					creatorName: "Elena Rostova",
					creatorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
					region: "US",
					city: "New York",
					product: {
						name: "Nexus Cyberpunk Leather Biker Jacket",
						price: 189.99,
						originalPrice: 249.99,
						image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=800",
						category: "jackets",
					},
					likesCount: 1420,
					viewsCount: 18400,
					tags: ["jacket", "unboxing", "fashion", "cyberpunk"],
					comments: [
						{ userName: "Devon M.", text: "The fit is insane! Just ordered one.", createdAt: new Date() },
						{ userName: "Chloe S.", text: "Saved $40 compared to Amazon. Arrived in 2 hours!", createdAt: new Date() },
					],
				},
				{
					videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-young-man-skateboarding-in-the-street-41744-large.mp4",
					thumbnail: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800",
					title: "AeroPulse Boost Running Sneakers 10-Mile Marathon Stress Test 🏃‍♂️",
					description: "Unbelievable energy rebound foam. Look at this bounce!",
					creator: demoUser._id,
					creatorName: "Kenji Takahashi",
					creatorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
					region: "Japan",
					city: "Tokyo",
					product: {
						name: "AeroPulse Boost Running Sneakers",
						price: 129.99,
						originalPrice: 169.99,
						image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800",
						category: "shoes",
					},
					likesCount: 2890,
					viewsCount: 34100,
					tags: ["sneakers", "running", "tokyo", "workout"],
					comments: [
						{ userName: "Taro K.", text: "Tokyo delivery was super fast!", createdAt: new Date() },
					],
				},
				{
					videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-working-on-a-laptop-42998-large.mp4",
					thumbnail: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800",
					title: "Selling my M2 Pro MacBook Pro on Nexus C2C Marketplace 💻",
					description: "Zero scratches, 96% battery health. Message me directly to negotiate!",
					creator: demoUser._id,
					creatorName: "Alex Mercer",
					creatorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
					region: "Global",
					city: "San Francisco",
					product: {
						name: "Apple MacBook Pro 14 M2 Pro",
						price: 1199.0,
						originalPrice: 1999.0,
						image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800",
						category: "electronics",
						isP2P: true,
					},
					likesCount: 840,
					viewsCount: 12900,
					tags: ["c2c", "macbook", "techdeals", "preowned"],
					comments: [
						{ userName: "Vikram R.", text: "Sent you an offer in chat!", createdAt: new Date() },
					],
				},
			];

			await Reel.insertMany(sampleReels);
			console.log("✅ Auto-seeded Shoppable Video Shorts Reels!");
		}
	} catch (e) {
		console.log("Auto-seed notice:", e.message);
	}
}
