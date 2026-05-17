import type {
	Category,
	Business,
	InventoryDashboard,
	KardexEntry,
	Product,
	StockItem,
	Unit,
	Warehouse,
} from "@/types/entity";
import { inventoryApiClient } from "../apiClient";

export interface ProductCreateDto {
	sku: string;
	name: string;
	description?: string;
	categoryCen: string;
	unitCen: string;
	salePrice: number;
	costPrice?: number;
	reorderLevel?: number;
	stationCode?: string;
}

export interface ProductQueryDto {
	search?: string;
	categoryCen?: string;
	status?: string;
}

export interface StockAdjustmentLineDto {
	productCen: string;
	quantity: number;
	adjustmentType: "INCREASE" | "DECREASE" | "SET";
}

export interface StockAdjustmentRequestDto {
	warehouseCen: string;
	reason: string;
	lines: StockAdjustmentLineDto[];
}

export interface StockAdjustmentResponse {
	adjustmentCen: string;
	status: string;
	generatedMovements: {
		movementCen: string;
		productCen: string;
		warehouseCen: string;
		quantity: number;
		movementType: string;
	}[];
}

export interface StockValidationRequestDto {
	warehouseCen: string;
	source: string;
	referenceCen?: string;
	items: { productCen: string; quantity: number }[];
}

export interface StockValidationResponseDto {
	isValid: boolean;
	requirements: {
		productCen: string;
		productName: string;
		warehouseCen: string;
		requestedQuantity: number;
		availableQuantity: number;
		missingQuantity: number;
		unitName: string;
		reason: string;
	}[];
}

export interface InventoryDocumentCreateDto {
	documentType: "ENTRY" | "EXIT" | "SALE_EXIT";
	warehouseCen: string;
	reason?: string;
	externalReference?: string;
	source?: string;
	referenceCen?: string;
	lines: { productCen: string; quantity: number; unitCost?: number }[];
}

export interface InventoryDocumentDto {
	documentCen: string;
	documentType: string;
	status: string;
	createdAt: string;
	totalItems: number;
	generatedMovementCens: string[];
}

export interface StockConsumeItemDto {
	productCen: string;
	quantity: number;
}

export interface StockConsumeRequestDto {
	warehouseCen: string;
	source: string;
	referenceCen: string;
	reason?: string;
	items: StockConsumeItemDto[];
}

export interface StockConsumeResponseDto {
	success: boolean;
	message?: string;
	documentCen?: string;
	documentType?: string;
	generatedMovementCens: string[];
	requirements: StockValidationResponseDto["requirements"];
}

const inventoryService = {
	getCompanies: () => inventoryApiClient.get<Business[]>({ url: "/inventory/companies" }),
	getDashboard: (companyCen: string) =>
		inventoryApiClient.get<InventoryDashboard>({ url: `/inventory/companies/${companyCen}/dashboard` }),

	getProducts: (companyCen: string, query?: ProductQueryDto) =>
		inventoryApiClient.get<Product[]>({
			url: `/inventory/companies/${companyCen}/products`,
			params: query,
		}),
	getProduct: (companyCen: string, productCen: string) =>
		inventoryApiClient.get<Product>({ url: `/inventory/companies/${companyCen}/products/${productCen}` }),
	createProduct: (companyCen: string, data: ProductCreateDto) =>
		inventoryApiClient.post<Product>({ url: `/inventory/companies/${companyCen}/products`, data }),
	updateProduct: (companyCen: string, productCen: string, data: Partial<ProductCreateDto>) =>
		inventoryApiClient.put<Product>({ url: `/inventory/companies/${companyCen}/products/${productCen}`, data }),
	updateProductStatus: (companyCen: string, productCen: string, status: string, reason?: string) =>
		inventoryApiClient.patch<Product>({
			url: `/inventory/companies/${companyCen}/products/${productCen}/status`,
			data: { status, reason },
		}),

	getCategories: (companyCen: string) =>
		inventoryApiClient.get<Category[]>({ url: `/inventory/companies/${companyCen}/categories` }),
	createCategory: (companyCen: string, data: { name: string; description?: string }) =>
		inventoryApiClient.post<Category>({ url: `/inventory/companies/${companyCen}/categories`, data }),
	updateCategory: (
		companyCen: string,
		categoryCen: string,
		data: { name?: string; description?: string; isActive?: boolean },
	) => inventoryApiClient.put<Category>({ url: `/inventory/companies/${companyCen}/categories/${categoryCen}`, data }),

	getUnits: (companyCen: string) => inventoryApiClient.get<Unit[]>({ url: `/inventory/companies/${companyCen}/units` }),
	createUnit: (companyCen: string, data: { name: string; abbreviation?: string }) =>
		inventoryApiClient.post<Unit>({ url: `/inventory/companies/${companyCen}/units`, data }),
	updateUnit: (
		companyCen: string,
		unitCen: string,
		data: { name?: string; abbreviation?: string; isActive?: boolean },
	) => inventoryApiClient.put<Unit>({ url: `/inventory/companies/${companyCen}/units/${unitCen}`, data }),

	getWarehouses: (companyCen: string) =>
		inventoryApiClient.get<Warehouse[]>({ url: `/inventory/companies/${companyCen}/warehouses` }),
	createWarehouse: (companyCen: string, data: { name: string }) =>
		inventoryApiClient.post<Warehouse>({ url: `/inventory/companies/${companyCen}/warehouses`, data }),

	getStock: (companyCen: string, productCen?: string, warehouseCen?: string) =>
		inventoryApiClient.get<StockItem[]>({
			url: `/inventory/companies/${companyCen}/stock`,
			params: { productCen, warehouseCen },
		}),
	createAdjustment: (companyCen: string, data: StockAdjustmentRequestDto) =>
		inventoryApiClient.post<StockAdjustmentResponse>({
			url: `/inventory/companies/${companyCen}/stock/adjustments`,
			data,
		}),

	getKardex: (companyCen: string, productCen: string, warehouseCen?: string, from?: string, to?: string) =>
		inventoryApiClient.get<KardexEntry[]>({
			url: `/inventory/companies/${companyCen}/products/${productCen}/kardex`,
			params: { warehouseCen, from, to },
		}),

	createDocument: (companyCen: string, data: InventoryDocumentCreateDto) =>
		inventoryApiClient.post<InventoryDocumentDto>({ url: `/inventory/companies/${companyCen}/documents`, data }),
	getDocuments: (companyCen: string, params?: { documentType?: string; from?: string; to?: string }) =>
		inventoryApiClient.get<InventoryDocumentDto[]>({ url: `/inventory/companies/${companyCen}/documents`, params }),

	validateStock: (companyCen: string, data: StockValidationRequestDto) =>
		inventoryApiClient.post<StockValidationResponseDto>({
			url: `/inventory/companies/${companyCen}/stock/validate`,
			data,
		}),
	consumeStock: (companyCen: string, data: StockConsumeRequestDto) =>
		inventoryApiClient.post<StockConsumeResponseDto>({ url: `/inventory/companies/${companyCen}/stock/consume`, data }),
};

export default inventoryService;
