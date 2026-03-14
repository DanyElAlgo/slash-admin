import { useEffect, useState } from "react";
import inventoryService from "@/api/services/inventoryService";
import { useInventoryActions, useWarehouseProducts } from "@/store/inventoryStore";
import { useCurrentBusiness } from "@/store/userStore";
import type { Warehouse, WarehouseProduct } from "@/types/entity";
import { Badge } from "@/ui/badge";
import { Card } from "@/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";

type WarehouseProductWithBusiness = WarehouseProduct & {
	businessId?: number;
	warehouseBusinessId?: number;
	warehouse?: { businessId?: number } | null;
};

function getWarehouseProductBusinessId(warehouseProduct: WarehouseProduct): number | undefined {
	const warehouseProductWithBusiness = warehouseProduct as WarehouseProductWithBusiness;
	return (
		warehouseProductWithBusiness.businessId ??
		warehouseProductWithBusiness.warehouseBusinessId ??
		warehouseProductWithBusiness.warehouse?.businessId
	);
}

export default function Stock() {
	const warehouseProducts = useWarehouseProducts();
	const business = useCurrentBusiness();
	const { setWarehouseProducts } = useInventoryActions();
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let isMounted = true;

		const loadWarehouseProducts = async () => {
			setLoading(true);
			try {
				const [warehouseProductsData, warehousesData] = await Promise.all([
					inventoryService.getWarehouseProducts(),
					inventoryService.getWarehouses().catch(() => [] as Warehouse[]),
				]);

				if (!isMounted) return;

				if (!business?.id) {
					setWarehouseProducts(warehouseProductsData);
					return;
				}

				let filteredWarehouseProducts: WarehouseProduct[];

				if (warehousesData.length > 0) {
					const warehouseIdsForBusiness = new Set(
						warehousesData.filter((warehouse) => warehouse.businessId === business.id).map((warehouse) => warehouse.id),
					);
					filteredWarehouseProducts = warehouseProductsData.filter((warehouseProduct) =>
						warehouseIdsForBusiness.has(warehouseProduct.warehouseId),
					);
				} else {
					filteredWarehouseProducts = warehouseProductsData.filter(
						(warehouseProduct) => getWarehouseProductBusinessId(warehouseProduct) === business.id,
					);
				}

				setWarehouseProducts(filteredWarehouseProducts);
			} catch {
				if (!isMounted) return;
				setWarehouseProducts([]);
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		};

		void loadWarehouseProducts();

		return () => {
			isMounted = false;
		};
	}, [business?.id, setWarehouseProducts]);

	const lowStockCount = warehouseProducts.filter((wp) => wp.isLowStock).length;
	const totalStock = warehouseProducts.reduce((sum, wp) => sum + wp.stockLeft, 0);

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold">Stock Management</h1>
				<p className="font-semibold text-text-primary">
					Check the available stock of each product per warehouse for{" "}
					<span className="text-primary">{business?.name ?? "—"}</span>.
				</p>
			</div>

			{/* Summary Cards */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<Card className="p-6">
					<div className="text-sm font-medium text-text-secondary">Warehouse-Product Entries</div>
					<div className="mt-2 text-3xl font-bold">{warehouseProducts.length}</div>
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

			{/* Table */}
			<Card>
				<div className="p-6">
					<h2 className="text-xl font-semibold mb-4">Warehouse Stock</h2>
					<Table>
						<TableHeader>
							<TableRow className="grid-cols-6 items-center">
								<TableHead className="col-span-1">Product</TableHead>
								<TableHead className="col-span-1">Warehouse</TableHead>
								<TableHead className="col-span-1">Status</TableHead>
								<TableHead className="col-span-1">Stock Left</TableHead>
								<TableHead className="col-span-1">Low Stock Threshold</TableHead>
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
							) : warehouseProducts.length === 0 ? (
								<TableRow>
									<TableCell className="col-span-full text-center py-8 text-text-secondary">
										No stock data available.
									</TableCell>
								</TableRow>
							) : (
								warehouseProducts.map((wp) => (
									<TableRow className="grid-cols-6 items-center" key={wp.id}>
										<TableCell className="col-span-1 font-medium">{wp.productName ?? wp.productId}</TableCell>
										<TableCell className="col-span-1">{wp.warehouseName ?? wp.warehouseId}</TableCell>
										<TableCell className="col-span-1">{wp.statusName ?? "—"}</TableCell>
										<TableCell className="col-span-1">{wp.stockLeft}</TableCell>
										<TableCell className="col-span-1">{wp.lowStockQty}</TableCell>
										<TableCell className="col-span-1">
											{wp.isLowStock ? (
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
	);
}
