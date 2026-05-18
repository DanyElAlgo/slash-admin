import type { NavItemDataProps } from "@/components/nav/types";
import type { BasicStatus, PermissionType } from "./enum";

export interface UserToken {
	accessToken?: string;
	refreshToken?: string;
}

export interface UserInfo {
	id: string;
	email: string;
	username: string;
	password?: string;
	avatar?: string;
	roles?: Role[];
	status?: BasicStatus;
	permissions?: Permission[];
	menu?: MenuTree[];
}

export interface Permission_Old {
	id: string;
	parentId: string;
	name: string;
	label: string;
	type: PermissionType;
	route: string;
	status?: BasicStatus;
	order?: number;
	icon?: string;
	component?: string;
	hide?: boolean;
	hideTab?: boolean;
	frameSrc?: URL;
	newFeature?: boolean;
	children?: Permission_Old[];
}

export interface Role_Old {
	id: string;
	name: string;
	code: string;
	status: BasicStatus;
	order?: number;
	desc?: string;
	permission?: Permission_Old[];
}

export interface CommonOptions {
	status?: BasicStatus;
	desc?: string;
	createdAt?: string;
	updatedAt?: string;
}
export interface User extends CommonOptions {
	id: string;
	username: string;
	password: string;
	email: string;
	phone?: string;
	avatar?: string;
}

export interface Role extends CommonOptions {
	id: string;
	name: string;
	code: string;
}

export interface Permission extends CommonOptions {
	id: string;
	name: string;
	code: string;
}

export interface Menu extends CommonOptions, MenuMetaInfo {
	id: string;
	parentId: string;
	name: string;
	code: string;
	order?: number;
	type: PermissionType;
}

export type MenuMetaInfo = Partial<
	Pick<NavItemDataProps, "path" | "icon" | "caption" | "info" | "disabled" | "auth" | "hidden">
> & {
	externalLink?: URL;
	component?: string;
};

export type MenuTree = Menu & {
	children?: MenuTree[];
};

export interface Business {
	companyCen: string;
	name: string;
	isActive?: boolean;
}

export interface InventoryDashboard {
	companyCen: string;
	totalProducts: number;
	totalStockQuantity: number;
	lowStockCount: number;
	outOfStockCount: number;
}

export interface InventoryDocument {
	documentCen: string;
	documentType: string;
	status: string;
	createdAt: string;
	totalItems: number;
	generatedMovementCens: string[];
}

export interface Category {
	categoryCen: string;
	name: string;
	description?: string;
	isActive?: boolean;
}

export interface Unit {
	unitCen: string;
	name: string;
	abbreviation?: string;
	isActive?: boolean;
}

export interface Product {
	productCen: string;
	sku: string;
	name: string;
	description?: string;
	categoryCen: string;
	categoryName?: string;
	unitCen: string;
	unitName?: string;
	salePrice: number;
	costPrice?: number;
	reorderLevel?: number;
	status: string;
	stationCode?: string;
}

export interface Warehouse {
	warehouseCen: string;
	name: string;
	isActive?: boolean;
}

export interface StockItem {
	productCen: string;
	productName: string;
	warehouseCen: string;
	warehouseName: string;
	availableQuantity: number;
	reservedQuantity: number;
	unitName: string;
	reorderLevel: number;
	isLowStock: boolean;
}

export interface KardexEntry {
	movementCen: string;
	documentCen?: string;
	productCen: string;
	warehouseCen: string;
	movementType: string;
	quantity: number;
	unitCost?: number;
	reason?: string;
	createdAt: string;
}

export interface PaginatedResult<T> {
	items: T[];
	totalCount: number;
	pageNumber: number;
	pageSize: number;
	totalPages: number;
}

export interface DailySalesDashboard {
	totalSales: number;
	ticketsCount: number;
	averageTicket: number;
}

export interface TopProductDashboard {
	productCen: string;
	productName: string;
	totalQuantity: number;
	categoryCen?: string;
	categoryName?: string;
	salePrice: number;
}

export interface KdsStatusDashboard {
	pendingCount: number;
	preparingCount: number;
	readyCount: number;
}

