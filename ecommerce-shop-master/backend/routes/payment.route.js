import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
	checkoutSuccess,
	createCheckoutSession,
	processDirectPayment,
} from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/create-checkout-session", protectRoute, createCheckoutSession);
router.post("/checkout-success", protectRoute, checkoutSuccess);
router.post("/direct-checkout", protectRoute, processDirectPayment);

export default router;