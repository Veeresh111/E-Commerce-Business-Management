import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
	chatShopperAssistant,
	compareCompetitorPrices,
	negotiateDeal,
	visualSearch,
	analyzeReviews,
	arbitrateReturnDispute,
	checkAuthRisk,
	getSmartBundles,
	getFlashDeals,
	getDeliveryEstimate,
} from "../controllers/ai.controller.js";

const router = express.Router();

// Public AI Endpoints
router.post("/chat", chatShopperAssistant);
router.get("/compare-prices/:id", compareCompetitorPrices);
router.post("/visual-search", visualSearch);
router.get("/analyze-reviews/:id", analyzeReviews);
router.post("/auth-risk", checkAuthRisk);
router.get("/bundles/:id", getSmartBundles);
router.get("/flash-deals", getFlashDeals);
router.get("/delivery-estimate", getDeliveryEstimate);

// Protected AI Endpoints (Require User Authentication)
router.post("/negotiate", protectRoute, negotiateDeal);
router.post("/arbitrate-return", protectRoute, arbitrateReturnDispute);

export default router;
