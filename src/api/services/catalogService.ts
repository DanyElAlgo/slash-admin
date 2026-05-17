import type { SellableProductContractDto } from "@/types/entity";
import { salesApiClient } from "../apiClient";

export interface CatalogProductQueryDto {
	search?: string;
	categoryCen?: string;
	warehouseCen?: string;
	onlyAvailable?: boolean;
	page?: number;
	pageSize?: number;
}

const catalogService = {
	getProducts: (companyCen: string, params?: CatalogProductQueryDto) => {
		const query = new URLSearchParams();
		if (params?.search) query.set("search", params.search);
		if (params?.categoryCen) query.set("categoryCen", params.categoryCen);
		if (params?.warehouseCen) query.set("warehouseCen", params.warehouseCen);
		if (params?.onlyAvailable !== undefined) query.set("onlyAvailable", String(params.onlyAvailable));
		if (params?.page !== undefined) query.set("page", String(params.page));
		if (params?.pageSize !== undefined) query.set("pageSize", String(params.pageSize));
		const qs = query.toString();
		return salesApiClient.get<SellableProductContractDto[]>({
			url: `/sales/companies/${companyCen}/catalog/products${qs ? `?${qs}` : ""}`,
		});
	},
};

export default catalogService;
