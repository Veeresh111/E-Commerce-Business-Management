import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import helmet from "helmet";
import compression from "compression";
import { rateLimit } from "express-rate-limit";

import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import couponRoutes from "./routes/coupon.route.js";
import paymentRoutes from "./routes/payment.route.js";
import analyticsRoutes from "./routes/analytics.route.js";
import orderRoutes from "./routes/order.route.js";
import aiRoutes from "./routes/ai.route.js";
import marketplaceRoutes from "./routes/marketplace.route.js";
import reelRoutes from "./routes/reel.route.js";
import externalShoppingRoutes from "./routes/externalShopping.route.js";
import userPersonaRoutes from "./routes/userPersona.route.js";

import { stripeWebhook } from "./controllers/payment.controller.js";
import { requestLogger } from "./lib/logger.js";

dotenv.config();

const app = express();
const __dirname = path.resolve();

app.set("trust proxy", 1);

// --- CORS & Security Headers ---
app.use((req, res, next) => {
	const origin = req.headers.origin;
	const allowedOrigins = ["http://localhost:5173", "http://localhost:3000", process.env.CLIENT_URL].filter(Boolean);
	if (allowedOrigins.includes(origin) || !origin || process.env.NODE_ENV !== "production") {
		res.setHeader("Access-Control-Allow-Origin", origin || "http://localhost:5173");
	}
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, stripe-signature");
	res.setHeader("Access-Control-Allow-Credentials", "true");

	if (req.method === "OPTIONS") {
		return res.sendStatus(204);
	}
	next();
});

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(compression());
app.use(requestLogger);

// Stripe webhook needs the RAW request body for signature verification.
// Must be registered BEFORE the global JSON body parser.
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), (req, res) => {
	stripeWebhook(req, res);
});

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// --- API-wide rate limiting ---
const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: process.env.NODE_ENV === "test" ? 2000 : 500,
	standardHeaders: "draft-7",
	legacyHeaders: false,
	message: { message: "Too many requests, please try again later." },
});
app.use("/api", apiLimiter);

// --- Auth brute-force protection ---
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: process.env.NODE_ENV === "test" ? 2000 : 60,
	standardHeaders: "draft-7",
	legacyHeaders: false,
	message: { message: "Too many login attempts, please try again in 15 minutes." },
});
app.use("/api/auth", authLimiter);

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/reels", reelRoutes);
app.use("/api/external-shopping", externalShoppingRoutes);
app.use("/api/persona", userPersonaRoutes);

// --- Health check ---
app.get("/healthz", (req, res) => {
	res.status(200).json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// --- API 404 (never fall through to the SPA catch-all) ---
app.use("/api", (req, res) => {
	res.status(404).json({ message: "API route not found" });
});

if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "/frontend/dist")));

	app.get("*", (req, res) => {
		res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
	});
}

// --- Centralized error handler ---
app.use((err, req, res, next) => {
	console.error("Unhandled error:", err.message);
	res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

export default app;