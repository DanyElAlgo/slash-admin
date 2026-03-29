import type { Station, StationTypeWithDetails } from "@/types/entity";
import { salesApiClient } from "../apiClient";

const stationService = {
	getStationTypes: () => salesApiClient.get<StationTypeWithDetails[]>({ url: "/stationtypes" }),

	getStationType: (id: number) => salesApiClient.get<StationTypeWithDetails>({ url: `/stationtypes/${id}` }),

	createStationType: (data: { name: string; description?: string }) =>
		salesApiClient.post<StationTypeWithDetails>({ url: "/stationtypes", data }),

	updateStationType: (id: number, data: { name?: string; description?: string }) =>
		salesApiClient.put<StationTypeWithDetails>({ url: `/stationtypes/${id}`, data }),

	deleteStationType: (id: number) => salesApiClient.delete<void>({ url: `/stationtypes/${id}` }),

	getCoverage: (stationTypeId: number) =>
		salesApiClient.get<number[]>({ url: `/stationtypes/${stationTypeId}/coverage` }),

	setCoverage: (stationTypeId: number, categoryIds: number[]) =>
		salesApiClient.put<void>({
			url: `/stationtypes/${stationTypeId}/coverage`,
			data: { categoryIds },
		}),

	getStations: () => salesApiClient.get<Station[]>({ url: "/stations" }),

	createStation: (data: { name: string; typeId: number }) => salesApiClient.post<Station>({ url: "/stations", data }),

	deleteStation: (id: number) => salesApiClient.delete<void>({ url: `/stations/${id}` }),
};

export default stationService;
