import crypto from "crypto";
import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { sendEmail, isConfigured } from "../lib/mailer.js";

const ACCESS_TOKEN_TTL = 15 * 60; // seconds
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // seconds (7 days)
const REFRESH_TOKEN_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // ms

const generateTokens = (userId) => {
	const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET || "default_access_secret", {
		expiresIn: ACCESS_TOKEN_TTL,
	});

	// jti makes every refresh token unique so rotation produces a different token.
	const refreshToken = jwt.sign({ userId, jti: crypto.randomUUID() }, process.env.REFRESH_TOKEN_SECRET || "default_refresh_secret", {
		expiresIn: REFRESH_TOKEN_TTL,
	});

	return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
	await redis.set(`refresh_token:${userId}`, refreshToken, "EX", REFRESH_TOKEN_TTL);
};

const setCookies = (res, accessToken, refreshToken) => {
	const cookieOptions = {
		httpOnly: true, // prevent XSS attacks
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
	};

	res.cookie("accessToken", accessToken, {
		...cookieOptions,
		maxAge: ACCESS_TOKEN_TTL * 1000, // 15 minutes
	});
	res.cookie("refreshToken", refreshToken, {
		...cookieOptions,
		maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE, // 7 days
	});
};

const sendVerificationEmail = async (user) => {
	const token = crypto.randomBytes(32).toString("hex");
	user.emailVerificationToken = token;
	user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
	await user.save();

	const link = `${process.env.CLIENT_URL || "http://localhost:5173"}/verify-email?token=${token}`;

	await sendEmail({
		to: user.email,
		subject: "Verify your email address",
		text: `Welcome to NexusMart! Verify your email by visiting: ${link}`,
		html: `<p>Welcome to NexusMart!</p><p>Verify your email by clicking <a href="${link}">here</a>.</p>`,
	});
};

export const signup = async (req, res) => {
	const { email, password, name } = req.body;
	try {
		if (!email || !password || !name) {
			return res.status(400).json({ message: "All fields are required" });
		}
		if (typeof password !== "string" || password.length < 6) {
			return res.status(400).json({ message: "Password must be at least 6 characters long" });
		}

		const userExists = await User.findOne({ email });

		if (userExists) {
			return res.status(400).json({ message: "User already exists with this email" });
		}
		const user = await User.create({ name, email, password });

		// authenticate
		const { accessToken, refreshToken } = generateTokens(user._id);
		await storeRefreshToken(user._id, refreshToken);

		setCookies(res, accessToken, refreshToken);

		try {
			if (isConfigured()) {
				await sendVerificationEmail(user);
			}
		} catch (mailError) {
			console.log("Failed to send verification email:", mailError.message);
		}

		const userPayload = {
			_id: user._id,
			name: user.name,
			email: user.email,
			role: user.role,
			emailVerified: user.emailVerified,
			profession: user.profession,
			hobbies: user.hobbies,
			interests: user.interests,
			location: user.location,
		};

		res.status(201).json({
			...userPayload,
			user: userPayload,
			message: "User created successfully",
		});
	} catch (error) {
		console.log("Error in signup controller", error.message);
		res.status(500).json({ message: error.message });
	}
};

export const login = async (req, res) => {
	try {
		const { email, password } = req.body;
		if (!email || !password) {
			return res.status(400).json({ message: "Email and password are required" });
		}

		const user = await User.findOne({ email });

		if (user && (await user.comparePassword(password))) {
			const { accessToken, refreshToken } = generateTokens(user._id);
			await storeRefreshToken(user._id, refreshToken);
			setCookies(res, accessToken, refreshToken);

			const userPayload = {
				_id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
				emailVerified: user.emailVerified,
				profession: user.profession,
				hobbies: user.hobbies,
				interests: user.interests,
				location: user.location,
			};

			res.json({
				...userPayload,
				user: userPayload,
				message: "Logged in successfully",
			});
		} else {
			res.status(400).json({ message: "Invalid email or password" });
		}
	} catch (error) {
		console.log("Error in login controller", error.message);
		res.status(500).json({ message: error.message });
	}
};

