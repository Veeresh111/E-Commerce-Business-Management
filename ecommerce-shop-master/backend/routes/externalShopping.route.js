import express from "express";
import { getExternalGlobalProducts } from "../controllers/externalShopping.controller.js";

const router = express.Router();

router.get("/products", getExternalGlobalProducts);

export default router;
