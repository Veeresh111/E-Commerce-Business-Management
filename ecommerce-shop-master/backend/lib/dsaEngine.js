/**
 * Enterprise Data Structures & Algorithms (DSA) Engine for High-Performance E-Commerce
 *
 * Implemented DSA Modules:
 * 1. Trie with Levenshtein Distance (Typo-Tolerant Fuzzy Search & Autocomplete) - O(K) lookup
 * 2. MinHeap & MaxHeap (Priority Queue for Flash Deals & Best Value Ranking) - O(log N) operations
 * 3. LRUCache with TTL (Least Recently Used In-Memory Cache) - O(1) get/put
 * 4. Graph Bundle Clusterer (Collaborative Filtering & Product Affinity Graph)
 * 5. Spatial Haversine & Nearest Hub Router (Warehouse Routing & Delivery Time Estimator)
 */

// ==========================================
// 1. TRIE WITH LEVENSHTEIN FUZZY SEARCH
// ==========================================
class TrieNode {
	constructor() {
		this.children = new Map();
		this.isEndOfWord = false;
		this.metadata = []; // Stores product references associated with this prefix/word
	}
}

export class ProductTrie {
	constructor() {
		this.root = new TrieNode();
		this.wordCount = 0;
	}

	/**
	 * Insert a product name and its category keywords into the Trie.
	 */
	insert(phrase, productRef) {
		if (!phrase || typeof phrase !== "string") return;
		const words = phrase.toLowerCase().trim().split(/\s+/);

		// Index the entire phrase as well as individual tokens
		const tokensToIndex = [phrase.toLowerCase().trim(), ...words];

		for (const token of tokensToIndex) {
			let node = this.root;
			for (const char of token) {
				if (!node.children.has(char)) {
					node.children.set(char, new TrieNode());
				}
				node = node.children.get(char);
				// Keep a capped list of matching product refs at each prefix node for O(prefix_length) autocomplete
				if (!node.metadata.some((m) => m._id?.toString() === productRef._id?.toString())) {
					if (node.metadata.length < 10) {
						node.metadata.push(productRef);
					}
				}
			}
			node.isEndOfWord = true;
		}
		this.wordCount++;
	}

	/**
	 * Instant prefix autocomplete matching in O(K) time where K is prefix length.
	 */
	autocomplete(prefix, limit = 8) {
		if (!prefix || typeof prefix !== "string") return [];
		const normalized = prefix.toLowerCase().trim();
		let node = this.root;

		for (const char of normalized) {
			if (!node.children.has(char)) {
				// Fallback to fuzzy search if exact prefix not found
				return this.fuzzySearch(normalized, limit);
			}
			node = node.children.get(char);
		}

		return node.metadata.slice(0, limit);
	}

	/**
	 * Levenshtein distance fuzzy search for typo tolerance (e.g., "iphne" -> "iPhone").
	 */
	fuzzySearch(query, limit = 8, maxDistance = 2) {
		const results = new Map();
		const normalized = query.toLowerCase().trim();

		const dfs = (node, currentWord) => {
			if (node.isEndOfWord && node.metadata.length > 0) {
				const dist = this.levenshtein(normalized, currentWord);
				if (dist <= maxDistance) {
					for (const prod of node.metadata) {
						const key = prod._id?.toString() || prod.name;
						if (!results.has(key)) {
							results.set(key, { product: prod, distance: dist });
						}
					}
				}
			}

			for (const [char, childNode] of node.children.entries()) {
				dfs(childNode, currentWord + char);
			}
		};

		dfs(this.root, "");

		return Array.from(results.values())
			.sort((a, b) => a.distance - b.distance)
			.slice(0, limit)
			.map((item) => item.product);
	}

	levenshtein(a, b) {
		const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
		for (let i = 0; i <= a.length; i++) dp[i][0] = i;
		for (let j = 0; j <= b.length; j++) dp[0][j] = j;

		for (let i = 1; i <= a.length; i++) {
			for (let j = 1; j <= b.length; j++) {
				if (a[i - 1] === b[j - 1]) {
					dp[i][j] = dp[i - 1][j - 1];
				} else {
					dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
				}
			}
		}
		return dp[a.length][b.length];
	}