// @desc Google OAuth Sign In / Sign Up handler
export const googleAuth = async (req, res) => {
	try {
		const { credential, email: directEmail, name: directName } = req.body;

		let email = directEmail;
		let name = directName;

		if (credential) {
			// Decode JWT token from Google Identity Services
			const decoded = jwt.decode(credential);
			if (decoded && decoded.email) {
				email = decoded.email;
				name = decoded.name || decoded.given_name || "Google User";
			}
		}

		if (!email) {
			return res.status(400).json({ message: "Google authentication failed: No email provided" });
		}

		let user = await User.findOne({ email });
		if (!user) {
			const randomPassword = crypto.randomBytes(16).toString("hex") + "Aa1!";
			user = await User.create({
				name: name || "Google User",
				email: email.toLowerCase(),
				password: randomPassword,
				emailVerified: true,
			});
		} else {
			user.emailVerified = true;
			await user.save();
		}

		const { accessToken, refreshToken } = generateTokens(user._id);
		await storeRefreshToken(user._id, refreshToken);
		setCookies(res, accessToken, refreshToken);

		res.json({
			user: {
				_id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
				emailVerified: user.emailVerified,
				profession: user.profession,
				hobbies: user.hobbies,
				interests: user.interests,
				location: user.location,
			},
			message: "Google authentication successful",
		});
	} catch (error) {
		console.error("Error in googleAuth controller:", error.message);
		res.status(500).json({ message: "Google auth error", error: error.message });
	}
};

export const logout = async (req, res) => {
	try {
		const refreshToken = req.cookies.refreshToken;
		if (refreshToken) {
			const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || "default_refresh_secret");
			await redis.del(`refresh_token:${decoded.userId}`);
		}

		res.clearCookie("accessToken");
		res.clearCookie("refreshToken");
		res.json({ message: "Logged out successfully" });
	} catch (error) {
		res.clearCookie("accessToken");
		res.clearCookie("refreshToken");
		res.json({ message: "Logged out successfully" });
	}
};

export const refreshToken = async (req, res) => {
	try {
		const refreshToken = req.cookies.refreshToken;

		if (!refreshToken) {
			return res.status(401).json({ message: "No refresh token provided" });
		}

		let decoded;
		try {
			decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || "default_refresh_secret");
		} catch (err) {
			return res.status(401).json({ message: "Invalid refresh token" });
		}

		const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

		if (storedToken !== refreshToken) {
			await redis.del(`refresh_token:${decoded.userId}`);
			res.clearCookie("accessToken");
			res.clearCookie("refreshToken");
			return res.status(401).json({ message: "Invalid or reused refresh token. Please log in again." });
		}

		const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);
		await storeRefreshToken(decoded.userId, newRefreshToken);
		setCookies(res, newAccessToken, newRefreshToken);

		res.json({ message: "Token refreshed successfully" });
	} catch (error) {
		console.log("Error in refreshToken controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const verifyEmail = async (req, res) => {
	try {
		const { token } = req.query;

		if (!token) {
			return res.status(400).json({ message: "Verification token is required" });
		}

		const user = await User.findOne({ emailVerificationToken: token });

		if (!user) {
			return res.status(400).json({ message: "Invalid or expired verification token" });
		}

		if (user.emailVerificationExpires < new Date()) {
			return res.status(400).json({ message: "Verification token has expired" });
		}

		user.emailVerified = true;
		user.emailVerificationToken = undefined;
		user.emailVerificationExpires = undefined;
		await user.save();

		res.json({ message: "Email verified successfully. You may now use all features." });
	} catch (error) {
		console.log("Error in verifyEmail controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const forgotPassword = async (req, res) => {
	try {
		const { email } = req.body;
		if (!email) {
			return res.status(400).json({ message: "Email is required" });
		}

		const user = await User.findOne({ email });

		if (user) {
			const resetToken = crypto.randomBytes(32).toString("hex");
			user.resetPasswordToken = resetToken;
			user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
			await user.save();

			const link = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;

			await sendEmail({
				to: user.email,
				subject: "Reset your password",
				text: `Reset your password by visiting: ${link} (expires in 15 minutes)`,
				html: `<p>Reset your password by clicking <a href="${link}">here</a>.</p><p>This link expires in 15 minutes.</p>`,
			});
		}

		res.json({ message: "If that email exists, a password reset link has been sent." });
	} catch (error) {
		console.log("Error in forgotPassword controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const resetPassword = async (req, res) => {
	try {
		const { token, password } = req.body;

		if (!token || !password) {
			return res.status(400).json({ message: "Token and new password are required" });
		}
		if (typeof password !== "string" || password.length < 6) {
			return res.status(400).json({ message: "Password must be at least 6 characters long" });
		}

		const user = await User.findOne({ resetPasswordToken: token });

		if (!user) {
			return res.status(400).json({ message: "Invalid or expired reset token" });
		}

		if (user.resetPasswordExpires < new Date()) {
			return res.status(400).json({ message: "Reset token has expired" });
		}

		user.password = password;
		user.resetPasswordToken = undefined;
		user.resetPasswordExpires = undefined;
		await user.save();

		await redis.del(`refresh_token:${user._id}`);

		res.clearCookie("accessToken");
		res.clearCookie("refreshToken");

		res.json({ message: "Password reset successfully. Please login." });
	} catch (error) {
		console.log("Error in resetPassword controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getProfile = async (req, res) => {
	try {
		res.json(req.user);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};