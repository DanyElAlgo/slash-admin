import tailwindcss from "@tailwindcss/vite";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	const base = env.VITE_APP_PUBLIC_PATH || "/";
	const isProduction = mode === "production";

	const devPort = Number(env.VITE_DEV_PORT) || 3001;
	const apiProxyTarget = env.VITE_API_PROXY_TARGET || "http://localhost:5000";
	const inventoryProxyTarget = env.VITE_INVENTORY_PROXY_TARGET || "http://localhost:5001";
	const salesProxyTarget = env.VITE_SALES_PROXY_TARGET || "http://localhost:5002";
	const purchasesProxyTarget = env.VITE_PURCHASES_PROXY_TARGET || "http://localhost:5003";

	return {
		base,
		plugins: [
			react(),
			vanillaExtractPlugin({
				identifiers: ({ debugId }) => `${debugId}`,
			}),
			tailwindcss(),
			tsconfigPaths(),

			isProduction &&
				visualizer({
					open: true,
					gzipSize: true,
					brotliSize: true,
					template: "treemap",
				}),
		].filter(Boolean),

		server: {
			open: true,
			host: true,
			port: devPort,
			proxy: {
				"/api": {
					target: apiProxyTarget,
					changeOrigin: true,
					secure: false,
				},
				"/inventory-api": {
					target: inventoryProxyTarget,
					changeOrigin: true,
					secure: false,
					rewrite: (path) => path.replace(/^\/inventory-api/, "/api"),
				},
				"/sales-api": {
					target: salesProxyTarget,
					changeOrigin: true,
					secure: false,
					rewrite: (path) => path.replace(/^\/sales-api/, "/api"),
				},
				"/purchases-api": {
					target: purchasesProxyTarget,
					changeOrigin: true,
					secure: false,
					rewrite: (path) => path.replace(/^\/purchases-api/, "/api"),
				},
			},
		},

		build: {
			target: "esnext",
			minify: "esbuild",
			sourcemap: !isProduction,
			cssCodeSplit: true,
			chunkSizeWarningLimit: 1500,
			rollupOptions: {
				output: {
					manualChunks: {
						"vendor-core": ["react", "react-dom", "react-router"],
						"vendor-ui": ["antd", "@ant-design/cssinjs", "styled-components"],
						"vendor-utils": ["axios", "dayjs", "i18next", "zustand", "@iconify/react"],
						"vendor-charts": ["apexcharts", "react-apexcharts"],
					},
				},
			},
		},

		optimizeDeps: {
			include: ["react", "react-dom", "react-router", "antd", "axios", "dayjs"],
			exclude: ["@iconify/react"],
		},

		esbuild: {
			drop: isProduction ? ["console", "debugger"] : [],
			legalComments: "none",
			target: "esnext",
		},
	};
});