	clear() {
		this.root = new TrieNode();
		this.wordCount = 0;
	}
}

// ==========================================
// 2. PRIORITY QUEUE (MIN/MAX HEAP)
// ==========================================
export class PriorityQueue {
	constructor(comparator = (a, b) => a - b) {
		this.heap = [];
		this.comparator = comparator;
	}

	size() {
		return this.heap.length;
	}

	isEmpty() {
		return this.heap.length === 0;
	}

	peek() {
		return this.heap[0] || null;
	}

	push(value) {
		this.heap.push(value);
		this._siftUp(this.heap.length - 1);
	}

	pop() {
		if (this.isEmpty()) return null;
		const top = this.heap[0];
		const bottom = this.heap.pop();
		if (this.heap.length > 0) {
			this.heap[0] = bottom;
			this._siftDown(0);
		}
		return top;
	}

	_siftUp(index) {
		let parent = Math.floor((index - 1) / 2);
		while (index > 0 && this.comparator(this.heap[index], this.heap[parent]) < 0) {
			[this.heap[index], this.heap[parent]] = [this.heap[parent], this.heap[index]];
			index = parent;
			parent = Math.floor((index - 1) / 2);
		}
	}

	_siftDown(index) {
		let minIndex = index;
		const left = 2 * index + 1;
		const right = 2 * index + 2;

		if (left < this.heap.length && this.comparator(this.heap[left], this.heap[minIndex]) < 0) {
			minIndex = left;
		}
		if (right < this.heap.length && this.comparator(this.heap[right], this.heap[minIndex]) < 0) {
			minIndex = right;
		}
		if (index !== minIndex) {
			[this.heap[index], this.heap[minIndex]] = [this.heap[minIndex], this.heap[index]];
			this._siftDown(minIndex);
		}
	}

	toArray() {
		return [...this.heap];
	}
}

// ==========================================
// 3. LRU CACHE WITH TTL
// ==========================================
class DoublyLinkedListNode {
	constructor(key, value, expiresAt) {
		this.key = key;
		this.value = value;
		this.expiresAt = expiresAt;
		this.prev = null;
		this.next = null;
	}
}

export class LRUCache {
	constructor(capacity = 100, defaultTTL = 60 * 1000) {
		this.capacity = capacity;
		this.defaultTTL = defaultTTL;
		this.cache = new Map();
		this.head = new DoublyLinkedListNode(null, null, 0);
		this.tail = new DoublyLinkedListNode(null, null, 0);
		this.head.next = this.tail;
		this.tail.prev = this.head;
	}

	get(key) {
		const node = this.cache.get(key);
		if (!node) return null;

		if (Date.now() > node.expiresAt) {
			this._remove(node);
			this.cache.delete(key);
			return null;
		}

		this._moveToHead(node);
		return node.value;
	}

	set(key, value, ttl = this.defaultTTL) {
		const expiresAt = Date.now() + ttl;
		if (this.cache.has(key)) {
			const node = this.cache.get(key);
			node.value = value;
			node.expiresAt = expiresAt;
			this._moveToHead(node);
		} else {
			if (this.cache.size >= this.capacity) {
				const lru = this.tail.prev;
				this._remove(lru);
				this.cache.delete(lru.key);
			}
			const newNode = new DoublyLinkedListNode(key, value, expiresAt);
			this.cache.set(key, newNode);
			this._addHead(newNode);
		}
	}

	has(key) {
		return this.get(key) !== null;
	}

	delete(key) {
		const node = this.cache.get(key);
		if (node) {
			this._remove(node);
			this.cache.delete(key);
			return true;
		}
		return false;
	}

	clear() {
		this.cache.clear();
		this.head.next = this.tail;
		this.tail.prev = this.head;
	}

	_addHead(node) {
		node.next = this.head.next;
		node.prev = this.head;
		this.head.next.prev = node;
		this.head.next = node;
	}

	_remove(node) {
		node.prev.next = node.next;
		node.next.prev = node.prev;
	}

