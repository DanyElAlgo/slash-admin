import { salesApiClient } from "../apiClient";
import type {
	AssignTicketWaiterContractResponse,
	CancelTicketContractResponse,
	KdsItemContractResponse,
	KdsTeamContractResponse,
	PaymentMethodContractResponse,
	PayTicketContractResponse,
	ProcessPaymentConflict,
	TaxConfigurationContractResponse,
	TicketContractResponse,
	TicketItemContractResponse,
	TicketTotalsContractResponse,
	WaiterContractResponse,
} from "@/types/entity";

const posService = {
	getPaymentMethods: () => salesApiClient.get<PaymentMethodContractResponse[]>({ url: "/sales/payment-methods" }),

	getTaxConfig: (companyCen: string) =>
		salesApiClient.get<TaxConfigurationContractResponse>({
			url: `/sales/companies/${companyCen}/tax-configuration`,
		}),

	updateTaxConfig: (companyCen: string, data: { globalTaxPercentage: number }) =>
		salesApiClient.put<TaxConfigurationContractResponse>({
			url: `/sales/companies/${companyCen}/tax-configuration`,
			data,
		}),

	getTickets: (companyCen: string) =>
		salesApiClient.get<TicketContractResponse[]>({
			url: `/sales/companies/${companyCen}/tickets`,
		}),

	createTicket: (companyCen: string, data?: { waiterCen?: string }) =>
		salesApiClient.post<TicketContractResponse>({
			url: `/sales/companies/${companyCen}/tickets`,
			data: data ?? {},
		}),

	getTicketItems: (companyCen: string, ticketCen: string) =>
		salesApiClient.get<TicketItemContractResponse[]>({
			url: `/sales/companies/${companyCen}/tickets/${ticketCen}/items`,
		}),

	addTicketItem: (
		companyCen: string,
		ticketCen: string,
		data: { productCen: string; quantity: number; note?: string },
	) =>
		salesApiClient.post<TicketItemContractResponse>({
			url: `/sales/companies/${companyCen}/tickets/${ticketCen}/items`,
			data,
		}),

	updateTicketItem: (
		companyCen: string,
		ticketCen: string,
		ticketItemCen: string,
		data: { quantity?: number; note?: string },
	) =>
		salesApiClient.patch<TicketItemContractResponse>({
			url: `/sales/companies/${companyCen}/tickets/${ticketCen}/items/${ticketItemCen}`,
			data,
		}),

	resendTicketItem: (companyCen: string, ticketCen: string, ticketItemCen: string) =>
		salesApiClient.post<TicketItemContractResponse>({
			url: `/sales/companies/${companyCen}/tickets/${ticketCen}/items/${ticketItemCen}/resend`,
		}),

	sendTicketToKitchen: (companyCen: string, ticketCen: string) =>
		salesApiClient.post<TicketItemContractResponse[]>({
			url: `/sales/companies/${companyCen}/tickets/${ticketCen}/send`,
		}),

	assignWaiter: (companyCen: string, ticketCen: string, waiterCen: string) =>
		salesApiClient.put<AssignTicketWaiterContractResponse>({
			url: `/sales/companies/${companyCen}/tickets/${ticketCen}/waiter`,
			data: { waiterCen },
		}),

	cancelTicket: (companyCen: string, ticketCen: string, reason?: string) =>
		salesApiClient.post<CancelTicketContractResponse>({
			url: `/sales/companies/${companyCen}/tickets/${ticketCen}/cancel`,
			data: { reason },
		}),

	printTicket: (companyCen: string, ticketCen: string) =>
		salesApiClient.request<Blob>({
			method: "GET",
			url: `/sales/companies/${companyCen}/tickets/${ticketCen}/print`,
			responseType: "blob",
		}),

	getTicketTotals: (companyCen: string, ticketCen: string) =>
		salesApiClient.get<TicketTotalsContractResponse>({
			url: `/sales/companies/${companyCen}/tickets/${ticketCen}/totals`,
		}),

	payTicket: async (
		companyCen: string,
		ticketCen: string,
		paymentMethodCode: string,
	): Promise<{ success: PayTicketContractResponse | null; conflict: ProcessPaymentConflict | null }> => {
		const result = await salesApiClient.request<any>({
			method: "POST",
			url: `/sales/companies/${companyCen}/tickets/${ticketCen}/payment`,
			data: { paymentMethodCode },
			validateStatus: (status: number) => status === 200 || status === 409,
		});
		if (result && "saleCen" in result) {
			return { success: result as PayTicketContractResponse, conflict: null };
		}
		return { success: null, conflict: result as ProcessPaymentConflict };
	},

	getKdsTeams: (companyCen: string) =>
		salesApiClient.get<KdsTeamContractResponse[]>({
			url: `/sales/companies/${companyCen}/kds/teams`,
		}),

	getKdsItemsByTeam: (companyCen: string, teamCen: string) =>
		salesApiClient.get<KdsItemContractResponse[]>({
			url: `/sales/companies/${companyCen}/kds/teams/${teamCen}/items`,
		}),

	updateKdsItemStatus: (
		companyCen: string,
		ticketItemCen: string,
		status: "created" | "preparing" | "delivered" | "canceled",
	) =>
		salesApiClient.patch<KdsItemContractResponse>({
			url: `/sales/companies/${companyCen}/kds/items/${ticketItemCen}/status`,
			data: { status },
		}),

	getWaiters: (companyCen: string) =>
		salesApiClient.get<WaiterContractResponse[]>({
			url: `/sales/companies/${companyCen}/waiters`,
		}),
};

export default posService;
