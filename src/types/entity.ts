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
	id: string; // uuid
	username: string;
	password: string;
	email: string;
	phone?: string;
	avatar?: string;
}

export interface Role extends CommonOptions {
	id: string; // uuid
	name: string;
	code: string;
}

export interface Permission extends CommonOptions {
	id: string;
	name: string;
	code: string; // resource:action  example: "user-management:read"
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

export interface ProductStatus {
	id: number;
	name: string;
	description: string;
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

export interface Customer {
	id: number;
	name: string;
	phone: string;
}

export interface OrderStatus {
	id: number;
	name: string;
	description: string;
}

export interface PaymentType {
	id: number;
	name: string;
	description: string;
}

export interface OrderTicket {
	id: number;
	customerId: number;
	customerName?: string;
	statusId: number;
	statusName?: string;
	items?: OrderItem[];
}

export interface OrderItem {
	id: number;
	qty: number;
	additionalNote: string;
	orderId: number;
	productCen: string;
	unitPrice: number;
	productName?: string;
	statusId: number;
	statusName?: string;
}

export interface Payment {
	id: number;
	orderId: number;
	paymentTypeId: number;
	paymentTypeName?: string;
	paidAt?: string | null;
}

export interface Waiter {
	id: number;
	name: string;
	phone: string;
}

export interface StationType {
	id: number;
	name: string;
	description: string;
}

export interface Station {
	id: number;
	name: string;
	typeId: number;
	typeName?: string;
}

export interface OrderCommand {
	id: number;
	orderId: number;
	waiterId: number;
	waiterName?: string;
}

export interface CommandItem {
	id: number;
	orderItemId: number;
	commandId: number;
	stationId: number;
}

export interface StationCoverage {
	stationTypeId: number;
	categoryId: number;
}

export interface PaginatedResult<T> {
	items: T[];
	totalCount: number;
	pageNumber: number;
	pageSize: number;
	totalPages: number;
}

export interface StationTypeWithDetails {
	id: number;
	name: string;
	description?: string;
	categoryIds: number[];
	stations: Station[];
}

export interface CheckoutResult {
	success: boolean;
	message: string;
	paymentId?: number;
	total: number;
}

export interface SalesDashboard {
	totalSoldToday: number;
	paidTicketsToday: number;
	avgTicketToday: number;
}

export interface DailySalesDashboard {
	totalSales: number;
	ticketsCount: number;
	averageTicket: number;
}

export interface TopProduct {
	productCen: string;
	productName: string;
	totalQtySold: number;
	totalRevenue: number;
}

export interface TopProductDashboard {
	productCen: string;
	productName: string;
	totalQuantity: number;
	categoryCen?: string;
	categoryName?: string;
	salePrice: number;
}

export interface KdsStatusSummary {
	pendingCount: number;
	inPreparationCount: number;
	readyCount: number;
}

export interface KdsStatusDashboard {
	pendingCount: number;
	preparingCount: number;
	readyCount: number;
}

export interface StockAlertEntry {
	productCen: string;
	productName: string;
	warehouseName: string;
	stockLeft: number;
	lowStockQty: number;
	isOutOfStock: boolean;
}

export interface StockAlertsDashboard {
	outOfStock: StockAlertEntry[];
	lowStock: StockAlertEntry[];
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

export interface CommandReprintItem {
	productName: string;
	quantity: number;
	note?: string;
	stationName: string;
}

export interface CommandReprint {
	commandId: number;
	ticketId: number;
	waiterName: string;
	printedAt: string;
	items: CommandReprintItem[];
}
