import { salesApiClient } from "../apiClient";

export interface TaxConfigDto {
	taxRate: number;
}

export interface AccountCreateDto {
	customerId?: number;
}

export interface WaiterAssignDto {
	waiterId: number;
}

export interface AddItemDto {
	productId: number;
	quantity: number;
	note?: string;
}

export interface UpdateItemDto {
	quantity?: number;
	note?: string;
}

export interface PosOrderItemDto {
	id: number;
	productId: number;
	productName: string;
	unitPrice: number;
	quantity: number;
	note?: string;
	lineTotal: number;
}

export interface AccountResponse {
	ticketId: number;
	accountNumber: string;
	status: string;
	waiterId?: number;
	waiterName?: string;
	taxRate: number;
	subtotal: number;
	tax: number;
	total: number;
	createdAt: string;
	items: PosOrderItemDto[];
}

export interface KDSItem {
	commandId: number;
	ticketId: number;
	orderItemId: number;
	stationName: string;
	stationType: string;
	productName: string;
	quantity: number;
	note?: string;
	status: string;
}

const posService = {
	// Tax Configuration
	getTaxConfig: () =>
		salesApiClient.get<{ taxRate: number }>({
			url: "/pos/tax",
		}),
	updateTaxConfig: (data: TaxConfigDto) =>
		salesApiClient.put<{ taxRate: number }>({
			url: "/pos/tax",
			data,
		}),

	// Account/Ticket Management
	createAccount: (data?: AccountCreateDto) =>
		salesApiClient.post<AccountResponse>({
			url: "/pos/accounts",
			data: data ?? {},
		}),
	getOpenAccounts: () =>
		salesApiClient.get<AccountResponse[]>({
			url: "/pos/accounts/open",
		}),
	getAccount: (id: number) =>
		salesApiClient.get<AccountResponse>({
			url: `/pos/accounts/${id}`,
		}),
	assignWaiter: (accountId: number, data: WaiterAssignDto) =>
		salesApiClient.post<AccountResponse>({
			url: `/pos/accounts/${accountId}/waiter`,
			data,
		}),

	// Items Management
	addItem: (accountId: number, data: AddItemDto) =>
		salesApiClient.post<AccountResponse>({
			url: `/pos/accounts/${accountId}/items`,
			data,
		}),
	updateItem: (accountId: number, itemId: number, data: UpdateItemDto) =>
		salesApiClient.patch<AccountResponse>({
			url: `/pos/accounts/${accountId}/items/${itemId}`,
			data,
		}),
	removeItem: (accountId: number, itemId: number) =>
		salesApiClient.delete<AccountResponse>({
			url: `/pos/accounts/${accountId}/items/${itemId}`,
		}),

	// Order Management
	validateCheckout: (accountId: number) =>
		salesApiClient.post<{ message: string }>({
			url: `/pos/accounts/${accountId}/validate-checkout`,
		}),
	sendCommand: (accountId: number) =>
		salesApiClient.post<{
			success: boolean;
			message: string;
			commandId: number;
			itemsSent: number;
		}>({
			url: `/pos/accounts/${accountId}/send-command`,
		}),

	// KDS (Kitchen Display System)
	getKDSPending: (stationType: string) =>
		salesApiClient.get<KDSItem[]>({
			url: `/pos/kds/${stationType}/pending`,
		}),

	// HU-17: advance KDS item status (Pending → En Preparación → Listo)
	advanceKdsItemStatus: (orderItemId: number) =>
		salesApiClient.patch<KDSItem>({
			url: `/pos/kds/items/${orderItemId}/status`,
		}),

	// HU-18: get command data for reprinting
	getCommandReprint: (commandId: number) =>
		salesApiClient.get<{
			commandId: number;
			ticketId: number;
			waiterName: string;
			printedAt: string;
			items: { productName: string; quantity: number; note?: string; stationName: string }[];
		}>({
			url: `/pos/commands/${commandId}/reprint`,
		}),

	// HU-19/20/21: checkout with payment method
	checkout: (accountId: number, data: { paymentTypeId: number }) =>
		salesApiClient.post<{ success: boolean; message: string; paymentId?: number; total: number }>({
			url: `/pos/accounts/${accountId}/checkout`,
			data,
		}),

	// HU-22: cancel open account
	cancelAccount: (accountId: number) =>
		salesApiClient.delete<AccountResponse>({
			url: `/pos/accounts/${accountId}`,
		}),
};

export default posService;