	_moveToHead(node) {
		this._remove(node);
		this._addHead(node);
	}
}

// ==========================================
// 4. GRAPH COLLABORATIVE BUNDLE CLUSTERING
// ==========================================
export class ProductAffinityGraph {
	constructor() {
		this.adjacencyList = new Map();
	}

	addEdge(productIdA, productIdB, weight = 1) {
		const strA = productIdA.toString();
		const strB = productIdB.toString();
		if (strA === strB) return;

		if (!this.adjacencyList.has(strA)) this.adjacencyList.set(strA, new Map());
		if (!this.adjacencyList.has(strB)) this.adjacencyList.set(strB, new Map());

		const edgesA = this.adjacencyList.get(strA);
		edgesA.set(strB, (edgesA.get(strB) || 0) + weight);

		const edgesB = this.adjacencyList.get(strB);
		edgesB.set(strA, (edgesB.get(strA) || 0) + weight);
	}

	getTopAffinityProducts(productId, limit = 3) {
		const strId = productId.toString();
		if (!this.adjacencyList.has(strId)) return [];

		const neighbors = this.adjacencyList.get(strId);
		return Array.from(neighbors.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, limit)
			.map(([id, weight]) => ({ productId: id, weight }));
	}
}

// ==========================================
// 5. SPATIAL HAVERSINE WAREHOUSE ROUTING
// ==========================================
export const FULFILLMENT_HUBS = [
	{ id: "HUB-NYC-01", name: "Nexus Hub North America East (NYC)", lat: 40.7128, lon: -74.006, speedHours: 2 },
	{ id: "HUB-SFO-02", name: "Nexus Hub Pacific West (SF Bay)", lat: 37.7749, lon: -122.4194, speedHours: 2 },
	{ id: "HUB-LON-03", name: "Nexus Hub Europe West (London)", lat: 51.5074, lon: -0.1278, speedHours: 3 },
	{ id: "HUB-BLR-04", name: "Nexus Hub South Asia Prime (Bengaluru)", lat: 12.9716, lon: 77.5946, speedHours: 1 },
	{ id: "HUB-DEL-05", name: "Nexus Hub North Asia Metro (New Delhi)", lat: 28.6139, lon: 77.209, speedHours: 1 },
	{ id: "HUB-MUM-06", name: "Nexus Hub Western Coast (Mumbai)", lat: 19.076, lon: 72.8777, speedHours: 1 },
	{ id: "HUB-SGP-07", name: "Nexus Hub Southeast Asia (Singapore)", lat: 1.3521, lon: 103.8198, speedHours: 2 },
];

export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
	const R = 6371; // Earth radius in KM
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLon = ((lon2 - lon1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return Math.round(R * c);
}

export function findNearestFulfillmentHub(userLat = 12.9716, userLon = 77.5946) {
	let nearestHub = FULFILLMENT_HUBS[0];
	let minDistance = Infinity;

	for (const hub of FULFILLMENT_HUBS) {
		const dist = calculateHaversineDistance(userLat, userLon, hub.lat, hub.lon);
		if (dist < minDistance) {
			minDistance = dist;
			nearestHub = hub;
		}
	}

	const estimatedDeliveryHours = minDistance < 50 ? 2 : minDistance < 500 ? 6 : minDistance < 2000 ? 24 : 48;

	return {
		hub: nearestHub,
		distanceKm: minDistance,
		estimatedDeliveryHours,
		sameDayEligible: minDistance < 100,
		dispatchSpeedText:
			minDistance < 50
				? "⚡ Hyper-Fast 2-Hour Delivery"
				: minDistance < 500
				? "🚀 Same-Day Evening Express"
				: "📦 Next-Day Guaranteed Prime",
	};
}

// Global Singleton DSA Instances
export const globalProductTrie = new ProductTrie();
export const globalAffinityGraph = new ProductAffinityGraph();
export const globalAiCache = new LRUCache(200, 5 * 60 * 1000); // 5 min TTL
export const globalCompetitorPriceCache = new LRUCache(300, 10 * 60 * 1000); // 10 min TTL
