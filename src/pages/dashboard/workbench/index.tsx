import { useEffect, useState } from "react";
import { toast } from "sonner";
import dashboardService from "@/api/services/dashboardService";
import inventoryService from "@/api/services/inventoryService";
import { useCurrentBusiness } from "@/store/userStore";
import type {
	DailySalesDashboard,
	InventoryDashboard,
	KdsStatusDashboard,
	StockItem,
	TopProductDashboard,
} from "@/types/entity";
import { Badge } from "@/ui/badge";
import { Card } from "@/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";

export default function Workbench() {
	const business = useCurrentBusiness();

	const [inventoryDashboard, setInventoryDashboard] = useState<InventoryDashboard | null>(null);
	const [outOfStock, setOutOfStock] = useState<StockItem[]>([]);
	const [lowStock, setLowStock] = useState<StockItem[]>([]);

	const [salesDashboard, setSalesDashboard] = useState<DailySalesDashboard | null>(null);
	const [topProducts, setTopProducts] = useState<TopProductDashboard[]>([]);
	const [kdsStatus, setKdsStatus] = useState<KdsStatusDashboard | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!business?.companyCen) {
			setInventoryDashboard(null);
			setOutOfStock([]);
			setLowStock([]);
			setSalesDashboard(null);
			setTopProducts([]);
			setKdsStatus(null);
			setLoading(false);
			return;
		}

		let isMounted = true;
		const load = async () => {
			setLoading(true);
			try {
				const [inv, stock, sales, top, kds] = await Promise.all([
					inventoryService.getDashboard(business.companyCen),
					inventoryService.getStock(business.companyCen),
					dashboardService.getSalesDashboard(business.companyCen),
					dashboardService.getTopProducts(business.companyCen),
					dashboardService.getKdsStatusSummary(business.companyCen),
				]);
				if (!isMounted) return;
				setInventoryDashboard(inv);
				setOutOfStock(stock.filter((item) => item.availableQuantity === 0));
				setLowStock(stock.filter((item) => item.isLowStock && item.availableQuantity > 0));
				setSalesDashboard(sales);
				setTopProducts(top);
				setKdsStatus(kds);
			} catch {
				if (isMounted) toast.error("Failed to load dashboard data");
			} finally {
				if (isMounted) setLoading(false);
			}
		};

		void load();
		return () => {
			isMounted = false;
		};
	}, [business?.companyCen]);

	return (
		<div className="flex flex-col gap-6 w-full">
			<div>
				<h1 className="text-3xl font-bold">Dashboard</h1>
				<p className="text-text-secondary mt-1">
					Company: <span className="font-semibold text-text-primary">{business?.name ?? "—"}</span>
				</p>
			</div>

			<div>
				<h2 className="text-lg font-semibold mb-3">Today's Sales</h2>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<Card className="p-6">
						<div className="text-sm font-medium text-text-secondary">Total Sold</div>
						<div className="mt-2 text-3xl font-bold text-green-600">
							{loading ? "..." : `$${(salesDashboard?.totalSales ?? 0).toFixed(2)}`}
						</div>
					</Card>
					<Card className="p-6">
						<div className="text-sm font-medium text-text-secondary">Paid Tickets</div>
						<div className="mt-2 text-3xl font-bold">{loading ? "..." : (salesDashboard?.ticketsCount ?? 0)}</div>
					</Card>
					<Card className="p-6">
						<div className="text-sm font-medium text-text-secondary">Average Ticket</div>
						<div className="mt-2 text-3xl font-bold">
							{loading ? "..." : `$${(salesDashboard?.averageTicket ?? 0).toFixed(2)}`}
						</div>
					</Card>
				</div>
			</div>

			<div>
				<h2 className="text-lg font-semibold mb-3">Order Status (KDS)</h2>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<Card className="p-6">
						<div className="text-sm font-medium text-text-secondary">Pending</div>
						<div className="mt-2 text-3xl font-bold text-amber-500">
							{loading ? "..." : (kdsStatus?.pendingCount ?? 0)}
						</div>
					</Card>
					<Card className="p-6">
						<div className="text-sm font-medium text-text-secondary">In Preparation</div>
						<div className="mt-2 text-3xl font-bold text-blue-500">
							{loading ? "..." : (kdsStatus?.preparingCount ?? 0)}
						</div>
					</Card>
					<Card className="p-6">
						<div className="text-sm font-medium text-text-secondary">Ready</div>
						<div className="mt-2 text-3xl font-bold text-green-500">
							{loading ? "..." : (kdsStatus?.readyCount ?? 0)}
						</div>
					</Card>
				</div>
			</div>

			<div>
				<h2 className="text-lg font-semibold mb-3">Best-Selling Products</h2>
				<Card>
					{loading ? (
						<div className="p-6 text-muted-foreground">Loading...</div>
					) : topProducts.length === 0 ? (
						<div className="p-6 text-muted-foreground text-sm">No sales data yet.</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>#</TableHead>
									<TableHead>Product</TableHead>
									<TableHead className="text-right">Qty Sold</TableHead>
									<TableHead className="text-right">Unit Price</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{topProducts.map((p, idx) => (
									<TableRow key={p.productCen}>
										<TableCell className="text-muted-foreground">{idx + 1}</TableCell>
										<TableCell className="font-medium">{p.productName}</TableCell>
										<TableCell className="text-right">{p.totalQuantity}</TableCell>
										<TableCell className="text-right">${p.salePrice.toFixed(2)}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</Card>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div>
					<h2 className="text-lg font-semibold mb-3">
						Out of Stock <Badge variant="destructive">{outOfStock.length}</Badge>
					</h2>
					<Card>
						{loading ? (
							<div className="p-6 text-muted-foreground">Loading...</div>
						) : outOfStock.length === 0 ? (
							<div className="p-6 text-muted-foreground text-sm">No out-of-stock products.</div>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Product</TableHead>
										<TableHead>Warehouse</TableHead>
										<TableHead className="text-right">Stock</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{outOfStock.map((item) => (
										<TableRow key={`${item.productCen}-${item.warehouseCen}`}>
											<TableCell className="font-medium">{item.productName}</TableCell>
											<TableCell className="text-muted-foreground">{item.warehouseName}</TableCell>
											<TableCell className="text-right">
												<Badge variant="destructive">0</Badge>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</Card>
				</div>

				<div>
					<h2 className="text-lg font-semibold mb-3">
						Low Stock{" "}
						<Badge variant="outline" className="text-amber-600 border-amber-400">
							{lowStock.length}
						</Badge>
					</h2>
					<Card>
						{loading ? (
							<div className="p-6 text-muted-foreground">Loading...</div>
						) : lowStock.length === 0 ? (
							<div className="p-6 text-muted-foreground text-sm">No low-stock products.</div>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Product</TableHead>
										<TableHead>Warehouse</TableHead>
										<TableHead className="text-right">Stock</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{lowStock.map((item) => (
										<TableRow key={`${item.productCen}-${item.warehouseCen}`}>
											<TableCell className="font-medium">{item.productName}</TableCell>
											<TableCell className="text-muted-foreground">{item.warehouseName}</TableCell>
											<TableCell className="text-right">
												<Badge variant="outline" className="text-amber-600 border-amber-400">
													{item.availableQuantity}
												</Badge>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</Card>
				</div>
			</div>

			<div>
				<h2 className="text-lg font-semibold mb-3">General Inventory</h2>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
					<Card className="p-6">
						<div className="text-sm font-medium text-text-secondary">Products</div>
						<div className="mt-2 text-3xl font-bold">{loading ? "..." : (inventoryDashboard?.totalProducts ?? 0)}</div>
					</Card>
					<Card className="p-6">
						<div className="text-sm font-medium text-text-secondary">Units in Stock</div>
						<div className="mt-2 text-3xl font-bold">
							{loading ? "..." : (inventoryDashboard?.totalStockQuantity ?? 0)}
						</div>
					</Card>
					<Card className="p-6">
						<div className="text-sm font-medium text-text-secondary">Low Stock Items</div>
						<div className="mt-2 text-3xl font-bold text-warning">
							{loading ? "..." : (inventoryDashboard?.lowStockCount ?? 0)}
						</div>
					</Card>
					<Card className="p-6">
						<div className="text-sm font-medium text-text-secondary">Out of Stock</div>
						<div className="mt-2 text-3xl font-bold text-destructive">
							{loading ? "..." : (inventoryDashboard?.outOfStockCount ?? 0)}
						</div>
					</Card>
				</div>
			</div>
		</div>
	);
}
