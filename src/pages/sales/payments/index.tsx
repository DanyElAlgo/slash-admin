import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import salesService from "@/api/services/salesService";
import { useCurrentBusiness } from "@/store/userStore";
import type { OrderTicket, Payment, PaymentType } from "@/types/entity";
import { Card } from "@/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";

export default function PaymentsPage() {
	const business = useCurrentBusiness();
	const [orders, setOrders] = useState<OrderTicket[]>([]);
	const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
	const [payments, setPayments] = useState<Payment[]>([]);
	const [selectedOrderId, setSelectedOrderId] = useState<string>("");
	const [loading, setLoading] = useState(false);

	const paymentTypeMap = useMemo(() => new Map(paymentTypes.map((type) => [type.id, type.name])), [paymentTypes]);

	const loadOrdersAndTypes = useCallback(async () => {
		setLoading(true);
		try {
			const [ordersData, typesData] = await Promise.all([salesService.getOrders(), salesService.getPaymentTypes()]);
			setOrders(ordersData);
			setPaymentTypes(typesData);
		} catch {
			toast.error("Failed to load orders and payment types.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void loadOrdersAndTypes();
	}, [loadOrdersAndTypes]);

	useEffect(() => {
		const orderId = Number(selectedOrderId);
		if (!selectedOrderId || !Number.isFinite(orderId)) {
			setPayments([]);
			return;
		}

		setLoading(true);
		void salesService
			.getPayments(orderId)
			.then((data) => setPayments(data))
			.catch(() => toast.error("Failed to load payments."))
			.finally(() => setLoading(false));
	}, [selectedOrderId]);

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-3xl font-bold">Payments</h1>
				<p className="text-text-secondary mt-1">
					Payment history for <span className="font-semibold text-text-primary">{business?.name ?? "—"}</span>
				</p>
			</div>

			<Card className="p-6 space-y-4">
				<div>
					<Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
						<SelectTrigger className="max-w-xs">
							<SelectValue placeholder="Select an order" />
						</SelectTrigger>
						<SelectContent>
							{orders.map((order) => (
								<SelectItem key={order.id} value={String(order.id)}>
									#{order.id} {order.customerName ? `- ${order.customerName}` : ""}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Payment #</TableHead>
							<TableHead>Order #</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Paid At</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell className="col-span-4 text-center py-6">Loading...</TableCell>
							</TableRow>
						) : payments.length === 0 ? (
							<TableRow>
								<TableCell className="col-span-4 text-center py-6 text-text-secondary">
									No payments recorded yet.
								</TableCell>
							</TableRow>
						) : (
							payments.map((payment) => (
								<TableRow key={payment.id}>
									<TableCell>#{payment.id}</TableCell>
									<TableCell>#{payment.orderId}</TableCell>
									<TableCell>{payment.paymentTypeName || paymentTypeMap.get(payment.paymentTypeId) || "—"}</TableCell>
									<TableCell>{payment.paidAt || "—"}</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</Card>
		</div>
	);
}
