import type { Business } from "@/types/entity";
import apiClient from "../apiClient";

const businessService = {
	getBusinesses: () => apiClient.get<Business[]>({ url: "/businesses" }),
	getBusiness: (id: number) => apiClient.get<Business>({ url: `/businesses/${id}` }),
};

export default businessService;
