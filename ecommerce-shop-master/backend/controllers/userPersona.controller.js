import User from "../models/user.model.js";
import Product from "../models/product.model.js";
import { callFreeProxyAi } from "../lib/aiProxy.js";

// @desc Get user's persona profile & activity summary
export const getPersonaProfile = async (req, res) => {
	try {
		const user = await User.findById(req.user._id).select(
			"profession hobbies interests location activityTelemetry name email"
		);
		if (!user) return res.status(404).json({ message: "User not found" });
		res.json(user);
	} catch (error) {
		res.status(500).json({ message: "Failed to load persona profile" });
	}
};

// @desc Update user's persona profile (profession, hobbies, interests, location)
export const updatePersonaProfile = async (req, res) => {
	try {
		const { profession, hobbies, interests, location } = req.body;
		const user = await User.findById(req.user._id);
		if (!user) return res.status(404).json({ message: "User not found" });

		if (profession !== undefined) user.profession = profession;
		if (hobbies !== undefined && Array.isArray(hobbies)) user.hobbies = hobbies;
		if (interests !== undefined && Array.isArray(interests)) user.interests = interests;
		if (location !== undefined) {
			user.location = {
				city: location.city || user.location?.city || "New York",
				state: location.state || user.location?.state || "",
				country: location.country || user.location?.country || "USA",
				region: location.region || user.location?.region || "US",
			};
		}

		await user.save();
		res.json({
			message: "Persona profile updated successfully",
			persona: {
				profession: user.profession,
				hobbies: user.hobbies,
				interests: user.interests,
				location: user.location,
			},
		});
	} catch (error) {
		res.status(500).json({ message: "Failed to update persona profile" });
	}
};

// @desc Record user browsing activity telemetry event
export const recordTelemetry = async (req, res) => {
	try {
		const { eventType, targetCategory, targetId, query } = req.body;
		if (!eventType) return res.status(400).json({ message: "eventType is required" });

		if (req.user) {
			const user = await User.findById(req.user._id);
			if (user) {
				user.activityTelemetry = user.activityTelemetry || [];
				user.activityTelemetry.push({
					eventType,
					targetCategory,
					targetId,
					query,
					timestamp: new Date(),
				});

				// Keep last 100 events to prevent unbounded growth
				if (user.activityTelemetry.length > 100) {
					user.activityTelemetry = user.activityTelemetry.slice(-100);
				}
				await user.save();
			}
		}

		res.status(200).json({ status: "telemetry_recorded" });
	} catch (error) {
		res.status(500).json({ message: "Telemetry recording failed" });
	}
};

// @desc Generate Agentic AI Personalized Recommendations based on Profession, Hobbies & Telemetry
export const getAgenticRecommendations = async (req, res) => {
	try {
		const user = await User.findById(req.user._id);
		const allProducts = await Product.find({}).limit(30);

		const profession = user?.profession || "Creative Professional";
		const hobbies = user?.hobbies || ["Tech", "Lifestyle"];
		const interests = user?.interests || ["Innovation", "Apparel"];
		const recentEvents = (user?.activityTelemetry || []).slice(-10);

		const prompt = `You are NexusMart's Agentic Commerce Intelligence Engine.
User Profile:
- Profession: ${profession}
- Hobbies: ${hobbies.join(", ")}
- Interests: ${interests.join(", ")}
- Recent Activities: ${recentEvents.map((e) => e.eventType + " (" + (e.targetCategory || e.query || "") + ")").join(", ")}

Catalog Products:
${allProducts.map((p) => `- ID: ${p._id}, Name: ${p.name}, Category: ${p.category}, Price: $${p.price}`).join("\n")}

Synthesize a tailored shopping briefing.
Respond in strict JSON format:
{
  "personaBrief": "Personalized greeting and explanation of why these items fit the user's profession and hobbies",
  "matchedCategory": "Most relevant product category",
  "recommendedProductIds": ["id1", "id2", "id3"],
  "aiRationale": "Detailed justification connecting user hobbies to recommended items",
  "exclusivePersonaPerk": "Special perk or tip for this user archetype"
}`;

		let aiResult = null;
		try {
			if (process.env.NODE_ENV !== "test") {
				const responseText = await callFreeProxyAi(prompt);
				const firstBrace = responseText.indexOf("{");
				const lastBrace = responseText.lastIndexOf("}");
				if (firstBrace !== -1 && lastBrace !== -1) {
					const jsonStr = responseText.substring(firstBrace, lastBrace + 1);
					aiResult = JSON.parse(jsonStr);
				}
			}
		} catch (err) {
			console.log("AI Persona fallback triggered:", err.message);
		}

		if (!aiResult || !aiResult.recommendedProductIds) {
			aiResult = {
				personaBrief: `Curated for your lifestyle as a ${profession}. Tailored with gear suited for ${hobbies.slice(0, 2).join(" & ")}.`,
				matchedCategory: allProducts[0]?.category || "apparel",
				recommendedProductIds: allProducts.slice(0, 3).map((p) => p._id.toString()),
				aiRationale: `Matches your active interest in ${interests[0] || "Quality Craftsmanship"} with high durability ratings.`,
				exclusivePersonaPerk: `15% Persona Synergy bonus applied automatically to your top matches.`,
			};
		}

		// Hydrate recommended products
		const recommendedProducts = allProducts.filter((p) =>
			aiResult.recommendedProductIds.includes(p._id.toString())
		);

		res.json({
			personaBrief: aiResult.personaBrief,
			aiRationale: aiResult.aiRationale,
			exclusivePersonaPerk: aiResult.exclusivePersonaPerk,
			userPersona: { profession, hobbies, interests, location: user?.location },
			recommendations: recommendedProducts.length > 0 ? recommendedProducts : allProducts.slice(0, 3),
		});
	} catch (error) {
		console.error("Error in getAgenticRecommendations:", error.message);
		res.status(500).json({ message: "Failed to generate personalized recommendations" });
	}
};
