/**
 * Frontend Client-Side AI & Voice Orchestration Client
 *
 * Integrates:
 * - Web Speech API (Speech Recognition & Speech Synthesis Voice Agent)
 * - Free Proxy AI chat & recommendation endpoints
 * - Client-side intent classifiers
 */

import axios from "./axios";

// Speech Synthesis (Text-to-Speech)
export function speakText(text) {
	if (!("speechSynthesis" in window)) return;

	window.speechSynthesis.cancel(); // Stop previous utterances
	// Clean markdown symbols for natural speech
	const cleanText = text.replace(/[*_#`~[\]()]/g, "");
	const utterance = new SpeechSynthesisUtterance(cleanText);
	utterance.rate = 1.05;
	utterance.pitch = 1.0;

	// Pick high-quality English voice if available
	const voices = window.speechSynthesis.getVoices();
	const preferredVoice = voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha")));
	if (preferredVoice) {
		utterance.voice = preferredVoice;
	}

	window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
	if ("speechSynthesis" in window) {
		window.speechSynthesis.cancel();
	}
}

// Speech Recognition (Speech-to-Text)
export function createSpeechRecognizer(onResult, onError, onEnd) {
	const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
	if (!SpeechRecognition) return null;

	const recognition = new SpeechRecognition();
	recognition.continuous = false;
	recognition.interimResults = false;
	recognition.lang = "en-US";

	recognition.onresult = (event) => {
		const transcript = event.results[0][0].transcript;
		if (onResult) onResult(transcript);
	};

	recognition.onerror = (event) => {
		if (onError) onError(event.error);
	};

	recognition.onend = () => {
		if (onEnd) onEnd();
	};

	return recognition;
}

// AI API Call Helpers
export const aiApi = {
	chat: async (message, context = {}) => {
		const res = await axios.post("/ai/chat", { message, context });
		return res.data;
	},

	comparePrices: async (productId) => {
		const res = await axios.get(`/ai/compare-prices/${productId}`);
		return res.data;
	},

	negotiateDeal: async (productId, userOffer, messageHistory = []) => {
		const res = await axios.post("/ai/negotiate", { productId, userOffer, messageHistory });
		return res.data;
	},

	visualSearch: async (visualTags, query) => {
		const res = await axios.post("/ai/visual-search", { visualTags, query });
		return res.data;
	},

	analyzeReviews: async (productId) => {
		const res = await axios.get(`/ai/analyze-reviews/${productId}`);
		return res.data;
	},

	arbitrateReturn: async (orderId, reason, description) => {
		const res = await axios.post("/ai/arbitrate-return", { orderId, reason, description });
		return res.data;
	},

	getSmartBundles: async (productId) => {
		const res = await axios.get(`/ai/bundles/${productId}`);
		return res.data;
	},

	getFlashDeals: async () => {
		const res = await axios.get("/ai/flash-deals");
		return res.data;
	},

	getDeliveryEstimate: async (lat, lon) => {
		const res = await axios.get(`/ai/delivery-estimate?lat=${lat || 12.9716}&lon=${lon || 77.5946}`);
		return res.data;
	},
};
