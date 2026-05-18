import { purchasesApiClient } from "../apiClient";
import type {
	CreatePurchaseOrderRequest,
	CreateSupplierRequest,
	PagedResultDto,
	PurchaseOrderCancellation,
	PurchaseOrderConfirmation,
	PurchaseOrderDetail,
	PurchaseOrderListItem,
	PurchaseOrderSummary,
	PurchaseStatus,
	Supplier,
	SupplierDetail,
	UpdateSupplierRequest,
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

	cancelOrder: (companyCen: string, orderCen: string, reason?: string) =>
		purchasesApiClient.post<PurchaseOrderCancellation>({
			url: `/purchases/companies/${companyCen}/orders/${orderCen}/cancel`,
			data: { reason },
		}),

	listSuppliers: (companyCen: string) =>
		purchasesApiClient.get<Supplier[]>({
			url: `/purchases/companies/${companyCen}/suppliers`,
		}),

	createSupplier: (companyCen: string, data: CreateSupplierRequest) =>
		purchasesApiClient.post<SupplierDetail>({
			url: `/purchases/companies/${companyCen}/suppliers`,
			data,
		}),

	updateSupplier: (companyCen: string, supplierCen: string, data: UpdateSupplierRequest) =>
		purchasesApiClient.put<SupplierDetail>({
			url: `/purchases/companies/${companyCen}/suppliers/${supplierCen}`,
			data,
		}),

	deleteSupplier: (companyCen: string, supplierCen: string) =>
		purchasesApiClient.delete<void>({
			url: `/purchases/companies/${companyCen}/suppliers/${supplierCen}`,
		}),
};

export default purchasesService;
