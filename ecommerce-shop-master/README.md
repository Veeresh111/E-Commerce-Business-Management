<h1 align="center">E-Commerce Store 🛒</h1>

A production-grade full-stack e-commerce application: user authentication with JWT refresh-token rotation, product & category management, cart with inventory control, Stripe checkout with server-side webhooks, coupon system, admin dashboard with sales analytics and order management, and AI-style product recommendations.

## 🧰 Tech Stack

- **Backend:** Node.js, Express, MongoDB (Mongoose), Redis (Upstash/ioredis), JWT
- **Payments:** Stripe Checkout + webhooks (idempotent order creation, stock decrement)
- **Storage:** Cloudinary (product images)
- **Frontend:** React 18, Vite, Tailwind CSS, Zustand, Framer Motion, Recharts
- **Email:** Nodemailer (SMTP) — verification & password reset
- **Testing:** Vitest + Supertest + mongodb-memory-server (55 tests)
- **DevOps:** Docker, docker-compose, GitHub Actions CI, health checks, graceful shutdown

## ✨ Features

- 👤 Signup / Login / Logout with email verification and password reset
- 🔑 Access (15m) + Refresh (7d) tokens, httpOnly cookies, rotation & reuse detection
- 🏷️ Product catalog with categories, featured products (Redis-cached), search & pagination
- 🛒 Cart with stock-aware quantity validation
- 💳 Stripe checkout with webhook-confirmed orders (no lost orders), coupons & gift coupons
- 📦 Order history + admin order management (status lifecycle: pending → paid → shipped → delivered / cancelled)
- 📊 Admin dashboard: sales analytics, daily sales chart, product & order management
- 🤖 Personalized recommendations (order co-occurrence collaborative filtering)
- 🔒 Security: helmet, compression, rate limiting (auth brute-force protection), input validation, no secrets in code

## 🚀 Setup

### 1. Environment variables

Copy the example files and fill in real values:

```bash
cp .env.example .env                    # backend config
cp frontend/.env.example frontend/.env  # frontend config
```

Required for full functionality:

```bash
MONGO_URI=your_mongo_uri               # MongoDB Atlas or local
UPSTASH_REDIS_URL=your_redis_url       # Upstash or local redis://localhost:6379
ACCESS_TOKEN_SECRET=random_64_hex      # node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
REFRESH_TOKEN_SECRET=random_64_hex
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
STRIPE_SECRET_KEY=sk_test_...           # Stripe dashboard
STRIPE_WEBHOOK_SECRET=whsec_...         # stripe listen --forward-to localhost:5000/api/payments/webhook
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... # frontend/.env
# Optional (email verification & password reset):
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
EMAIL_FROM=no-reply@yourstore.com
```

> **Stripe webhooks:** run `stripe listen --forward-to localhost:5000/api/payments/webhook` and copy the `whsec_...` secret. Orders are created by the webhook, so this is mandatory in production.

> **Email without SMTP:** when SMTP is not configured, emails are logged to the console and accounts are auto-verified (dev mode only).

### 2. Run locally

```shell
npm install
npm install --prefix frontend
npm run dev            # backend (nodemon) on :5000
npm run dev --prefix frontend  # vite on :5173
```

### 3. Tests

```shell
npm test               # 55 unit/integration tests (in-memory MongoDB)
```

### 4. Production build

```shell
npm run build          # installs deps + builds the frontend
NODE_ENV=production npm start   # serves API + SPA from :5000
```

### 5. Docker

```shell
docker compose up --build
```

(Requires `.env` with `STRIPE_*`, `CLOUDINARY_*` and secrets; `MONGO_URI`/`UPSTASH_REDIS_URL` are provided automatically to the compose services.)

## 🗂️ API Overview

| Route | Method | Access | Description |
|---|---|---|---|
| `/api/auth/signup` `/login` `/logout` `/refresh-token` | POST | public | Authentication |
| `/api/auth/verify-email` | GET | public | Email verification |
| `/api/auth/forgot-password` `/reset-password` | POST | public | Password reset |
| `/api/auth/profile` | GET | user | Current profile |
| `/api/products` | GET/POST | admin | List (paginated) / create |
| `/api/products/search` | GET | public | Full-text search |
| `/api/products/featured` | GET | public | Featured (Redis-cached) |
| `/api/products/category/:category` | GET | public | Category listing |
| `/api/products/recommendations` | GET | public | Co-occurrence recommendations |
| `/api/products/:id` | PATCH/DELETE | admin | Toggle featured / delete |
| `/api/cart` | GET/POST/DELETE | user | Cart operations |
| `/api/cart/:id` | PUT | user | Update quantity |
| `/api/coupons` | GET | user | My coupon |
| `/api/coupons/validate` | POST | user | Validate coupon |
| `/api/payments/create-checkout-session` | POST | user | Start Stripe checkout |
| `/api/payments/checkout-success` | POST | user | Confirm (idempotent) |
| `/api/payments/webhook` | POST | Stripe | **Webhook — order creation** |
| `/api/orders` | GET | user | My orders |
| `/api/orders/all` | GET | admin | All orders |
| `/api/orders/:id/status` | PATCH | admin | Update order status |
| `/api/analytics` | GET | admin | Sales analytics |
| `/healthz` | GET | public | Health check |

## 🧑‍💻 Creating an admin

There is no public "become admin" route (by design). Set a user's role directly in MongoDB:

```js
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```

## 📁 Project Structure

```
backend/
  app.js                 # Express app (middleware, routes, error handling)
  server.js              # Entry point (listen + graceful shutdown)
  controllers/           # auth, cart, coupon, order, payment, product, analytics
  middleware/            # protectRoute, adminRoute
  models/                # User, Product, Order, Coupon
  routes/
  lib/                   # db, redis, stripe, cloudinary, mailer, logger
  tests/                 # 55 Vitest + Supertest tests
frontend/
  src/pages/             # Home, Category, Search, Cart, Orders, Admin, Auth pages
  src/components/        # Navbar, ProductCard, OrderSummary, AnalyticsTab, OrdersList...
  src/stores/            # Zustand: useUserStore, useProductStore, useCartStore
```

## 🔐 Security Notes

- Passwords hashed with bcrypt; JWT secrets must be strong & unique
- Refresh tokens are rotated on every use; reuse revokes the session
- Stripe webhook signature verified with `STRIPE_WEBHOOK_SECRET`
- Rate limited auth endpoints, helmet headers, httpOnly + sameSite=strict cookies
- Order money is verified server-side from the Stripe session, never from the client