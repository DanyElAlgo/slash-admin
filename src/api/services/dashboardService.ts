import type { KdsStatusSummary, SalesDashboard, StockAlertsDashboard, TopProduct } from "@/types/entity";
import { salesApiClient } from "../apiClient";

const dashboardService = {
	getSalesDashboard: () => salesApiClient.get<SalesDashboard>({ url: "/dashboard/sales" }),

	getTopProducts: (limit = 10) => salesApiClient.get<TopProduct[]>({ url: `/dashboard/top-products?limit=${limit}` }),

	getStockAlerts: () => salesApiClient.get<StockAlertsDashboard>({ url: "/dashboard/stock-alerts" }),

	getKdsStatusSummary: () => salesApiClient.get<KdsStatusSummary>({ url: "/dashboard/kds-status" }),
};

export default dashboardService;
