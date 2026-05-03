import type {
	Category,
	KardexEntry,
	PaginatedResult,
	Product,
	Unit,
	Warehouse,
	WarehouseProduct,
} from "@/types/entity";
import { inventoryApiClient } from "../apiClient";

export interface ProductCreateDto {
	name: string;
	description?: string;
	unitId?: number;
	unitQty?: number;
	categoryId?: number;
	statusId?: number;
	isActive?: boolean;
	price: number;
}

export interface ProductSearchDto {
	searchTerm?: string;
	categoryId?: number;
	statusId?: number;
	pageNumber?: number;
	pageSize?: number;
}

export interface WarehouseProductCreateDto {
	warehouseId: number;
	productId: number;
	statusId?: number;
	stockLeft?: number;
	lowStockQty?: number;
}

export interface StockSetDto {
	productId: number;
	warehouseId: number;
	quantity: number;
	reason: string;
}

export interface StockAdjustDto {
	productId: number;
	warehouseId: number;
	quantity: number;
	actionType: "IN" | "OUT";
	reason: string;
}

export interface StockOperationResult {
	success: boolean;
	message: string;
	newStock: number;
	kardexId: number;
}

const inventoryService = {
	getProducts: () => inventoryApiClient.get<Product[]>({ url: "/products" }),
	getProduct: (id: number) => inventoryApiClient.get<Product>({ url: `/products/${id}` }),
	createProduct: (data: ProductCreateDto) => inventoryApiClient.post<Product>({ url: "/products", data }),
	updateProduct: (id: number, data: Partial<ProductCreateDto>) =>
		inventoryApiClient.put<Product>({ url: `/products/${id}`, data }),
	deleteProduct: (id: number) => inventoryApiClient.delete<void>({ url: `/products/${id}` }),
	searchProducts: (data: ProductSearchDto) =>
		inventoryApiClient.post<PaginatedResult<Product & { totalStock: number; lowStockCount: number }>>({
			url: "/products/search",
			data,
		}),

	getCategories: () => inventoryApiClient.get<Category[]>({ url: "/categories" }),
	getCategory: (id: number) => inventoryApiClient.get<Category>({ url: `/categories/${id}` }),
	createCategory: (data: { name: string; description?: string }) =>
		inventoryApiClient.post<Category>({ url: "/categories", data }),
	updateCategory: (id: number, data: { name?: string; description?: string }) =>
		inventoryApiClient.put<Category>({ url: `/categories/${id}`, data }),
	deleteCategory: (id: number) => inventoryApiClient.delete<void>({ url: `/categories/${id}` }),

	getUnits: () => inventoryApiClient.get<Unit[]>({ url: "/units" }),
	getUnit: (id: number) => inventoryApiClient.get<Unit>({ url: `/units/${id}` }),
	createUnit: (data: { name: string; description?: string }) => inventoryApiClient.post<Unit>({ url: "/units", data }),
	updateUnit: (id: number, data: { name?: string; description?: string }) =>
		inventoryApiClient.put<Unit>({ url: `/units/${id}`, data }),
	deleteUnit: (id: number) => inventoryApiClient.delete<void>({ url: `/units/${id}` }),

	getWarehouses: () => inventoryApiClient.get<Warehouse[]>({ url: "/warehouses" }),

	getWarehouseProducts: () => inventoryApiClient.get<WarehouseProduct[]>({ url: "/warehouseproducts" }),
	getWarehouseProduct: (id: number) => inventoryApiClient.get<WarehouseProduct>({ url: `/warehouseproducts/${id}` }),
	getProductsInWarehouse: (warehouseId: number) =>
		inventoryApiClient.get<WarehouseProduct[]>({ url: `/warehouseproducts/warehouse/${warehouseId}` }),
	getWarehousesForProduct: (productId: number) =>
		inventoryApiClient.get<WarehouseProduct[]>({ url: `/warehouseproducts/product/${productId}` }),
	getLowStockItems: () => inventoryApiClient.get<WarehouseProduct[]>({ url: "/warehouseproducts/stock/low" }),
	createWarehouseProduct: (data: WarehouseProductCreateDto) =>
		inventoryApiClient.post<WarehouseProduct>({ url: "/warehouseproducts", data }),
	updateWarehouseProduct: (id: number, data: Partial<WarehouseProductCreateDto>) =>
		inventoryApiClient.put<WarehouseProduct>({ url: `/warehouseproducts/${id}`, data }),
	deleteWarehouseProduct: (id: number) => inventoryApiClient.delete<void>({ url: `/warehouseproducts/${id}` }),

	setOutOfStock: (warehouseId: number, productId: number, isOutOfStock: boolean) =>
		inventoryApiClient.patch<WarehouseProduct>({
			url: `/stock/warehouse/${warehouseId}/product/${productId}/out-of-stock`,
			data: { isOutOfStock },
		}),

	setStock: (dto: StockSetDto) => inventoryApiClient.post<StockOperationResult>({ url: "/stock/initial", data: dto }),
	addStock: (dto: Omit<StockAdjustDto, "actionType">) =>
		inventoryApiClient.post<StockOperationResult>({
			url: "/stock/adjust",
			data: { ...dto, actionType: "IN" },
		}),
	subtractStock: (dto: Omit<StockAdjustDto, "actionType">) =>
		inventoryApiClient.post<StockOperationResult>({
			url: "/stock/adjust",
			data: { ...dto, actionType: "OUT" },
		}),

	getWarehouseHistory: (warehouseId: number) =>
		inventoryApiClient.get<KardexEntry[]>({ url: `/stock/warehouse/${warehouseId}/history` }),
	getProductHistory: (productId: number) =>
		inventoryApiClient.get<KardexEntry[]>({ url: `/stock/product/${productId}/history` }),
	getProductWarehouseHistory: (productId: number, warehouseId: number) =>
		inventoryApiClient.get<KardexEntry[]>({
			url: `/stock/product/${productId}/warehouse/${warehouseId}/history`,
		}),
};

export default inventoryService;
