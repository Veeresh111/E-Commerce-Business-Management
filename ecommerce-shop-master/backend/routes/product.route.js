import express from "express";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import {
	createProduct,
	deleteProduct,
	getAllProducts,
	getProductById,
	getFeaturedProducts,
	getProductsByCategory,
	getRecommendedProducts,
	searchProducts,
	autocompleteProducts,
	addProductReview,
	toggleFeaturedProduct,
} from "../controllers/product.controller.js";

const router = express.Router();

router.get("/", protectRoute, adminRoute, getAllProducts);
router.get("/search", searchProducts);
router.get("/autocomplete", autocompleteProducts);
router.get("/featured", getFeaturedProducts);
router.get("/category/:category", getProductsByCategory);
router.get("/recommendations", getRecommendedProducts);
router.get("/:id", getProductById);
router.post("/:id/reviews", protectRoute, addProductReview);
router.post("/", protectRoute, adminRoute, createProduct);
router.patch("/:id", protectRoute, adminRoute, toggleFeaturedProduct);
router.delete("/:id", protectRoute, adminRoute, deleteProduct);

export default router;
