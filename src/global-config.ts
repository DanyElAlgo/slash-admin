import packageJson from "../package.json";

/**
 * Global application configuration type definition
 */
export type GlobalConfig = {
	/** Application name */
	appName: string;
	/** Application version number */
	appVersion: string;
	/** Default route path for the application */
	defaultRoute: string;
	/** Public path for static assets */
	publicPath: string;
	/** Base URL for the legacy/general API endpoint (mostly used by mock service worker handlers) */
	apiBaseUrl: string;
	/** Base URL for the Inventory API (proxied through `/inventory-api` during dev) */
	inventoryApiUrl: string;
	/** Base URL for the Sales API (proxied through `/sales-api` during dev) */
	salesApiUrl: string;
	/** Routing mode: frontend routing or backend routing */
	routerMode: "frontend" | "backend";
};

/**
 * Global configuration constants
 * Reads configuration from environment variables and package.json
 *
 * @warning
 * Please don't use the import.meta.env to get the configuration, use the GLOBAL_CONFIG instead
 */
export const GLOBAL_CONFIG: GlobalConfig = {
	appName: "Slash Admin",
	appVersion: packageJson.version,
	defaultRoute: import.meta.env.VITE_APP_DEFAULT_ROUTE || "/workbench",
	publicPath: import.meta.env.VITE_APP_PUBLIC_PATH || "/",
	apiBaseUrl: import.meta.env.VITE_APP_API_BASE_URL || "/api",
	inventoryApiUrl: import.meta.env.VITE_APP_INVENTORY_API_URL || "/inventory-api",
	salesApiUrl: import.meta.env.VITE_APP_SALES_API_URL || "/sales-api",
	routerMode: import.meta.env.VITE_APP_ROUTER_MODE || "frontend",
};
