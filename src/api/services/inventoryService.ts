import apiClient from "../apiClient";
import type { Product, StockMovement } from "@/types/entity";

export interface StockSetDto {
	productId: number;
	warehouseId: number;
	quantity: number;
	reason: string;
}

export interface StockChangeDto {
	productId: number;
	warehouseId: number;
	quantity: number;
	reason: string;
}

export interface StockTransferDto {
	productId: number;
	sourceWarehouseId: number;
	destinationWarehouseId: number;
	quantity: number;
	reason: string;
}

export interface StockOperationResultDto {
	success: boolean;
	message: string;
	data?: any;
}

export interface KardexGetDto {
	id: number;
	productId: number;
	warehouseId: number;
	type: string;
	quantity: number;
	reason: string;
	date: string;
}

const inventoryService = {
	// getProducts: () => apiClient.get<Product[]>("/products"),
	// createProduct: (data: Product) => apiClient.post<Product>("/products", data),
	// updateStock: (productId: string, quantity: number) => apiClient.post(`/products/${productId}/stock`, { quantity }),

	setStock: (dto: StockSetDto) =>
		apiClient.post<StockOperationResultDto>({ url: "/stock/set", method: "POST", data: dto }),
	addStock: (dto: StockChangeDto) =>
		apiClient.post<StockOperationResultDto>({ url: "/stock/add", method: "POST", data: dto }),
	subtractStock: (dto: StockChangeDto) =>
		apiClient.post<StockOperationResultDto>({ url: "/stock/subtract", method: "POST", data: dto }),
	transferStock: (dto: StockTransferDto) =>
		apiClient.post<StockOperationResultDto>({ url: "/stock/transfer", method: "POST", data: dto }),
	getWarehouseHistory: (warehouseId: number) =>
		apiClient.get<KardexGetDto[]>({ url: `/stock/warehouse/${warehouseId}/history` }),
	getProductWarehouseHistory: (productId: number, warehouseId: number) =>
		apiClient.get<KardexGetDto[]>({ url: `/stock/product/${productId}/warehouse/${warehouseId}/history` }),
};

export default inventoryService;
