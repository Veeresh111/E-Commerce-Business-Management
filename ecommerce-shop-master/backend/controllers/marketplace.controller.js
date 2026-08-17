import MarketplaceProduct from "../models/marketplace.model.js";
import P2PMessage from "../models/p2pMessage.model.js";
import User from "../models/user.model.js";

// @desc Fetch all C2C marketplace listings with filters
export const getMarketplaceListings = async (req, res) => {
	try {
		const { category, condition, city, minPrice, maxPrice, q, sort = "newest", limit = 20, page = 1 } = req.query;
		const query = { status: "active" };

		if (category && category !== "all") {
			query.category = category.toLowerCase();
		}
		if (condition && condition !== "all") {
			query.condition = condition;
		}
		if (city && city.trim() !== "") {
			query["location.city"] = { $regex: city.trim(), $options: "i" };
		}
		if (minPrice || maxPrice) {
			query.price = {};
			if (minPrice) query.price.$gte = Number(minPrice);
			if (maxPrice) query.price.$lte = Number(maxPrice);
		}
		if (q && q.trim() !== "") {
			query.$or = [
				{ title: { $regex: q.trim(), $options: "i" } },
				{ description: { $regex: q.trim(), $options: "i" } },
			];
		}

		let sortOption = { createdAt: -1 };
		if (sort === "price_asc") sortOption = { price: 1 };
		if (sort === "price_desc") sortOption = { price: -1 };
		if (sort === "popular") sortOption = { views: -1 };

		const skip = (Number(page) - 1) * Number(limit);
		const [listings, total] = await Promise.all([
			MarketplaceProduct.find(query).sort(sortOption).skip(skip).limit(Number(limit)),
			MarketplaceProduct.countDocuments(query),
		]);

		res.json({ listings, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
	} catch (error) {
		console.error("Error in getMarketplaceListings:", error.message);
		res.status(500).json({ message: "Failed to fetch marketplace listings" });
	}
};

// @desc Get single listing detail by ID
export const getListingById = async (req, res) => {
	try {
		const listing = await MarketplaceProduct.findByIdAndUpdate(
			req.params.id,
			{ $inc: { views: 1 } },
			{ new: true }
		).populate("seller", "name email createdAt");

		if (!listing) return res.status(404).json({ message: "Listing not found" });
		res.json(listing);
	} catch (error) {
		res.status(500).json({ message: "Failed to get listing" });
	}
};

// @desc Create a new user C2C listing
export const createListing = async (req, res) => {
	try {
		const { title, description, price, originalRetailPrice, condition, category, images, location, isNegotiable, phoneContact } = req.body;

		if (!title || !description || price === undefined || !category || !location?.city) {
			return res.status(400).json({ message: "Title, description, price, category, and city are required" });
		}

		const newListing = await MarketplaceProduct.create({
			title,
			description,
			price: Number(price),
			originalRetailPrice: originalRetailPrice ? Number(originalRetailPrice) : Number(price) * 1.3,
			condition: condition || "like_new",
			category: category.toLowerCase(),
			images: images && images.length > 0 ? images : ["https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=800"],
			seller: req.user._id,
			sellerName: req.user.name,
			location: {
				city: location.city,
				state: location.state || "",
				country: location.country || "USA",
				neighborhood: location.neighborhood || "",
			},
			isNegotiable: isNegotiable !== undefined ? isNegotiable : true,
			phoneContact: phoneContact || "",
		});

		res.status(201).json(newListing);
	} catch (error) {
		console.error("Error in createListing:", error.message);
		res.status(500).json({ message: "Failed to create listing" });
	}
};

// @desc Get logged in user's listings
export const getMyListings = async (req, res) => {
	try {
		const listings = await MarketplaceProduct.find({ seller: req.user._id }).sort({ createdAt: -1 });
		res.json(listings);
	} catch (error) {
		res.status(500).json({ message: "Failed to retrieve your listings" });
	}
};

// @desc Update listing status (e.g. mark as sold or active)
export const updateListingStatus = async (req, res) => {
	try {
		const { status } = req.body;
		const listing = await MarketplaceProduct.findById(req.params.id);

		if (!listing) return res.status(404).json({ message: "Listing not found" });
		if (listing.seller.toString() !== req.user._id.toString() && req.user.role !== "admin") {
			return res.status(403).json({ message: "Unauthorized to modify this listing" });
		}

		listing.status = status;
		await listing.save();
		res.json(listing);
	} catch (error) {
		res.status(500).json({ message: "Failed to update listing status" });
	}
};

// @desc Delete listing
export const deleteListing = async (req, res) => {
	try {
		const listing = await MarketplaceProduct.findById(req.params.id);
		if (!listing) return res.status(404).json({ message: "Listing not found" });

		if (listing.seller.toString() !== req.user._id.toString() && req.user.role !== "admin") {
			return res.status(403).json({ message: "Unauthorized to delete this listing" });
		}

		await MarketplaceProduct.findByIdAndDelete(req.params.id);
		res.json({ message: "Listing deleted successfully" });
	} catch (error) {
		res.status(500).json({ message: "Failed to delete listing" });
	}
};

// @desc Send inquiry / make offer on a listing
export const sendInquiryOrOffer = async (req, res) => {
	try {
		const { listingId, message, offerAmount } = req.body;
		const listing = await MarketplaceProduct.findById(listingId);
		if (!listing) return res.status(404).json({ message: "Listing not found" });

		if (listing.seller.toString() === req.user._id.toString()) {
			return res.status(400).json({ message: "You cannot make an offer on your own listing" });
		}

		let conversation = await P2PMessage.findOne({
			listing: listingId,
			buyer: req.user._id,
		});

		const messageObj = {
			sender: req.user._id,
			senderName: req.user.name,
			text: message || (offerAmount ? `I'd like to offer $${offerAmount} for this item.` : "Hello, is this item still available?"),
			offerAmount: offerAmount ? Number(offerAmount) : undefined,
			createdAt: new Date(),
		};

		if (conversation) {
			conversation.messages.push(messageObj);
			if (offerAmount) {
				conversation.currentOffer = Number(offerAmount);
				conversation.status = "offer_made";
			}
			conversation.lastMessage = messageObj.text;
			await conversation.save();
		} else {
			conversation = await P2PMessage.create({
				listing: listing._id,
				listingTitle: listing.title,
				listingImage: listing.images[0] || "",
				listingPrice: listing.price,
				buyer: req.user._id,
				buyerName: req.user.name,
				seller: listing.seller,
				sellerName: listing.sellerName,
				messages: [messageObj],
				currentOffer: offerAmount ? Number(offerAmount) : undefined,
				status: offerAmount ? "offer_made" : "inquiry",
				lastMessage: messageObj.text,
			});
			await MarketplaceProduct.findByIdAndUpdate(listingId, { $inc: { inquiriesCount: 1 } });
		}

		res.status(201).json(conversation);
	} catch (error) {
		console.error("Error in sendInquiryOrOffer:", error.message);
		res.status(500).json({ message: "Failed to send message/offer" });
	}
};

// @desc Get user's active marketplace chat conversations
export const getMyConversations = async (req, res) => {
	try {
		const conversations = await P2PMessage.find({
			$or: [{ buyer: req.user._id }, { seller: req.user._id }],
		}).sort({ updatedAt: -1 });

		res.json(conversations);
	} catch (error) {
		res.status(500).json({ message: "Failed to fetch conversations" });
	}
};

// @desc Accept or reject an offer
export const respondToOffer = async (req, res) => {
	try {
		const { conversationId, action } = req.body; // action: "accept" | "reject"
		const conversation = await P2PMessage.findById(conversationId);
		if (!conversation) return res.status(404).json({ message: "Conversation not found" });

		if (conversation.seller.toString() !== req.user._id.toString()) {
			return res.status(403).json({ message: "Only the seller can accept or reject offers" });
		}

		conversation.status = action === "accept" ? "offer_accepted" : "offer_rejected";
		conversation.messages.push({
			sender: req.user._id,
			senderName: req.user.name,
			text: action === "accept"
				? `🎉 Offer of $${conversation.currentOffer} has been ACCEPTED! Let's arrange meetup/delivery.`
				: `❌ Offer of $${conversation.currentOffer} has been declined.`,
			createdAt: new Date(),
		});
		await conversation.save();

		res.json(conversation);
	} catch (error) {
		res.status(500).json({ message: "Failed to update offer status" });
	}
};
