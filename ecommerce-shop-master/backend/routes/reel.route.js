import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
	getReels,
	getReelById,
	createReel,
	toggleLikeReel,
	addCommentToReel,
	deleteReel,
} from "../controllers/reel.controller.js";

const router = express.Router();

router.get("/", getReels);
router.get("/:id", getReelById);
router.post("/", protectRoute, createReel);
router.post("/:id/like", protectRoute, toggleLikeReel);
router.post("/:id/comment", protectRoute, addCommentToReel);
router.delete("/:id", protectRoute, deleteReel);

export default router;
