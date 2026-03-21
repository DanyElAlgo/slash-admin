import type { OrderItem, OrderStatus, OrderTicket, PaymentType } from "@/types/entity";
import apiClient from "../apiClient";

export interface TaxConfigDto {
	taxRate: number;
}

export interface AccountCreateDto {
	businessId: number;
}

export interface WaiterAssignDto {
	waiterId: number;
}

export interface AddItemDto {
	productId: number;
	quantity: number;
	notes?: string;
}

export interface UpdateItemDto {
	quantity?: number;
	notes?: string;
}

export interface KDSItem {
	itemId: number;
	ticketNumber: string;
	ticketId: number;
	productName: string;
	quantity: number;
	notes?: string;
	createdAt: string;
	status?: string;
}

export interface AccountResponse {
	ticketId: number;
	ticketNumber: string;
	status: string;
	businessId?: number;
	waiterId?: number;
	waiterName?: string;
	subtotal: number;
	tax: number;
	total: number;
	items: (OrderItem & { notes?: string })[];
	createdAt: string;
}

const posService = {
	// Tax Configuration
	getTaxConfig: () =>
		apiClient.get<{ id: number; taxRate: number; isActive: boolean; createdAt: string }>({
			url: "/pos/tax",
		}),
	updateTaxConfig: (data: TaxConfigDto) =>
		apiClient.put<{ id: number; taxRate: number; isActive: boolean; createdAt: string }>({
			url: "/pos/tax",
			data,
		}),

	// Account/Ticket Management
	createAccount: (data: AccountCreateDto) =>
		apiClient.post<AccountResponse>({
			url: "/pos/accounts",
			data,
		}),
	getOpenAccounts: () =>
		apiClient.get<AccountResponse[]>({
			url: "/pos/accounts/open",
		}),
	getAccount: (id: number) =>
		apiClient.get<AccountResponse>({
			url: `/pos/accounts/${id}`,
		}),
	assignWaiter: (accountId: number, data: WaiterAssignDto) =>
		apiClient.post<AccountResponse>({
			url: `/pos/accounts/${accountId}/waiter`,
			data,
		}),

	// Items Management
	addItem: (accountId: number, data: AddItemDto) =>
		apiClient.post<AccountResponse>({
			url: `/pos/accounts/${accountId}/items`,
			data,
		}),
	updateItem: (accountId: number, itemId: number, data: UpdateItemDto) =>
		apiClient.patch<AccountResponse>({
			url: `/pos/accounts/${accountId}/items/${itemId}`,
			data,
		}),
	removeItem: (accountId: number, itemId: number) =>
		apiClient.delete<AccountResponse>({
			url: `/pos/accounts/${accountId}/items/${itemId}`,
		}),

	// Order Management
	validateCheckout: (accountId: number) =>
		apiClient.post<{ message: string }>({
			url: `/pos/accounts/${accountId}/validate-checkout`,
		}),
	sendCommand: (accountId: number) =>
		apiClient.post<{
			success: boolean;
			message: string;
			commandsCreated: number;
			stations: string[];
		}>({
			url: `/pos/accounts/${accountId}/send-command`,
		}),

	// KDS (Kitchen Display System)
	getKDSPending: (stationType: "Cocina" | "Bar") =>
		apiClient.get<KDSItem[]>({
			url: `/pos/kds/${stationType}/pending`,
		}),

	// Users/Waiters (for form selection)
	getWaiters: () => apiClient.get<{ id: number; name: string }[]>({ url: "/users" }),
};

export default posService;
