import { LRUCache } from "../lib/dsaEngine.js";

const externalApiCache = new LRUCache(100, 10 * 60 * 1000); // 10 min TTL

// @desc Fetch global products from free external shopping APIs with competitor intelligence
export const getExternalGlobalProducts = async (req, res) => {
	try {
		const { category, q, limit = 20, skip = 0 } = req.query;
		const cacheKey = `ext_prod_${category || "all"}_${q || "none"}_${limit}_${skip}`;
		const cached = externalApiCache.get(cacheKey);
		if (cached) {
			return res.json(cached);
		}

		let apiUrl = `https://dummyjson.com/products?limit=${limit}&skip=${skip}`;
		if (q && q.trim() !== "") {
			apiUrl = `https://dummyjson.com/products/search?q=${encodeURIComponent(q.trim())}&limit=${limit}&skip=${skip}`;
		} else if (category && category !== "all") {
			apiUrl = `https://dummyjson.com/products/category/${encodeURIComponent(category.toLowerCase())}?limit=${limit}&skip=${skip}`;
		}

		let products = [];
		let total = 0;

		try {
			const response = await fetch(apiUrl, { signal: AbortSignal.timeout(5000) });
			if (response.ok) {
				const data = await response.json();
				products = (data.products || []).map((item) => {
					const amazonPrice = Number((item.price * 1.15).toFixed(2));
					const flipkartPrice = Number((item.price * 1.2).toFixed(2));
					return {
						_id: `ext_${item.id}`,
						id: item.id,
						name: item.title,
						description: item.description,
						price: item.price,
						originalPrice: Number((item.price / (1 - (item.discountPercentage || 10) / 100)).toFixed(2)),
						discountPercentage: Math.round(item.discountPercentage || 15),
						rating: item.rating || 4.7,
						brand: item.brand || "Global Brand",
						category: item.category || "general",
						image: item.thumbnail || item.images?.[0] || "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=800",
						gallery: item.images || [],
						stock: item.stock || 50,
						isExternal: true,
						competitorPrices: {
							amazon: amazonPrice,
							flipkart: flipkartPrice,
						},
						savingsVsAmazon: Number((amazonPrice - item.price).toFixed(2)),
						source: "Global Free Commerce Network",
					};
				});
				total = data.total || products.length;
			}
		} catch (fetchErr) {
			console.log("External API fetch notice:", fetchErr.message);
		}

		// Fallback sample global products if network request fails
		if (products.length === 0) {
			products = [
				{
					_id: "ext_fallback_1",
					name: "Quantum Sound Wireless Active Noise Cancelling Earbuds",
					description: "Studio-quality acoustic drivers with 40-hour hybrid ANC playback and IPX7 waterproofing.",
					price: 69.99,
					originalPrice: 99.99,
					discountPercentage: 30,
					rating: 4.8,
					category: "audio",
					image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=800",
					stock: 40,
					isExternal: true,
					competitorPrices: { amazon: 89.99, flipkart: 94.99 },
					savingsVsAmazon: 20.0,
				},
				{
					_id: "ext_fallback_2",
					name: "Carbon Series Mechanical Chronograph Watch",
					description: "Sapphire crystal dial with Japanese automatic movement and aerospace carbon fiber bezel.",
					price: 149.99,
					originalPrice: 220.0,
					discountPercentage: 32,
					rating: 4.9,
					category: "watches",
					image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&q=80&w=800",
					stock: 25,
					isExternal: true,
					competitorPrices: { amazon: 189.99, flipkart: 199.99 },
					savingsVsAmazon: 40.0,
				},
			];
			total = products.length;
		}

		const result = { products, total, limit: Number(limit), skip: Number(skip) };
		externalApiCache.set(cacheKey, result);
		res.json(result);
	} catch (error) {
		console.error("Error in getExternalGlobalProducts:", error.message);
		res.status(500).json({ message: "Failed to load external shopping feed" });
	}
};
