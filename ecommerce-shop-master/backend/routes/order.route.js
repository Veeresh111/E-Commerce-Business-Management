import express from "express";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import {
	getAllOrders,
	getMyOrders,
	getOrderById,
	updateOrderStatus,
	cancelOrder,
} from "../controllers/order.controller.js";

const router = express.Router();

router.get("/", protectRoute, getMyOrders);
router.get("/all", protectRoute, adminRoute, getAllOrders);
router.get("/:id", protectRoute, getOrderById);
router.patch("/:id/status", protectRoute, adminRoute, updateOrderStatus);
router.patch("/:id/cancel", protectRoute, cancelOrder);

export default router;