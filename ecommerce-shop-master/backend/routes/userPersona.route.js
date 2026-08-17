import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
	getPersonaProfile,
	updatePersonaProfile,
	recordTelemetry,
	getAgenticRecommendations,
} from "../controllers/userPersona.controller.js";

const router = express.Router();

router.get("/profile", protectRoute, getPersonaProfile);
router.put("/profile", protectRoute, updatePersonaProfile);
router.post("/telemetry", protectRoute, recordTelemetry);
router.get("/recommendations", protectRoute, getAgenticRecommendations);

export default router;
