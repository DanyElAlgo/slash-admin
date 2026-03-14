import { useEffect } from "react";
import inventoryService from "@/api/services/inventoryService";
import { useInventoryActions, useProducts, useWarehouseProducts } from "@/store/inventoryStore";
import { useCurrentBusiness } from "@/store/userStore";
import type { Warehouse, WarehouseProduct } from "@/types/entity";
import { Card } from "@/ui/card";

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

export default function Workbench() {
	const business = useCurrentBusiness();
	const { setProducts, setWarehouseProducts } = useInventoryActions();
	const products = useProducts();
	const warehouseProducts = useWarehouseProducts();

	useEffect(() => {
		let isMounted = true;

		const loadInventory = async () => {
			try {
				const [productsData, warehouseProductsData, warehousesData] = await Promise.all([
					inventoryService.getProducts(),
					inventoryService.getWarehouseProducts(),
					inventoryService.getWarehouses().catch(() => [] as Warehouse[]),
				]);

				if (!isMounted) return;

				if (!business?.id) {
					setProducts(productsData);
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

				const productIdsForBusiness = new Set(
					filteredWarehouseProducts.map((warehouseProduct) => warehouseProduct.productId),
				);
				const filteredProducts = productsData.filter((product) => productIdsForBusiness.has(product.id));

				setProducts(filteredProducts);
				setWarehouseProducts(filteredWarehouseProducts);
			} catch {
				return;
			}
		};

		void loadInventory();

		return () => {
			isMounted = false;
		};
	}, [business?.id, setProducts, setWarehouseProducts]);

	const lowStockCount = warehouseProducts.filter((wp) => wp.isLowStock).length;
	const totalStock = warehouseProducts.reduce((sum, wp) => sum + wp.stockLeft, 0);

	return (
		<div className="flex flex-col gap-4 w-full">
			<div>
				<h1 className="text-3xl font-bold">Dashboard</h1>
				<p className="text-text-secondary mt-1">
					Company: <span className="font-semibold text-text-primary">{business?.name ?? "—"}</span>
				</p>
			</div>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card className="p-6">
					<div className="text-sm font-medium text-text-secondary">Products</div>
					<div className="mt-2 text-3xl font-bold">{products.length}</div>
				</Card>
				<Card className="p-6">
					<div className="text-sm font-medium text-text-secondary">Total Units in Stock</div>
					<div className="mt-2 text-3xl font-bold">{totalStock}</div>
				</Card>
				<Card className="p-6">
					<div className="text-sm font-medium text-text-secondary">Warehouse Entries</div>
					<div className="mt-2 text-3xl font-bold">{warehouseProducts.length}</div>
				</Card>
				<Card className="p-6">
					<div className="text-sm font-medium text-text-secondary">Low Stock Items</div>
					<div className="mt-2 text-3xl font-bold text-warning">{lowStockCount}</div>
				</Card>
			</div>
		</div>
	);
}
