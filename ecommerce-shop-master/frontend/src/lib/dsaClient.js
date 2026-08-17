/**
 * Client-Side DSA Engine & Currency Conversion Utility
 */

export const CURRENCIES = {
	USD: { symbol: "$", code: "USD", rate: 1.0, name: "US Dollar" },
	INR: { symbol: "₹", code: "INR", rate: 83.5, name: "Indian Rupee" },
	EUR: { symbol: "€", code: "EUR", rate: 0.92, name: "Euro" },
	GBP: { symbol: "£", code: "GBP", rate: 0.78, name: "British Pound" },
};

let currentCurrency = "USD";

export function setGlobalCurrency(code) {
	if (CURRENCIES[code]) {
		currentCurrency = code;
		if (typeof window !== "undefined") {
			localStorage.setItem("nexus_currency", code);
		}
	}
}

export function getGlobalCurrency() {
	if (typeof window !== "undefined") {
		const saved = localStorage.getItem("nexus_currency");
		if (saved && CURRENCIES[saved]) {
			currentCurrency = saved;
		}
	}
	return CURRENCIES[currentCurrency] || CURRENCIES.USD;
}

export function formatPrice(usdAmount, currencyCode = null) {
	const cur = currencyCode ? CURRENCIES[currencyCode] || CURRENCIES.USD : getGlobalCurrency();
	const converted = Number(usdAmount) * cur.rate;
	if (cur.code === "INR") {
		return `${cur.symbol}${Math.round(converted).toLocaleString("en-IN")}`;
	}
	return `${cur.symbol}${converted.toFixed(2)}`;
}

// Client-side Trie for instantaneous prefix autocomplete
class ClientTrieNode {
	constructor() {
		this.children = new Map();
		this.items = [];
	}
}

export class ClientProductTrie {
	constructor() {
		this.root = new ClientTrieNode();
	}

	insert(phrase, item) {
		if (!phrase) return;
		const words = phrase.toLowerCase().trim().split(/\s+/);
		const tokens = [phrase.toLowerCase().trim(), ...words];

		for (const token of tokens) {
			let node = this.root;
			for (const char of token) {
				if (!node.children.has(char)) {
					node.children.set(char, new ClientTrieNode());
				}
				node = node.children.get(char);
				if (!node.items.some((i) => i._id === item._id) && node.items.length < 8) {
					node.items.push(item);
				}
			}
		}
	}

	search(prefix, limit = 6) {
		if (!prefix) return [];
		const normalized = prefix.toLowerCase().trim();
		let node = this.root;

		for (const char of normalized) {
			if (!node.children.has(char)) return [];
			node = node.children.get(char);
		}

		return node.items.slice(0, limit);
	}
}

export const clientTrie = new ClientProductTrie();
