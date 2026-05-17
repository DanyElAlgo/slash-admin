import { useEffect, useState } from "react";
import BusinessGate from "@/components/business-gate";
import inventoryService from "@/api/services/inventoryService";
import { useCurrentBusiness } from "@/store/userStore";
import type { StockItem } from "@/types/entity";
import { Badge } from "@/ui/badge";
import { Card } from "@/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";

export default function Stock() {
	const business = useCurrentBusiness();
	const [stockItems, setStockItems] = useState<StockItem[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let isMounted = true;
		const loadStock = async () => {
			if (!business?.companyCen) {
				if (!isMounted) return;
				setStockItems([]);
				setLoading(false);
				return;
			}

			setLoading(true);
			try {
				const stockData = await inventoryService.getStock(business.companyCen);
				if (!isMounted) return;
				setStockItems(stockData);
			} catch {
				if (!isMounted) return;
				setStockItems([]);
			} finally {
				if (isMounted) setLoading(false);
			}
		};

		void loadStock();

		return () => {
			isMounted = false;
		};
	}, [business?.companyCen]);

	const lowStockCount = stockItems.filter((item) => item.isLowStock).length;
	const totalStock = stockItems.reduce((sum, item) => sum + item.availableQuantity, 0);

	return (
		<BusinessGate>
			<div className="space-y-6 p-6">
				<div>
					<h1 className="text-3xl font-bold">Stock Management</h1>
					<p className="font-semibold text-text-primary">
						Check the available stock of each product per warehouse for{" "}
						<span className="text-primary">{business?.name ?? "—"}</span>.
					</p>
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<Card className="p-6">
						<div className="text-sm font-medium text-text-secondary">Warehouse-Product Entries</div>
						<div className="mt-2 text-3xl font-bold">{stockItems.length}</div>
					</Card>
					<Card className="p-6">
						<div className="text-sm font-medium text-text-secondary">Total Units in Stock</div>
						<div className="mt-2 text-3xl font-bold">{totalStock}</div>
					</Card>
					<Card className="p-6">
						<div className="text-sm font-medium text-text-secondary">Low Stock Items</div>
						<div className="mt-2 text-3xl font-bold text-warning">{lowStockCount}</div>
					</Card>
				</div>

				<Card>
					<div className="p-6">
						<h2 className="text-xl font-semibold mb-4">Warehouse Stock</h2>
						<Table>
							<TableHeader>
								<TableRow className="grid-cols-6 items-center">
									<TableHead className="col-span-1">Product</TableHead>
									<TableHead className="col-span-1">Warehouse</TableHead>
									<TableHead className="col-span-1">Available</TableHead>
									<TableHead className="col-span-1">Reserved</TableHead>
									<TableHead className="col-span-1">Reorder Level</TableHead>
									<TableHead className="col-span-1">Condition</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{loading ? (
									<TableRow>
										<TableCell className="col-span-6 text-center py-8 text-text-secondary">
											Loading stock data...
										</TableCell>
									</TableRow>
								) : stockItems.length === 0 ? (
									<TableRow>
										<TableCell className="col-span-full text-center py-8 text-text-secondary">
											No stock data available.
										</TableCell>
									</TableRow>
								) : (
									stockItems.map((item) => (
										<TableRow className="grid-cols-6 items-center" key={`${item.productCen}-${item.warehouseCen}`}>
											<TableCell className="col-span-1 font-medium">{item.productName}</TableCell>
											<TableCell className="col-span-1">{item.warehouseName}</TableCell>
											<TableCell className="col-span-1">{item.availableQuantity}</TableCell>
											<TableCell className="col-span-1">{item.reservedQuantity}</TableCell>
											<TableCell className="col-span-1">{item.reorderLevel}</TableCell>
											<TableCell className="col-span-1">
												{item.isLowStock ? (
													<Badge className="bg-warning text-white">Low Stock</Badge>
												) : (
													<Badge className="bg-success text-white">OK</Badge>
												)}
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
				</Card>
			</div>
		</BusinessGate>
	);
}
