import type { Customer, OrderItem, OrderStatus, OrderTicket, Payment, PaymentType } from "@/types/entity";
import apiClient from "../apiClient";

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
	getCustomers: () => apiClient.get<Customer[]>({ url: "/customers" }),
	getCustomer: (id: number) => apiClient.get<Customer>({ url: `/customers/${id}` }),
	createCustomer: (data: CustomerCreateDto) => apiClient.post<Customer>({ url: "/customers", data }),
	updateCustomer: (id: number, data: Partial<CustomerCreateDto>) =>
		apiClient.put<Customer>({ url: `/customers/${id}`, data }),
	deleteCustomer: (id: number) => apiClient.delete<void>({ url: `/customers/${id}` }),

	getOrderStatuses: () => apiClient.get<OrderStatus[]>({ url: "/orderstatuses" }),

	getPaymentTypes: () => apiClient.get<PaymentType[]>({ url: "/paymenttypes" }),

	getOrders: () => apiClient.get<OrderTicket[]>({ url: "/orders" }),
	getOrder: (id: number) => apiClient.get<OrderTicket>({ url: `/orders/${id}` }),
	createOrder: (data: OrderCreateDto) => apiClient.post<OrderTicket>({ url: "/orders", data }),
	updateOrder: (id: number, data: Partial<OrderCreateDto>) =>
		apiClient.put<OrderTicket>({ url: `/orders/${id}`, data }),
	deleteOrder: (id: number) => apiClient.delete<void>({ url: `/orders/${id}` }),

	getOrderItems: (orderId: number) => apiClient.get<OrderItem[]>({ url: `/orders/${orderId}/items` }),
	addOrderItem: (data: OrderItemCreateDto) => apiClient.post<OrderItem>({ url: "/orderitems", data }),
	updateOrderItem: (id: number, data: Partial<OrderItemCreateDto>) =>
		apiClient.put<OrderItem>({ url: `/orderitems/${id}`, data }),
	deleteOrderItem: (id: number) => apiClient.delete<void>({ url: `/orderitems/${id}` }),

	getPayments: (orderId: number) => apiClient.get<Payment[]>({ url: `/orders/${orderId}/payments` }),
	createPayment: (data: PaymentCreateDto) => apiClient.post<Payment>({ url: "/payments", data }),
};

export default salesService;
