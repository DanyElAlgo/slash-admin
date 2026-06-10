import { purchasesApiClient } from "../apiClient";
import type {
	CreatePurchaseOrderRequest,
	PagedResultDto,
	PurchaseOrderConfirmation,
	PurchaseOrderDetail,
	PurchaseOrderListItem,
	PurchaseOrderSummary,
	PurchaseStatus,
	Supplier,
} from "@/types/entity";

const purchasesService = {
	listOrders: (
		companyCen: string,
		params: { status?: PurchaseStatus; page?: number; pageSize?: number; sortDescending?: boolean } = {},
	) =>
		purchasesApiClient.get<PagedResultDto<PurchaseOrderListItem>>({
			url: `/purchases/companies/${companyCen}/orders`,
			params,
		}),

	getOrder: (companyCen: string, orderCen: string) =>
		purchasesApiClient.get<PurchaseOrderDetail>({
			url: `/purchases/companies/${companyCen}/orders/${orderCen}`,
		}),

	createOrder: (companyCen: string, data: CreatePurchaseOrderRequest) =>
		purchasesApiClient.post<PurchaseOrderSummary>({
			url: `/purchases/companies/${companyCen}/orders`,
			data,
		}),

	confirmOrder: (companyCen: string, orderCen: string) =>
		purchasesApiClient.post<PurchaseOrderConfirmation>({
			url: `/purchases/companies/${companyCen}/orders/${orderCen}/confirm`,
		}),

	listSuppliers: (companyCen: string) =>
		purchasesApiClient.get<Supplier[]>({
			url: `/purchases/companies/${companyCen}/suppliers`,
		}),
};

export default purchasesService;
