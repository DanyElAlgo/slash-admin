import type { Customer, OrderItem, OrderStatus, OrderTicket, Payment, PaymentType } from "@/types/entity";
import { salesApiClient } from "../apiClient";

export interface CustomerCreateDto {
	name: string;
	phone?: string;
}

export interface OrderCreateDto {
	customerId: number;
	statusId?: number;
}

export interface OrderItemCreateDto {
	qty: number;
	additionalNote?: string;
	orderId: number;
	productId: number;
	statusId?: number;
}

export interface PaymentCreateDto {
	orderId: number;
	paymentTypeId: number;
}

const salesService = {
	getCustomers: () => salesApiClient.get<Customer[]>({ url: "/customers" }),
	getCustomer: (id: number) => salesApiClient.get<Customer>({ url: `/customers/${id}` }),
	createCustomer: (data: CustomerCreateDto) => salesApiClient.post<Customer>({ url: "/customers", data }),
	updateCustomer: (id: number, data: Partial<CustomerCreateDto>) =>
		salesApiClient.put<Customer>({ url: `/customers/${id}`, data }),
	deleteCustomer: (id: number) => salesApiClient.delete<void>({ url: `/customers/${id}` }),

	getOrderStatuses: () => salesApiClient.get<OrderStatus[]>({ url: "/orderstatuses" }),

	getPaymentTypes: () => salesApiClient.get<PaymentType[]>({ url: "/paymenttypes" }),

	getOrders: () => salesApiClient.get<OrderTicket[]>({ url: "/orders" }),
	getOrder: (id: number) => salesApiClient.get<OrderTicket>({ url: `/orders/${id}` }),
	createOrder: (data: OrderCreateDto) => salesApiClient.post<OrderTicket>({ url: "/orders", data }),
	updateOrder: (id: number, data: Partial<OrderCreateDto>) =>
		salesApiClient.put<OrderTicket>({ url: `/orders/${id}`, data }),
	deleteOrder: (id: number) => salesApiClient.delete<void>({ url: `/orders/${id}` }),

	getOrderItems: (orderId: number) => salesApiClient.get<OrderItem[]>({ url: `/orders/${orderId}/items` }),
	addOrderItem: (data: OrderItemCreateDto) => salesApiClient.post<OrderItem>({ url: "/orderitems", data }),
	updateOrderItem: (id: number, data: Partial<OrderItemCreateDto>) =>
		salesApiClient.put<OrderItem>({ url: `/orderitems/${id}`, data }),
	deleteOrderItem: (id: number) => salesApiClient.delete<void>({ url: `/orderitems/${id}` }),

	getPayments: (orderId: number) => salesApiClient.get<Payment[]>({ url: `/orders/${orderId}/payments` }),
	createPayment: (data: PaymentCreateDto) => salesApiClient.post<Payment>({ url: "/payments", data }),
};

export default salesService;
