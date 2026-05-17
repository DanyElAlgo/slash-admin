import { useEffect, useState } from "react";
import { toast } from "sonner";
import inventoryService from "@/api/services/inventoryService";
import dashboardService from "@/api/services/dashboardService";
import { useCurrentBusiness } from "@/store/userStore";
import type {
	DailySalesDashboard,
	KdsStatusDashboard,
	StockAlertsDashboard,
	TopProductDashboard,
} from "@/types/entity";
import { Card } from "@/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { Badge } from "@/ui/badge";

export default function Workbench() {
	const business = useCurrentBusiness();

	const [productCount, setProductCount] = useState(0);
	const [totalStock, setTotalStock] = useState(0);
	const [lowStockCount, setLowStockCount] = useState(0);

	const [salesDashboard, setSalesDashboard] = useState<DailySalesDashboard | null>(null);
	const [topProducts, setTopProducts] = useState<TopProductDashboard[]>([]);
	const [stockAlerts, setStockAlerts] = useState<StockAlertsDashboard | null>(null);
	const [kdsStatus, setKdsStatus] = useState<KdsStatusDashboard | null>(null);
	const [dashLoading, setDashLoading] = useState(true);

	useEffect(() => {
		let isMounted = true;
		const loadInventory = async () => {
			if (!business?.companyCen) {
				if (!isMounted) return;
				setProductCount(0);
				setTotalStock(0);
				setLowStockCount(0);
				return;
			}
			try {
				const [productsData, stockData] = await Promise.all([
					inventoryService.getProducts(business.companyCen),
					inventoryService.getStock(business.companyCen),
				]);
				if (!isMounted) return;
				setProductCount(productsData.length);
				setTotalStock(stockData.reduce((sum, item) => sum + item.availableQuantity, 0));
				setLowStockCount(stockData.filter((item) => item.isLowStock).length);
			} catch {
				// ignore
			}
		};
		void loadInventory();
		return () => {
			isMounted = false;
		};
	}, [business?.companyCen]);

	useEffect(() => {
		if (!business?.companyCen) return;
		let isMounted = true;
		const loadDashboard = async () => {
			setDashLoading(true);
			try {
				const [sales, top, alerts, kds] = await Promise.all([
					dashboardService.getSalesDashboard(business.companyCen!),
					dashboardService.getTopProducts(business.companyCen!),
					dashboardService.getStockAlerts(),
					dashboardService.getKdsStatusSummary(business.companyCen!),
				]);
				if (!isMounted) return;
				setSalesDashboard(sales);
				setTopProducts(top);
				setStockAlerts(alerts);
				setKdsStatus(kds);
			} catch {
				toast.error("Failed to load dashboard data");
			} finally {
				if (isMounted) setDashLoading(false);
			}
		};
		void loadDashboard();
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
							{dashLoading ? "..." : `$${(salesDashboard?.totalSales ?? 0).toFixed(2)}`}
						</div>
					</Card>
					<Card className="p-6">
						<div className="text-sm font-medium text-text-secondary">Paid Tickets</div>
						<div className="mt-2 text-3xl font-bold">{dashLoading ? "..." : (salesDashboard?.ticketsCount ?? 0)}</div>
					</Card>
					<Card className="p-6">
						<div className="text-sm font-medium text-text-secondary">Average Ticket</div>
						<div className="mt-2 text-3xl font-bold">
							{dashLoading ? "..." : `$${(salesDashboard?.averageTicket ?? 0).toFixed(2)}`}
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
							{dashLoading ? "..." : (kdsStatus?.pendingCount ?? 0)}
						</div>
					</Card>
					<Card className="p-6">
						<div className="text-sm font-medium text-text-secondary">In Preparation</div>
						<div className="mt-2 text-3xl font-bold text-blue-500">
							{dashLoading ? "..." : (kdsStatus?.preparingCount ?? 0)}
						</div>
					</Card>
					<Card className="p-6">
						<div className="text-sm font-medium text-text-secondary">Ready</div>
						<div className="mt-2 text-3xl font-bold text-green-500">
							{dashLoading ? "..." : (kdsStatus?.readyCount ?? 0)}
						</div>
					</Card>
				</div>
			</div>

			<div>
				<h2 className="text-lg font-semibold mb-3">Best-Selling Products</h2>
				<Card>
					{dashLoading ? (
						<div className="p-6 text-muted-foreground">Loading...</div>
					) : topProducts.length === 0 ? (
						<div className="p-6 text-muted-foreground text-sm">No sales data yet.</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow className="grid-cols-4">
									<TableHead>#</TableHead>
									<TableHead>Product</TableHead>
									<TableHead className="text-right">Qty Sold</TableHead>
									<TableHead className="text-right">Unit Price</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{topProducts.map((p, idx) => (
									<TableRow className="grid-cols-4" key={p.productCen}>
										<TableCell className="text-muted-foreground">{idx + 1}</TableCell>
										<TableCell className="font-medium">{p.productName}</TableCell>
										<TableCell className="text-right">{p.totalQuantity.toFixed(1)}</TableCell>
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
						Out of Stock <Badge variant="destructive">{stockAlerts?.outOfStock.length ?? 0}</Badge>
					</h2>
					<Card>
						{dashLoading ? (
							<div className="p-6 text-muted-foreground">Loading...</div>
						) : !stockAlerts?.outOfStock.length ? (
							<div className="p-6 text-muted-foreground text-sm">No out-of-stock products.</div>
						) : (
							<Table>
								<TableHeader>
									<TableRow className="grid-cols-3">
										<TableHead>Product</TableHead>
										<TableHead>Warehouse</TableHead>
										<TableHead className="text-right">Stock</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{stockAlerts.outOfStock.map((item, idx) => (
										<TableRow className="grid-cols-3" key={idx}>
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
							{stockAlerts?.lowStock.length ?? 0}
						</Badge>
					</h2>
					<Card>
						{dashLoading ? (
							<div className="p-6 text-muted-foreground">Loading...</div>
						) : !stockAlerts?.lowStock.length ? (
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
									{stockAlerts.lowStock.map((item, idx) => (
										<TableRow key={idx}>
											<TableCell className="font-medium">{item.productName}</TableCell>
											<TableCell className="text-muted-foreground">{item.warehouseName}</TableCell>
											<TableCell className="text-right">
												<Badge variant="outline" className="text-amber-600 border-amber-400">
													{item.stockLeft}
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
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<Card className="p-6">
						<div className="text-sm font-medium text-text-secondary">Products</div>
						<div className="mt-2 text-3xl font-bold">{productCount}</div>
					</Card>
					<Card className="p-6">
						<div className="text-sm font-medium text-text-secondary">Units in Stock</div>
						<div className="mt-2 text-3xl font-bold">{totalStock}</div>
					</Card>
					<Card className="p-6">
						<div className="text-sm font-medium text-text-secondary">Low Stock Items</div>
						<div className="mt-2 text-3xl font-bold text-warning">{lowStockCount}</div>
					</Card>
				</div>
			</div>
		</div>
	);
}
