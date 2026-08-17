import { describe, it, expect, beforeEach } from "vitest";
import {
	ProductTrie,
	PriorityQueue,
	LRUCache,
	ProductAffinityGraph,
	calculateHaversineDistance,
	findNearestFulfillmentHub,
} from "../lib/dsaEngine.js";

describe("DSA Engine Test Suite", () => {
	describe("ProductTrie (Prefix & Fuzzy Search)", () => {
		let trie;

		beforeEach(() => {
			trie = new ProductTrie();
			trie.insert("Leather Jacket", { _id: "1", name: "Leather Jacket" });
			trie.insert("Denim Jeans", { _id: "2", name: "Denim Jeans" });
			trie.insert("Running Shoes", { _id: "3", name: "Running Shoes" });
		});

		it("finds exact prefix autocompletions", () => {
			const results = trie.autocomplete("lea");
			expect(results.length).toBeGreaterThan(0);
			expect(results[0].name).toBe("Leather Jacket");
		});

		it("handles typo-tolerant fuzzy search via Levenshtein distance", () => {
			// "leathr" -> "Leather Jacket"
			const fuzzy = trie.fuzzySearch("leathr", 5, 2);
			expect(fuzzy.length).toBeGreaterThan(0);
			expect(fuzzy[0].name).toBe("Leather Jacket");
		});
	});

	describe("PriorityQueue (Min/Max Heap)", () => {
		it("maintains max heap order for deal ranking", () => {
			const pq = new PriorityQueue((a, b) => b.score - a.score);
			pq.push({ id: "item1", score: 40 });
			pq.push({ id: "item2", score: 95 });
			pq.push({ id: "item3", score: 70 });

			expect(pq.peek().score).toBe(95);
			expect(pq.pop().id).toBe("item2");
			expect(pq.pop().id).toBe("item3");
			expect(pq.pop().id).toBe("item1");
		});
	});

	describe("LRUCache with TTL", () => {
		it("evicts least recently used items when capacity is exceeded", () => {
			const cache = new LRUCache(2, 10000);
			cache.set("a", 1);
			cache.set("b", 2);
			cache.get("a"); // "a" is accessed, "b" is LRU
			cache.set("c", 3); // "b" should be evicted

			expect(cache.get("a")).toBe(1);
			expect(cache.get("b")).toBeNull();
			expect(cache.get("c")).toBe(3);
		});
	});

	describe("ProductAffinityGraph", () => {
		it("clusters co-occurring items correctly", () => {
			const graph = new ProductAffinityGraph();
			graph.addEdge("itemA", "itemB", 3);
			graph.addEdge("itemA", "itemC", 1);

			const topAffinity = graph.getTopAffinityProducts("itemA", 2);
			expect(topAffinity.length).toBe(2);
			expect(topAffinity[0].productId).toBe("itemB");
			expect(topAffinity[0].weight).toBe(3);
		});
	});

	describe("Spatial Haversine Warehouse Routing", () => {
		it("calculates distance between coordinates accurately", () => {
			// NYC to London distance ~ 5570 km
			const dist = calculateHaversineDistance(40.7128, -74.006, 51.5074, -0.1278);
			expect(dist).toBeGreaterThan(5000);
			expect(dist).toBeLessThan(6000);
		});

		it("finds the nearest fulfillment center and calculates delivery SLA", () => {
			const routing = findNearestFulfillmentHub(12.9716, 77.5946); // Bengaluru
			expect(routing.hub.id).toBe("HUB-BLR-04");
			expect(routing.estimatedDeliveryHours).toBeLessThanOrEqual(2);
		});
	});
});
