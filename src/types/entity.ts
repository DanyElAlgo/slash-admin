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
	id: number;
	name: string;
}

export interface Category {
	id: number;
	name: string;
	description: string;
	productCount?: number;
}

export interface Unit {
	id: number;
	name: string;
	description: string;
}

export interface ProductStatus {
	id: number;
	name: string;
	description: string;
}

export interface Product {
	id: number;
	name: string;
	description: string;
	unitId: number;
	unitName?: string;
	unitQty: number;
	categoryId: number;
	categoryName?: string;
	statusId?: number;
	statusName?: string;
	isActive?: boolean;
	totalStock?: number;
	lowStockCount?: number;
}

export interface Warehouse {
	id: number;
	businessId: number;
	name: string;
}

export interface WarehouseProduct {
	id: number;
	warehouseId: number;
	warehouseName?: string;
	productId: number;
	productName?: string;
	statusId: number;
	statusName?: string;
	stockLeft: number;
	lowStockQty: number;
	isLowStock?: boolean;
}

export interface KardexEntry {
	id: number;
	warehouseId: number;
	productId: number;
	actionType: string;
	actionQty: number;
	reason: string;
	timeStamp: string;
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
	productId: number;
	productName?: string;
	statusId: number;
	statusName?: string;
}

export interface Payment {
	id: number;
	orderId: number;
	paymentTypeId: number;
	paymentTypeName?: string;
	paidAt: string;
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
