// Runs before every test file — set a clean, non-SMTP environment.
process.env.NODE_ENV = "test";
process.env.ACCESS_TOKEN_SECRET = "test-access-secret-0123456789abcdef";
process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret-0123456789abcdef";
process.env.CLIENT_URL = "http://localhost:5173";
process.env.STRIPE_SECRET_KEY = "sk_test_dummy_key";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_dummy";
process.env.SMTP_HOST = "";
process.env.SMTP_USER = "";
process.env.SMTP_PASS = "";