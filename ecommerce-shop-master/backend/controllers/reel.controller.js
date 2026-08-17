import Reel from "../models/reel.model.js";
import { callFreeProxyAi } from "../lib/aiProxy.js";

// @desc Fetch shoppable video reels with region/location trends
export const getReels = async (req, res) => {
	try {
		const { region, city, limit = 15, page = 1 } = req.query;
		const query = {};

		if (region && region !== "All" && region !== "Global") {
			query.region = region;
		}
		if (city && city.trim() !== "") {
			query.city = { $regex: city.trim(), $options: "i" };
		}

		const skip = (Number(page) - 1) * Number(limit);
		const [reels, total] = await Promise.all([
			Reel.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
			Reel.countDocuments(query),
		]);

		res.json({ reels, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
	} catch (error) {
		console.error("Error in getReels:", error.message);
		res.status(500).json({ message: "Failed to fetch shoppable video reels" });
	}
};

// @desc Get single reel
export const getReelById = async (req, res) => {
	try {
		const reel = await Reel.findByIdAndUpdate(
			req.params.id,
			{ $inc: { viewsCount: 1 } },
			{ new: true }
		);
		if (!reel) return res.status(404).json({ message: "Reel not found" });
		res.json(reel);
	} catch (error) {
		res.status(500).json({ message: "Failed to fetch reel" });
	}
};

// @desc Create a new UGC shoppable video reel with Agentic AI Content Moderation
export const createReel = async (req, res) => {
	try {
		const { videoUrl, thumbnail, title, description, region, city, product, tags } = req.body;

		if (!videoUrl || !title || !product?.name || !product?.price) {
			return res.status(400).json({ message: "Video URL, title, and linked product details (name, price, image) are required" });
		}

		// --- Agentic AI Content Moderation Scanner ---
		// Enforce strict business, shopping, product reviews, unboxing, fashion & tech relevance
		if (process.env.NODE_ENV !== "test") {
			try {
				const scanPrompt = `You are NexusMart's Agentic Video Scanner & Content Moderation AI.
Task: Inspect this user short submission to ensure it is strictly related to shopping, products, unboxing, fashion, tech, or commerce.
Video Metadata:
- Title: "${title}"
- Description: "${description || ''}"
- Tags: "${(tags || []).join(', ')}"
- Linked Product: "${product.name}" ($${product.price})

Respond in strict JSON:
{
  "approved": true or false,
  "confidenceScore": 0.95,
  "moderationReason": "Brief explanation of commerce relevance or violation reason"
}`;

				const scanResultText = await callFreeProxyAi(scanPrompt);
				const clean = scanResultText.replace(/```json/gi, "").replace(/```/g, "").trim();
				const scanResult = JSON.parse(clean);

				if (scanResult.approved === false) {
					return res.status(400).json({
						message: `Agentic AI Rejected Short: ${scanResult.moderationReason || "Video must be strictly product, shopping, or commerce-related."}`,
						rejectedByAi: true,
					});
				}
			} catch (scanErr) {
				console.log("Agentic video scanner passed with fallback approval:", scanErr.message);
			}
		}

		const newReel = await Reel.create({
			videoUrl,
			thumbnail: thumbnail || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800",
			title,
			description: description || "",
			creator: req.user._id,
			creatorName: req.user.name,
			creatorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
			region: region || "Global",
			city: city || req.user.location?.city || "New York",
			product: {
				name: product.name,
				price: Number(product.price),
				originalPrice: product.originalPrice ? Number(product.originalPrice) : Number(product.price) * 1.25,
				image: product.image || "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=800",
				category: product.category || "apparel",
				productId: product.productId || undefined,
				isP2P: !!product.isP2P,
			},
			tags: tags && Array.isArray(tags) ? tags : ["trends", "style", "deal"],
		});

		res.status(201).json(newReel);
	} catch (error) {
		console.error("Error in createReel:", error.message);
		res.status(500).json({ message: "Failed to create reel" });
	}
};

// @desc Toggle like on a video reel
export const toggleLikeReel = async (req, res) => {
	try {
		const reel = await Reel.findById(req.params.id);
		if (!reel) return res.status(404).json({ message: "Reel not found" });

		const userId = req.user._id.toString();
		const isLiked = reel.likes.some((id) => id.toString() === userId);

		if (isLiked) {
			reel.likes = reel.likes.filter((id) => id.toString() !== userId);
			reel.likesCount = Math.max(0, reel.likesCount - 1);
		} else {
			reel.likes.push(req.user._id);
			reel.likesCount += 1;
		}

		await reel.save();
		res.json({ likesCount: reel.likesCount, isLiked: !isLiked });
	} catch (error) {
		res.status(500).json({ message: "Failed to toggle like on reel" });
	}
};

// @desc Add comment to a video reel
export const addCommentToReel = async (req, res) => {
	try {
		const { text } = req.body;
		if (!text || text.trim() === "") {
			return res.status(400).json({ message: "Comment text cannot be empty" });
		}

		const reel = await Reel.findById(req.params.id);
		if (!reel) return res.status(404).json({ message: "Reel not found" });

		const newComment = {
			user: req.user._id,
			userName: req.user.name,
			text: text.trim(),
			createdAt: new Date(),
		};

		reel.comments.push(newComment);
		await reel.save();

		res.status(201).json(reel.comments);
	} catch (error) {
		res.status(500).json({ message: "Failed to add comment" });
	}
};

// @desc Delete a reel
export const deleteReel = async (req, res) => {
	try {
		const reel = await Reel.findById(req.params.id);
		if (!reel) return res.status(404).json({ message: "Reel not found" });

		if (reel.creator.toString() !== req.user._id.toString() && req.user.role !== "admin") {
			return res.status(403).json({ message: "Unauthorized to delete this reel" });
		}

		await Reel.findByIdAndDelete(req.params.id);
		res.json({ message: "Reel deleted successfully" });
	} catch (error) {
		res.status(500).json({ message: "Failed to delete reel" });
	}
};
