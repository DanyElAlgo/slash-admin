import { Pencil, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import inventoryService from "@/api/services/inventoryService";
import { useRouter } from "@/routes/hooks";
import { useCategories, useInventoryActions, useProducts, useUnits } from "@/store/inventoryStore";
import { useCurrentBusiness } from "@/store/userStore";
import type { PaginatedResult, Product, Warehouse, WarehouseProduct } from "@/types/entity";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { Input } from "@/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Switch } from "@/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";

const STATUS_ON_ID = 1;
const STATUS_OFF_ID = 2;

type StatusFilter = "all" | "on" | "off";

function isProductOn(product: Product): boolean {
	if (typeof product.isActive === "boolean") {
		return product.isActive;
	}
	if (typeof product.statusId === "number") {
		return product.statusId === STATUS_ON_ID;
	}
	const normalizedStatus = product.statusName?.toLowerCase().trim();
	if (!normalizedStatus) {
		return true;
	}
	return !["off", "inactive", "disabled"].some((value) => normalizedStatus.includes(value));
}

function parseSearchResult(data: PaginatedResult<Product> | Product[]): Product[] {
	if (Array.isArray(data)) {
		return data;
	}
	if (data && Array.isArray(data.items)) {
		return data.items;
	}
	return [];
}

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

export default function InventoryDashboard() {
	const router = useRouter();
	const business = useCurrentBusiness();

	const products = useProducts();
	const categories = useCategories();
	const units = useUnits();
	const { setProducts, setCategories, setUnits } = useInventoryActions();

	const [searchTerm, setSearchTerm] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("all");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [loading, setLoading] = useState(true);
	const [updatingProductId, setUpdatingProductId] = useState<number | null>(null);
	const [businessProductIds, setBusinessProductIds] = useState<Set<number> | null>(null);

	const loadCategoriesAndUnits = useCallback(async () => {
		try {
			const [categoriesData, unitsData] = await Promise.all([
				inventoryService.getCategories(),
				inventoryService.getUnits(),
			]);
			setCategories(categoriesData);
			setUnits(unitsData);
		} catch {
			toast.error("Failed to load categories and units.");
		}
	}, [setCategories, setUnits]);

	const loadProducts = useCallback(
		async (query: string, categoryValue: string, statusValue: StatusFilter) => {
			if (business?.id && businessProductIds === null) {
				return;
			}

			setLoading(true);
			try {
				const hasFilters = Boolean(query.trim()) || categoryValue !== "all" || statusValue !== "all";
				let loadedProducts: Product[];

				if (hasFilters) {
					const response = await inventoryService.searchProducts({
						searchTerm: query.trim() || undefined,
						categoryId: categoryValue === "all" ? undefined : Number(categoryValue),
						statusId: statusValue === "all" ? undefined : statusValue === "on" ? STATUS_ON_ID : STATUS_OFF_ID,
						pageNumber: 1,
						pageSize: 500,
					});
					loadedProducts = parseSearchResult(response);
				} else {
					loadedProducts = await inventoryService.getProducts();
				}

				const scopedProducts =
					businessProductIds === null
						? loadedProducts
						: loadedProducts.filter((product) => businessProductIds.has(product.id));

				setProducts(scopedProducts);
			} catch {
				toast.error("Failed to load products.");
			} finally {
				setLoading(false);
			}
		},
		[business?.id, businessProductIds, setProducts],
	);

	const loadBusinessProductIds = useCallback(async () => {
		if (!business?.id) {
			setBusinessProductIds(null);
			return;
		}

		setLoading(true);
		try {
			const [warehouseProducts, warehouses] = await Promise.all([
				inventoryService.getWarehouseProducts(),
				inventoryService.getWarehouses().catch(() => [] as Warehouse[]),
			]);

			let productIds: Set<number>;

			if (warehouses.length > 0) {
				const warehouseIdsForBusiness = new Set(
					warehouses.filter((warehouse) => warehouse.businessId === business.id).map((warehouse) => warehouse.id),
				);

				productIds = new Set(
					warehouseProducts
						.filter((warehouseProduct) => warehouseIdsForBusiness.has(warehouseProduct.warehouseId))
						.map((warehouseProduct) => warehouseProduct.productId),
				);
			} else {
				productIds = new Set(
					warehouseProducts
						.filter((warehouseProduct) => getWarehouseProductBusinessId(warehouseProduct) === business.id)
						.map((warehouseProduct) => warehouseProduct.productId),
				);
			}

			setBusinessProductIds(productIds);
		} catch {
			toast.error("Failed to load business products.");
			setBusinessProductIds(new Set());
		} finally {
			setLoading(false);
		}
	}, [business?.id]);

	useEffect(() => {
		void loadCategoriesAndUnits();
	}, [loadCategoriesAndUnits]);

	useEffect(() => {
		void loadBusinessProductIds();
	}, [loadBusinessProductIds]);

	useEffect(() => {
		if (business?.id && businessProductIds === null) {
			return;
		}

		const timeout = window.setTimeout(() => {
			void loadProducts(searchTerm, categoryFilter, statusFilter);
		}, 300);

		return () => {
			window.clearTimeout(timeout);
		};
	}, [business?.id, businessProductIds, categoryFilter, loadProducts, searchTerm, statusFilter]);

	const categoryMap = useMemo(() => new Map(categories.map((category) => [category.id, category.name])), [categories]);
	const unitMap = useMemo(() => new Map(units.map((unit) => [unit.id, unit.name])), [units]);

	const lowStockCount = useMemo(
		() => products.filter((product) => (product.lowStockCount ?? 0) > 0).length,
		[products],
	);

	const onProductsCount = useMemo(() => products.filter((product) => isProductOn(product)).length, [products]);

	const handleToggleProduct = async (product: Product, nextOn: boolean) => {
		setUpdatingProductId(product.id);
		try {
			try {
				await inventoryService.updateProduct(product.id, {
					statusId: nextOn ? STATUS_ON_ID : STATUS_OFF_ID,
					isActive: nextOn,
				});
			} catch {
				await inventoryService.updateProduct(product.id, {
					name: product.name,
					description: product.description,
					unitId: product.unitId,
					unitQty: product.unitQty,
					categoryId: product.categoryId,
					statusId: nextOn ? STATUS_ON_ID : STATUS_OFF_ID,
					isActive: nextOn,
				});
			}

			toast.success(`Product turned ${nextOn ? "on" : "off"}.`);
			await loadProducts(searchTerm, categoryFilter, statusFilter);
		} catch {
			toast.error("Failed to update product status.");
		} finally {
			setUpdatingProductId(null);
		}
	};

	return (
		<div className="space-y-6 p-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-3xl font-bold">Products</h1>
					<p className="mt-1 text-text-secondary">
						Product catalog for <span className="font-semibold text-text-primary">{business?.name ?? "—"}</span>
					</p>
				</div>
				<Button onClick={() => router.push("/inventory/manage")}>
					<Plus className="mr-2 h-4 w-4" /> Add Product
				</Button>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<Card className="p-6">
					<div className="text-sm font-medium text-text-secondary">Total Products</div>
					<div className="mt-2 text-3xl font-bold">{products.length}</div>
				</Card>
				<Card className="p-6">
					<div className="text-sm font-medium text-text-secondary">Enabled (On)</div>
					<div className="mt-2 text-3xl font-bold text-success">{onProductsCount}</div>
				</Card>
				<Card className="p-6">
					<div className="text-sm font-medium text-text-secondary">Low Stock</div>
					<div className="mt-2 text-3xl font-bold text-warning">{lowStockCount}</div>
				</Card>
			</div>

			<Card>
				<div className="p-6 space-y-4">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<h2 className="text-xl font-semibold">Products</h2>
						<Button variant="outline" size="sm" onClick={() => router.push("/inventory/manage")}>
							Manage Categories & Units
						</Button>
					</div>

					<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
						<Input
							className="sm:max-w-xs"
							placeholder="Search products..."
							value={searchTerm}
							onChange={(event) => setSearchTerm(event.target.value)}
						/>

						<Select value={categoryFilter} onValueChange={setCategoryFilter}>
							<SelectTrigger className="w-full sm:w-55">
								<SelectValue placeholder="Filter by category" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All categories</SelectItem>
								{categories.map((category) => (
									<SelectItem key={category.id} value={String(category.id)}>
										{category.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
							<SelectTrigger className="w-full sm:w-40">
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All</SelectItem>
								<SelectItem value="on">On</SelectItem>
								<SelectItem value="off">Off</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<Table>
						<TableHeader>
							<TableRow className="grid-cols-10 items-center">
								<TableHead className="col-span-1">Name</TableHead>
								<TableHead className="col-span-2">Description</TableHead>
								<TableHead className="col-span-1">Category</TableHead>
								<TableHead className="col-span-1">Unit</TableHead>
								<TableHead className="col-span-1">Unit Qty</TableHead>
								<TableHead className="col-span-1">Total Stock</TableHead>
								<TableHead className="col-span-1">Status</TableHead>
								<TableHead className="col-span-1">On/Off</TableHead>
								<TableHead className="col-span-1 text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{loading ? (
								<TableRow>
									<TableCell className="col-span-10 py-8 text-center text-text-secondary">
										Loading products...
									</TableCell>
								</TableRow>
							) : products.length === 0 ? (
								<TableRow>
									<TableCell className="col-span-10 py-8 text-center text-text-secondary">No products found.</TableCell>
								</TableRow>
							) : (
								products.map((product) => {
									const productOn = isProductOn(product);
									return (
										<TableRow key={product.id} className="grid-cols-10 items-center">
											<TableCell className="col-span-1 font-medium">{product.name}</TableCell>
											<TableCell className="col-span-2">{product.description || "—"}</TableCell>
											<TableCell className="col-span-1">
												{product.categoryName ?? categoryMap.get(product.categoryId) ?? "—"}
											</TableCell>
											<TableCell className="col-span-1">
												{product.unitName ?? unitMap.get(product.unitId) ?? "—"}
											</TableCell>
											<TableCell className="col-span-1">{product.unitQty}</TableCell>
											<TableCell className="col-span-1">{product.totalStock ?? 0}</TableCell>
											<TableCell className="col-span-1">
												{productOn ? (
													<Badge className="bg-success text-white">On</Badge>
												) : (
													<Badge className="bg-warning text-white">Off</Badge>
												)}
											</TableCell>
											<TableCell className="col-span-1">
												<Switch
													checked={productOn}
													disabled={updatingProductId === product.id}
													onCheckedChange={(checked) => void handleToggleProduct(product, checked)}
												/>
											</TableCell>
											<TableCell className="col-span-1 text-right">
												<Button
													size="sm"
													variant="outline"
													onClick={() => router.push(`/inventory/manage/${product.id}`)}
												>
													<Pencil className="h-4 w-4" /> Edit
												</Button>
											</TableCell>
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>
				</div>
			</Card>
		</div>
	);
}
