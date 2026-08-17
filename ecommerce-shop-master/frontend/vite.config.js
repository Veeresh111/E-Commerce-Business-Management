import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	server: {
		proxy: {
			"/api": {
				target: "http://localhost:5000",
			},
		},
	},
	build: {
		chunkSizeWarningLimit: 600,
		rollupOptions: {
			output: {
				manualChunks: {
					react: ["react", "react-dom", "react-router-dom"],
					recharts: ["recharts"],
					animations: ["framer-motion"],
					icons: ["lucide-react"],
					payments: ["@stripe/stripe-js"],
					state: ["zustand"],
				},
			},
		},
	},
});