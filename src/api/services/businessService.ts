import type { Business } from "@/types/entity";
import { inventoryApiClient } from "../apiClient";

const businessService = {
	getBusinesses: () => inventoryApiClient.get<Business[]>({ url: "/inventory/companies" }),
	getBusiness: (companyCen: string) => inventoryApiClient.get<Business>({ url: `/inventory/companies/${companyCen}` }),
};

export default businessService;
