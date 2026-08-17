import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
	getMarketplaceListings,
	getListingById,
	createListing,
	getMyListings,
	updateListingStatus,
	deleteListing,
	sendInquiryOrOffer,
	getMyConversations,
	respondToOffer,
} from "../controllers/marketplace.controller.js";

const router = express.Router();

router.get("/", getMarketplaceListings);
router.get("/my-listings", protectRoute, getMyListings);
router.get("/conversations", protectRoute, getMyConversations);
router.get("/:id", getListingById);
router.post("/", protectRoute, createListing);
router.patch("/:id/status", protectRoute, updateListingStatus);
router.delete("/:id", protectRoute, deleteListing);
router.post("/inquire", protectRoute, sendInquiryOrOffer);
router.post("/respond-offer", protectRoute, respondToOffer);

export default router;
