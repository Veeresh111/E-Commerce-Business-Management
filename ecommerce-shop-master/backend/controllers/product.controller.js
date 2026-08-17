import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import mongoose from "mongoose";
import Product from "../models/product.model.js";
import Order from "../models/order.model.js";
import { globalProductTrie, globalAffinityGraph } from "../lib/dsaEngine.js";

const FEATURED_CACHE_KEY = "featured_products";
const FEATURED_CACHE_TTL = 60 * 60; // 1 hour

const parsePagination = (query, defaultLimit = 12) => {
	const page = Math.max(parseInt(query.page) || 1, 1);
	const limit = Math.min(Math.max(parseInt(query.limit) || defaultLimit, 1), 50);
	return { page, limit, skip: (page - 1) * limit };
};

// Helper: Ensure Trie index is populated
async function ensureTrieIndexed() {
	if (globalProductTrie.wordCount === 0) {
		const products = await Product.find({}).lean();
		for (const p of products) {
			globalProductTrie.insert(p.name, p);
			if (p.category) globalProductTrie.insert(p.category, p);
		}
	}
}

export const getAllProducts = async (req, res) => {
	try {
		const { page, limit, skip } = parsePagination(req.query);
		const filter = req.query.q ? { name: { $regex: req.query.q, $options: "i" } } : {};

		const [products, total] = await Promise.all([
			Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
			Product.countDocuments(filter),
		]);

		res.json({
			products,
			pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
		});
	} catch (error) {
		console.log("Error in getAllProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getProductById = async (req, res) => {
	try {
		const { id } = req.params;
		if (!mongoose.isValidObjectId(id)) {
			return res.status(400).json({ message: "Invalid product id" });
		}

		const product = await Product.findById(id).lean();
		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}

		res.json(product);
	} catch (error) {
		console.log("Error in getProductById controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const searchProducts = async (req, res) => {
	try {
		const { q } = req.query;
		if (!q || !q.trim()) {
			return res.status(400).json({ message: "Search query is required" });
		}

		const { page, limit, skip } = parsePagination(req.query, 12);
		await ensureTrieIndexed();

		let products;
		try {
			products = await Product.find({ $text: { $search: q } })
				.sort({ score: { $meta: "textScore" } })
				.skip(skip)
				.limit(limit)
				.lean();
		} catch {
			products = await Product.find({
				$or: [
					{ name: { $regex: q, $options: "i" } },
					{ category: { $regex: q, $options: "i" } },
				],
			})
				.skip(skip)
				.limit(limit)
				.lean();
		}

		// If regex/text query yielded 0 results, utilize Trie fuzzy Levenshtein search
		if (!products || products.length === 0) {
			const fuzzyMatches = globalProductTrie.autocomplete(q, limit);
			if (fuzzyMatches.length > 0) {
				products = fuzzyMatches;
			}
		}

		const total = await Product.countDocuments({
			$or: [
				{ name: { $regex: q, $options: "i" } },
				{ category: { $regex: q, $options: "i" } },
			],
		});

		res.json({
			products: products || [],
			pagination: { page, limit, total: Math.max(total, products?.length || 0), totalPages: Math.ceil((total || products?.length || 1) / limit) },
		});
	} catch (error) {
		console.log("Error in searchProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const autocompleteProducts = async (req, res) => {
	try {
		const { q } = req.query;
		if (!q || !q.trim()) {
			return res.json([]);
		}

		await ensureTrieIndexed();
		const suggestions = globalProductTrie.autocomplete(q, 6);
		res.json(suggestions);
	} catch (error) {
		console.log("Error in autocompleteProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const addProductReview = async (req, res) => {
	try {
		const { id } = req.params;
		const { rating, comment } = req.body;

		if (!rating || !comment) {
			return res.status(400).json({ message: "Rating and comment are required" });
		}

		const product = await Product.findById(id);
		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}

		const newReview = {
			user: req.user?.name || "Verified Customer",
			rating: Number(rating),
			comment: comment.trim(),
		};

		product.reviews.unshift(newReview);
		product.reviewCount = product.reviews.length;
		product.rating = parseFloat(
			(product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length).toFixed(1)
		);

		await product.save();
		res.status(201).json({ message: "Review added successfully", product });
	} catch (error) {
		console.log("Error in addProductReview controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getFeaturedProducts = async (req, res) => {
	try {
		let featuredProducts = await redis.get(FEATURED_CACHE_KEY);
		if (featuredProducts) {
			return res.json(JSON.parse(featuredProducts));
		}

		featuredProducts = await Product.find({ isFeatured: true }).lean();

		if (!featuredProducts || featuredProducts.length === 0) {
			return res.json([]);
		}

		await redis.set(FEATURED_CACHE_KEY, JSON.stringify(featuredProducts), "EX", FEATURED_CACHE_TTL);
		res.json(featuredProducts);
	} catch (error) {
		console.log("Error in getFeaturedProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const createProduct = async (req, res) => {
	try {
		const { name, description, price, image, category, specs, tags } = req.body;

		if (!name || !description || !category || price === undefined) {
			return res.status(400).json({ message: "Missing required product fields" });
		}

		const numericPrice = Number(price);
		if (!Number.isFinite(numericPrice) || numericPrice < 0) {
			return res.status(400).json({ message: "Price must be a non-negative number" });
		}

		let cloudinaryResponse = null;

		if (image) {
			cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" });
		}

		const product = await Product.create({
			name,
			description,
			price: numericPrice,
			originalPrice: Math.round(numericPrice * 1.25),
			discountPercentage: 20,
			image: cloudinaryResponse?.secure_url || image || "",
			category,
			specs: specs || {},
			tags: tags || [category.toLowerCase()],
			competitorPrices: {
				amazon: Math.round(numericPrice * 1.15),
				flipkart: Math.round(numericPrice * 1.20),
			},
		});

		globalProductTrie.insert(name, product);
		globalProductTrie.insert(category, product);

		await invalidateFeaturedCache();

		res.status(201).json(product);
	} catch (error) {
		console.log("Error in createProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const deleteProduct = async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);

		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}

		if (product.image) {
			const publicId = product.image.split("/").pop().split(".")[0];
			try {
				await cloudinary.uploader.destroy(`products/${publicId}`);
			} catch (error) {
				console.log("error deleting image from cloudinary", error);
			}
		}

		await Product.findByIdAndDelete(req.params.id);
		await invalidateFeaturedCache();

		res.json({ message: "Product deleted successfully" });
	} catch (error) {
		console.log("Error in deleteProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getRecommendedProducts = async (req, res) => {
	try {
		const seedParam = req.query.seed;
		const seedIds = seedParam
			? seedParam
					.split(",")
					.filter((id) => mongoose.isValidObjectId(id))
					.map((id) => new mongoose.Types.ObjectId(id))
			: [];

		let recommended = [];

		if (seedIds.length > 0) {
			const coOccurrences = await Order.aggregate([
				{
					$match: {
						"products.product": { $in: seedIds },
						status: { $ne: "cancelled" },
					},
				},
				{ $unwind: "$products" },
				{
					$match: {
						"products.product": { $nin: seedIds },
					},
				},
				{
					$group: {
						_id: "$products.product",
						score: { $sum: 1 },
					},
				},
				{ $sort: { score: -1 } },
				{ $limit: 4 },
				{
					$lookup: {
						from: "products",
						localField: "_id",
						foreignField: "_id",
						as: "product",
					},
				},
				{ $unwind: "$product" },
				{
					$project: {
						_id: "$product._id",
						name: "$product.name",
						description: "$product.description",
						image: "$product.image",
						price: "$product.price",
						rating: "$product.rating",
					},
				},
			]);

			recommended = coOccurrences || [];
		}

		if (recommended.length < 4) {
			const fillCount = 4 - recommended.length;
			const excludeIds = [...seedIds, ...recommended.map((r) => r._id)];

			const random = await Product.aggregate([
				{
					$match: {
						_id: { $nin: excludeIds },
					},
				},
				{ $sample: { size: fillCount } },
				{
					$project: {
						_id: 1,
						name: 1,
						description: 1,
						image: 1,
						price: 1,
						rating: 1,
					},
				},
			]);

			recommended = [...recommended, ...random];
		}

		res.json(recommended.slice(0, 4));
	} catch (error) {
		console.log("Error in getRecommendedProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getProductsByCategory = async (req, res) => {
	const { category } = req.params;
	try {
		const { page, limit, skip } = parsePagination(req.query);

		const [products, total] = await Promise.all([
			Product.find({ category }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
			Product.countDocuments({ category }),
		]);

		res.json({
			products,
			pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
		});
	} catch (error) {
		console.log("Error in getProductsByCategory controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const toggleFeaturedProduct = async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);
		if (product) {
			product.isFeatured = !product.isFeatured;
			const updatedProduct = await product.save();
			await updateFeaturedProductsCache();
			res.json(updatedProduct);
		} else {
			res.status(404).json({ message: "Product not found" });
		}
	} catch (error) {
		console.log("Error in toggleFeaturedProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

async function updateFeaturedProductsCache() {
	try {
		const featuredProducts = await Product.find({ isFeatured: true }).lean();
		await redis.set(FEATURED_CACHE_KEY, JSON.stringify(featuredProducts), "EX", FEATURED_CACHE_TTL);
	} catch (error) {
		console.log("error in update featured cache function:", error.message);
	}
}

async function invalidateFeaturedCache() {
	try {
		await redis.del(FEATURED_CACHE_KEY);
	} catch (error) {
		console.log("error invalidating featured cache:", error.message);
	}
}