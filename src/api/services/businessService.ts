import type { Business } from "@/types/entity";
import { inventoryApiClient } from "../apiClient";

const businessService = {
	getBusinesses: () => inventoryApiClient.get<Business[]>({ url: "/businesses" }),
	getBusiness: (id: number) => inventoryApiClient.get<Business>({ url: `/businesses/${id}` }),
};

export default businessService;
