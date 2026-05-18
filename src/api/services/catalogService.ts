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
	getProducts: (companyCen: string, params?: CatalogProductQueryDto) =>
		salesApiClient.get<SellableProductContractDto[]>({
			url: `/sales/companies/${companyCen}/catalog/products`,
			params,
		}),
};

export default catalogService;
