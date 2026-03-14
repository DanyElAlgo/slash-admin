import type {
	Category,
	KardexEntry,
	PaginatedResult,
	Product,
	Unit,
	Warehouse,
	WarehouseProduct,
} from "@/types/entity";
import apiClient from "../apiClient";

export interface ProductCreateDto {
	name: string;
	description?: string;
	unitId?: number;
	unitQty?: number;
	categoryId?: number;
	statusId?: number;
	isActive?: boolean;
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

const inventoryService = {
	getProducts: () => apiClient.get<Product[]>({ url: "/products" }),
	getProduct: (id: number) => apiClient.get<Product>({ url: `/products/${id}` }),
	createProduct: (data: ProductCreateDto) => apiClient.post<Product>({ url: "/products", data }),
	updateProduct: (id: number, data: Partial<ProductCreateDto>) =>
		apiClient.put<Product>({ url: `/products/${id}`, data }),
	deleteProduct: (id: number) => apiClient.delete<void>({ url: `/products/${id}` }),
	searchProducts: (data: ProductSearchDto) =>
		apiClient.post<PaginatedResult<Product & { totalStock: number; lowStockCount: number }>>({
			url: "/products/search",
			data,
		}),

	getCategories: () => apiClient.get<Category[]>({ url: "/categories" }),
	getCategory: (id: number) => apiClient.get<Category>({ url: `/categories/${id}` }),
	createCategory: (data: { name: string; description?: string }) =>
		apiClient.post<Category>({ url: "/categories", data }),
	updateCategory: (id: number, data: { name?: string; description?: string }) =>
		apiClient.put<Category>({ url: `/categories/${id}`, data }),
	deleteCategory: (id: number) => apiClient.delete<void>({ url: `/categories/${id}` }),

	getUnits: () => apiClient.get<Unit[]>({ url: "/units" }),
	getUnit: (id: number) => apiClient.get<Unit>({ url: `/units/${id}` }),
	createUnit: (data: { name: string; description?: string }) => apiClient.post<Unit>({ url: "/units", data }),
	updateUnit: (id: number, data: { name?: string; description?: string }) =>
		apiClient.put<Unit>({ url: `/units/${id}`, data }),
	deleteUnit: (id: number) => apiClient.delete<void>({ url: `/units/${id}` }),

	getWarehouses: () => apiClient.get<Warehouse[]>({ url: "/warehouses" }),

	getWarehouseProducts: () => apiClient.get<WarehouseProduct[]>({ url: "/warehouseproducts" }),
	getWarehouseProduct: (id: number) => apiClient.get<WarehouseProduct>({ url: `/warehouseproducts/${id}` }),
	getProductsInWarehouse: (warehouseId: number) =>
		apiClient.get<WarehouseProduct[]>({ url: `/warehouseproducts/warehouse/${warehouseId}` }),
	getWarehousesForProduct: (productId: number) =>
		apiClient.get<WarehouseProduct[]>({ url: `/warehouseproducts/product/${productId}` }),
	getLowStockItems: () => apiClient.get<WarehouseProduct[]>({ url: "/warehouseproducts/stock/low" }),
	createWarehouseProduct: (data: WarehouseProductCreateDto) =>
		apiClient.post<WarehouseProduct>({ url: "/warehouseproducts", data }),
	updateWarehouseProduct: (id: number, data: Partial<WarehouseProductCreateDto>) =>
		apiClient.put<WarehouseProduct>({ url: `/warehouseproducts/${id}`, data }),
	deleteWarehouseProduct: (id: number) => apiClient.delete<void>({ url: `/warehouseproducts/${id}` }),

	setStock: (dto: StockSetDto) => apiClient.post<void>({ url: "/stock/set", data: dto }),
	addStock: (dto: StockChangeDto) => apiClient.post<void>({ url: "/stock/add", data: dto }),
	subtractStock: (dto: StockChangeDto) => apiClient.post<void>({ url: "/stock/subtract", data: dto }),
	transferStock: (dto: StockTransferDto) => apiClient.post<void>({ url: "/stock/transfer", data: dto }),

	getWarehouseHistory: (warehouseId: number) =>
		apiClient.get<KardexEntry[]>({ url: `/stock/warehouse/${warehouseId}/history` }),
	getProductHistory: (productId: number) =>
		apiClient.get<KardexEntry[]>({ url: `/stock/product/${productId}/history` }),
	getProductWarehouseHistory: (productId: number, warehouseId: number) =>
		apiClient.get<KardexEntry[]>({
			url: `/stock/product/${productId}/warehouse/${warehouseId}/history`,
		}),
};

export default inventoryService;
