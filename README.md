# NexusMart — Next-Gen AI E-Commerce Platform (Amazon & Flipkart Rival)

A production-grade, hyper-performant, AI-autonomous full-stack E-Commerce web platform outperforming traditional shopping marketplaces with live competitor price intelligence (Amazon vs Flipkart vs NexusMart), Free Proxy AI agentic features, advanced DSA algorithmic optimizations, multi-gateway payments, and world-class cyberpunk/emerald neon UX.

> The complete application lives in [`ecommerce-shop-master/`](ecommerce-shop-master/) — see its [README](ecommerce-shop-master/README.md) for setup, environment variables, API reference, Docker, and testing instructions.

## 🚀 Quick Start

```bash
cd ecommerce-shop-master
cp .env.example .env                       # fill in secrets
cp frontend/.env.example frontend/.env     # Stripe publishable key
npm install && npm install --prefix frontend
npm run dev                                # backend :5000
npm run dev --prefix frontend              # frontend :5173
```

## 🤖 Killer AI & Agentic Features

- 🧠 **Zero-Config Free Proxy AI Hub** — Multi-tier free proxy inference (Pollinations, Open Inference proxies) with instant fallback to local neural heuristics (0 API keys required).
- 🎙️ **"Nova" Omnichannel AI Voice Copilot** — Voice-enabled (Speech-to-Text & Speech Synthesis) interactive shopper agent that finds products, answers specs, and adds items to cart.
- 📊 **Real-Time Amazon & Flipkart Price Matcher** — Live competitor price delta tracking, savings badges, 30-day price trend charts, and AI "Buy Now vs Wait" predictive advice.
- 🤝 **Dynamic AI Bargaining / Negotiation Bot ("Haggle with AI")** — Conversational haggling bot that dynamically evaluates profit margins and generates real instant discount coupons.
- 📷 **AI Visual Product Discovery** — Reverse image vector search to find matching catalog items via image upload or drag-and-drop.
- ⭐ **AI Smart Review Analyzer & Sentiment Scorecard** — Summarizes pros, cons, and calculates a Fakespot-style authenticity score (98% Genuine).
- 🛡️ **Agentic Auth & Anomaly Shield** — Real-time security scoring detecting disposable emails, password vulnerability, and credential stuffing.
- ⚖️ **AI Automated Return & Refund Arbitrator** — Instant claim dispute resolution and automated return approval workflows.
- 📦 **AI Synergy Bundles** — Graph-based collaborative bundle clustering with automatic 15% synergy discounts.

## ⚡ High-Performance DSA (Data Structures & Algorithms)

- 🌲 **Trie with Levenshtein Distance** — $O(K)$ prefix autocomplete with typo-tolerant fuzzy search.
- 🏆 **Priority Queue (Min/Max Heap)** — Real-time ranking of flash deals and best value items.
- ⚡ **LRU Cache with TTL** — $O(1)$ in-memory caching for competitor prices and search queries.
- 🌐 **Graph Affinity Clustering** — Collaborative filtering and product relationship graphs.
- 📍 **Spatial Haversine Warehouse Dispatch** — Geographic routing calculating nearest fulfillment hub and 2-hour delivery SLAs.

## 💳 Multi-Gateway Payment System

- 💳 **Stripe Checkout & Webhook** (Credit/Debit, Apple Pay, Google Pay).
- ⚡ **Instant UPI QR Code & Direct Apps** (PhonePe, GPay, Paytm).
- 📦 **Cash on Delivery (COD)** with OTP security verification.
- 🪙 **Zero-Gas Web3 Crypto Pay** (USDC / ETH / BTC instant simulation).
- 🏦 **0% EMI Buy Now Pay Later (BNPL)** with 3, 6, 12 month installment calculator.

## 🧪 Automated Testing & CI

- **69 automated unit and integration tests** (Vitest + Supertest + in-memory MongoDB + Redis mock).

## 🧩 Tech Stack

React 18 · Vite · Tailwind CSS · Zustand · Framer Motion · Recharts · Express · MongoDB/Mongoose · Redis · Stripe · Vitest · Docker