import type { DailySalesDashboard, KdsStatusDashboard, TopProductDashboard } from "@/types/entity";
import { salesApiClient } from "../apiClient";

const dashboardService = {
	getSalesDashboard: (companyCen: string) =>
		salesApiClient.get<DailySalesDashboard>({
			url: `/sales/companies/${companyCen}/dashboard/daily-sales`,
		}),

	getTopProducts: (companyCen: string, topN = 10) =>
		salesApiClient.get<TopProductDashboard[]>({
			url: `/sales/companies/${companyCen}/dashboard/top-products`,
			params: { topN },
		}),

	getKdsStatusSummary: (companyCen: string) =>
		salesApiClient.get<KdsStatusDashboard>({
			url: `/sales/companies/${companyCen}/dashboard/kds-status`,
		}),
};

export default dashboardService;
