import { CheckCircle2, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import inventoryService from "@/api/services/inventoryService";
import purchasesService from "@/api/services/purchasesService";
import BusinessGate from "@/components/business-gate";
import { useCurrentBusiness } from "@/store/userStore";
import {
	type CreatePurchaseOrderItem,
	type PagedResultDto,
	type Product,
	type PurchaseOrderDetail,
	type PurchaseOrderListItem,
	PurchaseStatus,
	type Supplier,
	type Warehouse,
} from "@/types/entity";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";

const STATUS_LABEL: Record<PurchaseStatus, string> = {
	[PurchaseStatus.Pending]: "Pending",
	[PurchaseStatus.Confirmed]: "Confirmed",
	[PurchaseStatus.Cancelled]: "Cancelled",
};

const STATUS_VARIANT: Record<PurchaseStatus, "default" | "secondary" | "destructive" | "outline"> = {
	[PurchaseStatus.Pending]: "outline",
	[PurchaseStatus.Confirmed]: "default",
	[PurchaseStatus.Cancelled]: "destructive",
};

const PAGE_SIZE = 20;
const STATUS_FILTER_ALL = "all" as const;

function formatDate(iso?: string | null) {
	if (!iso) return "—";
	const d = new Date(iso);
	return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

type DraftItem = { productCen: string; quantity: string };

const EMPTY_DRAFT_ITEM: DraftItem = { productCen: "", quantity: "1" };

export default function PurchaseOrdersPage() {
	const business = useCurrentBusiness();

	const [orders, setOrders] = useState<PagedResultDto<PurchaseOrderListItem> | null>(null);
	const [suppliers, setSuppliers] = useState<Supplier[]>([]);
	const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);

	const [statusFilter, setStatusFilter] = useState<string>(STATUS_FILTER_ALL);
	const [page, setPage] = useState(1);

	const [createOpen, setCreateOpen] = useState(false);
	const [createSupplier, setCreateSupplier] = useState("");
	const [createWarehouse, setCreateWarehouse] = useState("");
	const [createItems, setCreateItems] = useState<DraftItem[]>([{ ...EMPTY_DRAFT_ITEM }]);
	const [creating, setCreating] = useState(false);

	const [detailCen, setDetailCen] = useState<string | null>(null);
	const [detail, setDetail] = useState<PurchaseOrderDetail | null>(null);
	const [detailLoading, setDetailLoading] = useState(false);
	const [actionLoading, setActionLoading] = useState(false);

	const loadOrders = useCallback(async () => {
		if (!business?.companyCen) return;
		setLoading(true);
		try {
			const result = await purchasesService.listOrders(business.companyCen, {
				status: statusFilter === STATUS_FILTER_ALL ? undefined : (Number(statusFilter) as PurchaseStatus),
				page,
				pageSize: PAGE_SIZE,
				sortDescending: true,
			});
			setOrders(result);
		} catch {
			toast.error("Failed to load purchase orders.");
		} finally {
			setLoading(false);
		}
	}, [business?.companyCen, page, statusFilter]);

	const loadReferenceData = useCallback(async () => {
		if (!business?.companyCen) return;
		try {
			const [suppliersData, warehousesData, productsData] = await Promise.all([
				purchasesService.listSuppliers(business.companyCen),
				inventoryService.getWarehouses(business.companyCen),
				inventoryService.getProducts(business.companyCen),
			]);
			setSuppliers(suppliersData ?? []);
			setWarehouses(warehousesData ?? []);
			setProducts(productsData ?? []);
		} catch {
			toast.error("Failed to load suppliers / warehouses / products.");
		}
	}, [business?.companyCen]);

	useEffect(() => {
		void loadOrders();
	}, [loadOrders]);

	useEffect(() => {
		void loadReferenceData();
	}, [loadReferenceData]);

	useEffect(() => {
		if (!detailCen || !business?.companyCen) {
			setDetail(null);
			return;
		}
		let cancelled = false;
		(async () => {
			setDetailLoading(true);
			try {
				const result = await purchasesService.getOrder(business.companyCen, detailCen);
				if (!cancelled) setDetail(result);
			} catch {
				if (!cancelled) toast.error("Failed to load order detail.");
			} finally {
				if (!cancelled) setDetailLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [detailCen, business?.companyCen]);

	const totalPages = orders?.totalPages ?? 1;

	const handleStatusFilterChange = (value: string) => {
		setStatusFilter(value);
		setPage(1);
	};

	const handleResetCreateForm = () => {
		setCreateSupplier("");
		setCreateWarehouse("");
		setCreateItems([{ ...EMPTY_DRAFT_ITEM }]);
	};

	const handleAddDraftItem = () => setCreateItems((prev) => [...prev, { ...EMPTY_DRAFT_ITEM }]);

	const handleRemoveDraftItem = (index: number) =>
		setCreateItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));

	const handleDraftItemChange = (index: number, patch: Partial<DraftItem>) =>
		setCreateItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));

	const handleCreate = async () => {
		if (!business?.companyCen) return;
		if (!createSupplier || !createWarehouse) {
			toast.error("Supplier and warehouse are required.");
			return;
		}
		const payloadItems: CreatePurchaseOrderItem[] = [];
		for (const item of createItems) {
			if (!item.productCen) {
				toast.error("Every line must select a product.");
				return;
			}
			const qty = Number(item.quantity);
			if (!Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty)) {
				toast.error("Each quantity must be a positive integer.");
				return;
			}
			payloadItems.push({ productCen: item.productCen, quantity: qty });
		}

		setCreating(true);
		try {
			await purchasesService.createOrder(business.companyCen, {
				supplierCen: createSupplier,
				warehouseCen: createWarehouse,
				items: payloadItems,
			});
			toast.success("Purchase order created.");
			setCreateOpen(false);
			handleResetCreateForm();
			setPage(1);
			await loadOrders();
		} catch {
			// apiClient already toasts the error response
		} finally {
			setCreating(false);
		}
	};

	const handleConfirm = async () => {
		if (!business?.companyCen || !detailCen) return;
		setActionLoading(true);
		try {
			await purchasesService.confirmOrder(business.companyCen, detailCen);
			toast.success("Order confirmed. Stock updated.");
			const refreshed = await purchasesService.getOrder(business.companyCen, detailCen);
			setDetail(refreshed);
			await loadOrders();
		} catch {
			// apiClient already toasts
		} finally {
			setActionLoading(false);
		}
	};

	const handleCancel = async () => {
		if (!business?.companyCen || !detailCen) return;
		setActionLoading(true);
		try {
			await purchasesService.cancelOrder(business.companyCen, detailCen);
			toast.success("Order cancelled.");
			const refreshed = await purchasesService.getOrder(business.companyCen, detailCen);
			setDetail(refreshed);
			await loadOrders();
		} catch {
			// apiClient already toasts
		} finally {
			setActionLoading(false);
		}
	};

	const supplierByCen = useMemo(() => {
		const map = new Map<string, Supplier>();
		for (const s of suppliers) map.set(s.supplierCen, s);
		return map;
	}, [suppliers]);

	const productByCen = useMemo(() => {
		const map = new Map<string, Product>();
		for (const p of products) map.set(p.productCen, p);
		return map;
	}, [products]);

	return (
		<BusinessGate>
			<div className="space-y-6 p-6">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h1 className="text-3xl font-bold">Purchase Orders</h1>
						<p className="mt-1 text-text-secondary">
							Company: <span className="font-semibold text-text-primary">{business?.name ?? "—"}</span>
						</p>
					</div>
					<div className="flex gap-2">
						<Button variant="outline" onClick={() => void loadOrders()} disabled={loading}>
							<RefreshCw className="mr-2 h-4 w-4" /> Refresh
						</Button>
						<Button
							onClick={() => {
								handleResetCreateForm();
								setCreateOpen(true);
							}}
						>
							<Plus className="mr-2 h-4 w-4" /> New Order
						</Button>
					</div>
				</div>

				<Card className="p-6 space-y-4">
					<div className="flex flex-wrap items-center gap-3">
						<div className="min-w-[200px]">
							<Label className="text-xs uppercase">Status filter</Label>
							<Select value={statusFilter} onValueChange={handleStatusFilterChange}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={STATUS_FILTER_ALL}>All statuses</SelectItem>
									<SelectItem value={String(PurchaseStatus.Pending)}>Pending</SelectItem>
									<SelectItem value={String(PurchaseStatus.Confirmed)}>Confirmed</SelectItem>
									<SelectItem value={String(PurchaseStatus.Cancelled)}>Cancelled</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="ml-auto text-xs text-muted-foreground">
							{orders ? `${orders.totalCount} total · page ${orders.currentPage} of ${orders.totalPages}` : ""}
						</div>
					</div>

					<Table>
						<TableHeader>
							<TableRow className="grid-cols-7 items-center">
								<TableHead className="col-span-1">Order</TableHead>
								<TableHead className="col-span-1">Supplier</TableHead>
								<TableHead className="col-span-1">Status</TableHead>
								<TableHead className="text-right col-span-1">Items</TableHead>
								<TableHead className="col-span-1">Created</TableHead>
								<TableHead className="col-span-1">Confirmed</TableHead>
								<TableHead className="text-right col-span-1">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{loading ? (
								<TableRow>
									<TableCell className="col-span-7 text-center py-6">Loading...</TableCell>
								</TableRow>
							) : !orders || orders.items.length === 0 ? (
								<TableRow>
									<TableCell className="col-span-7 text-center py-6 text-muted-foreground">
										No purchase orders yet.
									</TableCell>
								</TableRow>
							) : (
								orders.items.map((order) => (
									<TableRow className="grid-cols-7 items-center" key={order.orderCen}>
										<TableCell className="font-medium col-span-1">{order.orderCen}</TableCell>
										<TableCell className="col-span-1">
											{supplierByCen.get(order.supplierCen)?.name ?? order.supplierCen}
										</TableCell>
										<TableCell className="col-span-1">
											<Badge variant={STATUS_VARIANT[order.status]}>{STATUS_LABEL[order.status]}</Badge>
										</TableCell>
										<TableCell className="text-right col-span-1">{order.itemCount}</TableCell>
										<TableCell className="text-xs text-muted-foreground col-span-1">
											{formatDate(order.createdAt)}
										</TableCell>
										<TableCell className="text-xs text-muted-foreground col-span-1">
											{formatDate(order.confirmedAt)}
										</TableCell>
										<TableCell className="text-right col-span-1">
											<Button variant="ghost" size="sm" onClick={() => setDetailCen(order.orderCen)}>
												View
											</Button>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>

					{orders && orders.totalPages > 1 ? (
						<div className="flex items-center justify-end gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={page <= 1}
								onClick={() => setPage((p) => Math.max(1, p - 1))}
							>
								Previous
							</Button>
							<Button
								variant="outline"
								size="sm"
								disabled={page >= totalPages}
								onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
							>
								Next
							</Button>
						</div>
					) : null}
				</Card>
			</div>

			{/* Create dialog */}
			<Dialog
				open={createOpen}
				onOpenChange={(open) => {
					setCreateOpen(open);
					if (!open) handleResetCreateForm();
				}}
			>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>New Purchase Order</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
							<div>
								<Label>Supplier *</Label>
								<Select value={createSupplier} onValueChange={setCreateSupplier}>
									<SelectTrigger>
										<SelectValue placeholder="Select supplier" />
									</SelectTrigger>
									<SelectContent>
										{suppliers.map((s) => (
											<SelectItem key={s.supplierCen} value={s.supplierCen}>
												{s.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div>
								<Label>Warehouse *</Label>
								<Select value={createWarehouse} onValueChange={setCreateWarehouse}>
									<SelectTrigger>
										<SelectValue placeholder="Select warehouse" />
									</SelectTrigger>
									<SelectContent>
										{warehouses.map((w) => (
											<SelectItem key={w.warehouseCen} value={w.warehouseCen}>
												{w.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label>Items *</Label>
								<Button variant="ghost" size="sm" onClick={handleAddDraftItem}>
									<Plus className="mr-1 h-3 w-3" /> Add line
								</Button>
							</div>
							{createItems.map((item, index) => (
								<div key={index} className="grid grid-cols-12 items-end gap-2">
									<div className="col-span-7">
										<Select
											value={item.productCen}
											onValueChange={(value) => handleDraftItemChange(index, { productCen: value })}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select product" />
											</SelectTrigger>
											<SelectContent>
												{products.map((p) => (
													<SelectItem key={p.productCen} value={p.productCen}>
														{p.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="col-span-3">
										<Input
											type="number"
											min={1}
											step={1}
											value={item.quantity}
											onChange={(e) => handleDraftItemChange(index, { quantity: e.target.value })}
										/>
									</div>
									<div className="col-span-2 flex justify-end">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleRemoveDraftItem(index)}
											disabled={createItems.length === 1}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
							))}
						</div>

						<div className="flex justify-end gap-2">
							<Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
								Cancel
							</Button>
							<Button onClick={handleCreate} disabled={creating}>
								{creating ? "Creating..." : "Create"}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Detail dialog */}
			<Dialog
				open={!!detailCen}
				onOpenChange={(open) => {
					if (!open) {
						setDetailCen(null);
						setDetail(null);
					}
				}}
			>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>{detailCen ?? "Order"}</DialogTitle>
					</DialogHeader>
					{detailLoading ? (
						<div className="py-6 text-center text-muted-foreground">Loading...</div>
					) : !detail ? (
						<div className="py-6 text-center text-muted-foreground">Order not found.</div>
					) : (
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-3 text-sm">
								<div>
									<div className="text-xs uppercase text-muted-foreground">Status</div>
									<Badge variant={STATUS_VARIANT[detail.status]}>{STATUS_LABEL[detail.status]}</Badge>
								</div>
								<div>
									<div className="text-xs uppercase text-muted-foreground">Supplier</div>
									<div>{supplierByCen.get(detail.supplierCen)?.name ?? detail.supplierCen}</div>
								</div>
								<div>
									<div className="text-xs uppercase text-muted-foreground">Warehouse</div>
									<div>
										{warehouses.find((w) => w.warehouseCen === detail.warehouseCen)?.name ?? detail.warehouseCen}
									</div>
								</div>
								<div>
									<div className="text-xs uppercase text-muted-foreground">Created</div>
									<div>{formatDate(detail.createdAt)}</div>
								</div>
								<div className="col-span-2">
									<div className="text-xs uppercase text-muted-foreground">Confirmed</div>
									<div>{formatDate(detail.confirmedAt)}</div>
								</div>
							</div>

							<Table>
								<TableHeader>
									<TableRow className="grid-cols-2 items-center">
										<TableHead className="col-span-1">Product</TableHead>
										<TableHead className="text-right col-span-1">Quantity</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{detail.items.length === 0 ? (
										<TableRow>
											<TableCell className="col-span-2 text-center py-4 text-muted-foreground">No items.</TableCell>
										</TableRow>
									) : (
										detail.items.map((line) => (
											<TableRow className="grid-cols-2 items-center" key={line.productCen}>
												<TableCell className="col-span-1">
													{productByCen.get(line.productCen)?.name ?? line.productCen}
												</TableCell>
												<TableCell className="text-right col-span-1">{line.quantity}</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>

							{detail.status === PurchaseStatus.Pending ? (
								<div className="flex justify-end gap-2">
									<Button variant="outline" onClick={handleCancel} disabled={actionLoading}>
										<X className="mr-2 h-4 w-4" /> Cancel order
									</Button>
									<Button onClick={handleConfirm} disabled={actionLoading}>
										<CheckCircle2 className="mr-2 h-4 w-4" />
										{actionLoading ? "Confirming..." : "Confirm & receive stock"}
									</Button>
								</div>
							) : null}
						</div>
					)}
				</DialogContent>
			</Dialog>
		</BusinessGate>
	);
}