export interface TicketContractResponse {
	ticketCen: string;
	dailyNumber: number;
	status: string;
	createdAt: string;
	waiterCen?: string;
	companyCen: string;
	taxAmount: number;
}

export interface TicketItemContractResponse {
	ticketItemCen: string;
	productCen: string;
	productName: string;
	quantity: number;
	unitPrice: number;
	note?: string;
	status: string;
	sentAt?: string;
	resendCount: number;
}

export interface AssignTicketWaiterContractResponse {
	ticketCen: string;
	waiterCen: string;
	waiterName: string;
}

export interface CancelTicketContractResponse {
	ticketCen: string;
	status: string;
}

export interface TicketTotalsContractResponse {
	ticketCen: string;
	subtotal: number;
	taxAmount: number;
	total: number;
}

export interface PayTicketContractResponse {
	saleCen: string;
	ticketCen: string;
	status: string;
	subtotal: number;
	taxAmount: number;
	total: number;
	inventoryDocumentCen?: string;
}

export interface StockInsufficiencyResponse {
	productId: number;
	productCen?: string;
	productName: string;
	warehouseCen?: string;
	requestedQuantity: number;
	availableQuantity: number;
	missingQuantity: number;
}

export interface ProcessPaymentConflict {
	isSuccess: boolean;
	saleCen?: string;
	subtotal: number;
	taxAmount: number;
	total: number;
	message: string;
	insufficiencies: StockInsufficiencyResponse[];
}

export interface KdsTeamContractResponse {
	teamCen: string;
	name: string;
	categoryCens: string[];
}

export interface KdsItemContractResponse {
	ticketItemCen: string;
	ticketCen: string;
	productCen: string;
	productName: string;
	quantity: number;
	status: string;
	note?: string;
	resendCount: number;
	createdAt: string;
}

export interface PaymentMethodContractResponse {
	paymentMethodCode: string;
	name: string;
	isActive: boolean;
}

export interface WaiterContractResponse {
	waiterCen: string;
	name: string;
}

export interface TaxConfigurationContractResponse {
	companyCen: string;
	globalTaxPercentage: number;
}

export interface SellableProductContractDto {
	productCen: string;
	name: string;
	categoryCen?: string;
	categoryName?: string;
	salePrice: number;
	availableQuantity: number;
	isAvailable: boolean;
	stationCode?: string;
}

// =============================================================================
// Purchases module
// =============================================================================

export enum PurchaseStatus {
	Pending = 0,
	Confirmed = 1,
	Cancelled = 2,
}

export interface PagedResultDto<T> {
	items: T[];
	totalCount: number;
	totalPages: number;
	currentPage: number;
}

export interface PurchaseOrderListItem {
	orderCen: string;
	status: PurchaseStatus;
	createdAt: string;
	confirmedAt?: string | null;
	supplierCen: string;
	itemCount: number;
}

export interface PurchaseOrderDetailItem {
	productCen: string;
	quantity: number;
}

export interface PurchaseOrderDetail {
	orderCen: string;
	status: PurchaseStatus;
	createdAt: string;
	confirmedAt?: string | null;
	supplierCen: string;
	warehouseCen: string;
	items: PurchaseOrderDetailItem[];
}

export interface PurchaseOrderSummary {
	orderCen: string;
	status: PurchaseStatus;
}

export interface PurchaseOrderConfirmation {
	orderCen: string;
	status: PurchaseStatus;
	confirmedAt: string;
}

export interface PurchaseOrderCancellation {
	orderCen: string;
	status: PurchaseStatus;
	cancelledAt: string;
}

export interface CreatePurchaseOrderItem {
	productCen: string;
	quantity: number;
}

export interface CreatePurchaseOrderRequest {
	supplierCen: string;
	warehouseCen: string;
	items: CreatePurchaseOrderItem[];
}

export interface Supplier {
	supplierCen: string;
	name: string;
}

export interface SupplierDetail {
	supplierCen: string;
	name: string;
	contactEmail?: string;
	contactPhone?: string;
	isActive: boolean;
}

export interface CreateSupplierRequest {
	name: string;
	contactEmail?: string;
	contactPhone?: string;
}

export interface UpdateSupplierRequest {
	name: string;
	contactEmail?: string;
	contactPhone?: string;
	isActive: boolean;
}
