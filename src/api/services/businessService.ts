import type { Business } from "@/types/entity";
import { inventoryApiClient } from "../apiClient";

const businessService = {
	getBusinesses: () => inventoryApiClient.get<Business[]>({ url: "/inventory/companies" }),
};

export default businessService;
