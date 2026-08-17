import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		setupFiles: ["./backend/tests/setup.js"],
		include: ["backend/tests/**/*.test.js"],
		testTimeout: 30000,
		hookTimeout: 30000,
	},
});