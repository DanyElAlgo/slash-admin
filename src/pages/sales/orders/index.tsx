import { Eye, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import salesService, { type OrderCreateDto } from "@/api/services/salesService";
import type { Customer, OrderItem, OrderStatus, OrderTicket } from "@/types/entity";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Label } from "@/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";

export default function OrdersPage() {
	const [orders, setOrders] = useState<OrderTicket[]>([]);
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [statuses, setStatuses] = useState<OrderStatus[]>([]);
	const [loading, setLoading] = useState(true);

	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
	const [selectedOrder, setSelectedOrder] = useState<OrderTicket | null>(null);
	const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
	const [loadingItems, setLoadingItems] = useState(false);

	const [formData, setFormData] = useState<OrderCreateDto>({ customerId: 0, statusId: undefined });

	const loadData = useCallback(async () => {
		setLoading(true);
		try {
			const [ordersData, customersData, statusesData] = await Promise.all([
				salesService.getOrders(),
				salesService.getCustomers(),
				salesService.getOrderStatuses(),
			]);
			setOrders(ordersData);
			setCustomers(customersData);
			setStatuses(statusesData);
		} catch (error) {
			toast.error("Failed to load orders");
			console.error(error);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const customerMap = useMemo(() => new Map(customers.map((c) => [c.id, c.name])), [customers]);
	const statusMap = useMemo(() => new Map(statuses.map((s) => [s.id, s.name])), [statuses]);

	const stats = useMemo(() => {
		const total = orders.length;
		const pending = orders.filter((o) => {
			const name = (o.statusName || statusMap.get(o.statusId) || "").toLowerCase();
			return name.includes("pending") || name.includes("open") || name.includes("pendiente");
		}).length;
		const completed = orders.filter((o) => {
			const name = (o.statusName || statusMap.get(o.statusId) || "").toLowerCase();
			return name.includes("completed") || name.includes("paid") || name.includes("closed");
		}).length;
		return { total, pending, completed };
	}, [orders, statusMap]);

	const handleViewDetails = async (order: OrderTicket) => {
		setSelectedOrder(order);
		setIsDetailDialogOpen(true);
		setLoadingItems(true);
		try {
			const items = await salesService.getOrderItems(order.id);
			setOrderItems(items);
		} catch (error) {
			toast.error("Failed to load order items");
			console.error(error);
		} finally {
			setLoadingItems(false);
		}
	};

	const handleCreate = async () => {
		if (!formData.customerId) {
			toast.error("Please select a customer");
			return;
		}
		try {
			await salesService.createOrder(formData);
			toast.success("Order created successfully");
			setIsCreateDialogOpen(false);
			setFormData({ customerId: 0, statusId: undefined });
			loadData();
		} catch (error) {
			toast.error("Failed to create order");
			console.error(error);
		}
	};

	const handleDelete = async (id: number) => {
		if (!confirm("Are you sure you want to delete this order?")) return;
		try {
			await salesService.deleteOrder(id);
			toast.success("Order deleted successfully");
			loadData();
		} catch (error) {
			toast.error("Failed to delete order");
			console.error(error);
		}
	};

	const getStatusBadge = (order: OrderTicket) => {
		const name = order.statusName || statusMap.get(order.statusId) || "Unknown";
		const lower = name.toLowerCase();
		let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
		if (lower.includes("completed") || lower.includes("paid")) variant = "default";
		else if (lower.includes("pending") || lower.includes("open")) variant = "secondary";
		else if (lower.includes("cancelled") || lower.includes("cancelado")) variant = "destructive";
		return <Badge variant={variant}>{name}</Badge>;
	};

	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Orders</h1>
				<Button onClick={() => setIsCreateDialogOpen(true)}>
					<Plus className="mr-2 h-4 w-4" />
					New Order
				</Button>
			</div>

			<div className="grid grid-cols-3 gap-4">
				<Card className="p-6">
					<div className="text-sm font-medium text-muted-foreground">Total Orders</div>
					<div className="mt-2 text-3xl font-bold">{stats.total}</div>
				</Card>
				<Card className="p-6">
					<div className="text-sm font-medium text-muted-foreground">Pending</div>
					<div className="mt-2 text-3xl font-bold text-yellow-600">{stats.pending}</div>
				</Card>
				<Card className="p-6">
					<div className="text-sm font-medium text-muted-foreground">Completed</div>
					<div className="mt-2 text-3xl font-bold text-green-600">{stats.completed}</div>
				</Card>
			</div>

			<Card>
				<Table>
					<TableHeader>
						<TableRow className="grid-cols-4">
							<TableHead>Order #</TableHead>
							<TableHead>Customer</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="w-32 text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell className="col-span-4 text-center py-8">Loading...</TableCell>
							</TableRow>
						) : orders.length === 0 ? (
							<TableRow>
								<TableCell className="col-span-4 text-center py-8 text-muted-foreground">
									No orders yet. Create one to get started.
								</TableCell>
							</TableRow>
						) : (
							orders.map((order) => (
								<TableRow className="grid-cols-4" key={order.id}>
									<TableCell className="font-medium">#{order.id}</TableCell>
									<TableCell>{order.customerName || customerMap.get(order.customerId) || "—"}</TableCell>
									<TableCell>{getStatusBadge(order)}</TableCell>
									<TableCell className="text-right space-x-2">
										<Button variant="ghost" size="sm" onClick={() => handleViewDetails(order)}>
											<Eye className="h-4 w-4" />
										</Button>
										<Button variant="ghost" size="sm" onClick={() => handleDelete(order.id)}>
											<Trash2 className="h-4 w-4" />
										</Button>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</Card>

			<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>New Order</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label>Customer *</Label>
							<Select
								value={formData.customerId ? formData.customerId.toString() : ""}
								onValueChange={(v) => setFormData({ ...formData, customerId: Number(v) })}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select customer..." />
								</SelectTrigger>
								<SelectContent>
									{customers.map((c) => (
										<SelectItem key={c.id} value={c.id.toString()}>
											{c.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>Status</Label>
							<Select
								value={formData.statusId?.toString() || ""}
								onValueChange={(v) => setFormData({ ...formData, statusId: Number(v) })}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select status..." />
								</SelectTrigger>
								<SelectContent>
									{statuses.map((s) => (
										<SelectItem key={s.id} value={s.id.toString()}>
											{s.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex gap-2 justify-end">
							<Button
								variant="outline"
								onClick={() => {
									setIsCreateDialogOpen(false);
									setFormData({ customerId: 0, statusId: undefined });
								}}
							>
								Cancel
							</Button>
							<Button onClick={handleCreate}>Create</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Order #{selectedOrder?.id}</DialogTitle>
					</DialogHeader>
					{selectedOrder && (
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4 text-sm">
								<div>
									<span className="text-muted-foreground">Customer:</span>
									<p className="font-medium">
										{selectedOrder.customerName || customerMap.get(selectedOrder.customerId) || "—"}
									</p>
								</div>
								<div>
									<span className="text-muted-foreground">Status:</span>
									<p className="mt-1">{getStatusBadge(selectedOrder)}</p>
								</div>
							</div>

							<Card>
								<CardHeader className="pb-2">
									<CardTitle className="text-sm">Items</CardTitle>
								</CardHeader>
								<CardContent>
									{loadingItems ? (
										<p className="text-sm text-muted-foreground">Loading items...</p>
									) : orderItems.length === 0 ? (
										<p className="text-sm text-muted-foreground">No items in this order.</p>
									) : (
										<Table>
											<TableHeader>
												<TableRow className="text-xs">
													<TableHead>Product</TableHead>
													<TableHead className="text-right">Qty</TableHead>
													<TableHead className="text-right">Price</TableHead>
													<TableHead>Note</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{orderItems.map((item) => (
													<TableRow key={item.id} className="text-sm">
														<TableCell>{item.productName || item.productCen || "—"}</TableCell>
														<TableCell className="text-right">{item.qty}</TableCell>
														<TableCell className="text-right">${item.unitPrice?.toFixed(2) ?? "—"}</TableCell>
														<TableCell className="text-xs text-muted-foreground">
															{item.additionalNote || "—"}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									)}
								</CardContent>
							</Card>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
