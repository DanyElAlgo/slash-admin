import { Pencil, Plus, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import BusinessGate from "@/components/business-gate";
import inventoryService, {
	type InventoryDocumentCreateDto,
	type ProductCreateDto,
} from "@/api/services/inventoryService";
import { useCurrentBusiness } from "@/store/userStore";
import type {
	Category,
	InventoryDashboard,
	InventoryDocument,
	KardexEntry,
	Product,
	StockItem,
	Unit,
	Warehouse,
} from "@/types/entity";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import { Textarea } from "@/ui/textarea";

const STATUS_ACTIVE = "ACTIVE";
const STATUS_INACTIVE = "INACTIVE";
const STATUS_OUT_OF_STOCK = "OUT_OF_STOCK";

type ProductFormState = {
	sku: string;
	name: string;
	description: string;
	categoryCen: string;
	unitCen: string;
	salePrice: string;
	costPrice: string;
	reorderLevel: string;
	stationCode: string;
};

const EMPTY_PRODUCT_FORM: ProductFormState = {
	sku: "",
	name: "",
	description: "",
	categoryCen: "",
	unitCen: "",
	salePrice: "",
	costPrice: "",
	reorderLevel: "",
	stationCode: "",
};

type AdjustmentFormState = {
	warehouseCen: string;
	productCen: string;
	adjustmentType: "INCREASE" | "DECREASE" | "SET";
	quantity: string;
	reason: string;
};

const EMPTY_ADJUSTMENT_FORM: AdjustmentFormState = {
	warehouseCen: "",
	productCen: "",
	adjustmentType: "INCREASE",
	quantity: "",
	reason: "",
};

type DocumentFormState = {
	documentType: "ENTRY" | "EXIT" | "SALE_EXIT";
	warehouseCen: string;
	reason: string;
	externalReference: string;
	productCen: string;
	quantity: string;
	unitCost: string;
};

const EMPTY_DOCUMENT_FORM: DocumentFormState = {
	documentType: "ENTRY",
	warehouseCen: "",
	reason: "",
	externalReference: "",
	productCen: "",
	quantity: "",
	unitCost: "",
};

function normalizeStatus(status?: string): string {
	return (status || STATUS_ACTIVE).toUpperCase();
}

function isProductActive(status?: string): boolean {
	return normalizeStatus(status) === STATUS_ACTIVE;
}

export default function InventoryDashboard() {
	const business = useCurrentBusiness();

	const [dashboard, setDashboard] = useState<InventoryDashboard | null>(null);
	const [products, setProducts] = useState<Product[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [units, setUnits] = useState<Unit[]>([]);
	const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
	const [stockItems, setStockItems] = useState<StockItem[]>([]);
	const [documents, setDocuments] = useState<InventoryDocument[]>([]);
	const [kardexEntries, setKardexEntries] = useState<KardexEntry[]>([]);
	const [loading, setLoading] = useState(true);

	const [productDialogOpen, setProductDialogOpen] = useState(false);
	const [editingProduct, setEditingProduct] = useState<Product | null>(null);
	const [productForm, setProductForm] = useState<ProductFormState>(EMPTY_PRODUCT_FORM);

	const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
	const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });
	const [editingCategory, setEditingCategory] = useState<Category | null>(null);

	const [unitDialogOpen, setUnitDialogOpen] = useState(false);
	const [unitForm, setUnitForm] = useState({ name: "", abbreviation: "" });
	const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

	const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
	const [warehouseForm, setWarehouseForm] = useState({ name: "" });
	const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

	const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
	const [adjustmentForm, setAdjustmentForm] = useState<AdjustmentFormState>(EMPTY_ADJUSTMENT_FORM);

	const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
	const [documentForm, setDocumentForm] = useState<DocumentFormState>(EMPTY_DOCUMENT_FORM);

	const [kardexDialogOpen, setKardexDialogOpen] = useState(false);
	const [kardexLoading, setKardexLoading] = useState(false);
	const [kardexProduct, setKardexProduct] = useState<Product | null>(null);

	const [searchTerm, setSearchTerm] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("all");
	const [statusFilter, setStatusFilter] = useState("all");

	const loadAll = useCallback(async () => {
		if (!business?.companyCen) return;
		setLoading(true);
		try {
			const [dashboardData, productsData, categoriesData, unitsData, warehousesData, stockData, documentsData] =
				await Promise.all([
					inventoryService.getDashboard(business.companyCen),
					inventoryService.getProducts(business.companyCen),
					inventoryService.getCategories(business.companyCen),
					inventoryService.getUnits(business.companyCen),
					inventoryService.getWarehouses(business.companyCen),
					inventoryService.getStock(business.companyCen),
					inventoryService.getDocuments(business.companyCen),
				]);

			setDashboard(dashboardData);
			setProducts(productsData);
			setCategories(categoriesData);
			setUnits(unitsData);
			setWarehouses(warehousesData);
			setStockItems(stockData);
			setDocuments(documentsData);
		} catch {
			toast.error("Failed to load inventory data.");
		} finally {
			setLoading(false);
		}
	}, [business?.companyCen]);

	useEffect(() => {
		void loadAll();
	}, [loadAll]);

	const filteredProducts = useMemo(() => {
		return products.filter((product) => {
			const matchesSearch = !searchTerm || product.name.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesCategory = categoryFilter === "all" || product.categoryCen === categoryFilter;
			const matchesStatus = statusFilter === "all" || normalizeStatus(product.status) === statusFilter.toUpperCase();
			return matchesSearch && matchesCategory && matchesStatus;
		});
	}, [products, searchTerm, categoryFilter, statusFilter]);

	const handleOpenProductDialog = (product?: Product) => {
		if (product) {
			setEditingProduct(product);
			setProductForm({
				sku: product.sku || "",
				name: product.name || "",
				description: product.description || "",
				categoryCen: product.categoryCen || "",
				unitCen: product.unitCen || "",
				salePrice: product.salePrice?.toString() || "",
				costPrice: product.costPrice?.toString() || "",
				reorderLevel: product.reorderLevel?.toString() || "",
				stationCode: product.stationCode || "",
			});
		} else {
			setEditingProduct(null);
			setProductForm(EMPTY_PRODUCT_FORM);
		}
		setProductDialogOpen(true);
	};

	const handleSaveProduct = async () => {
		if (!business?.companyCen) return;
		if (!productForm.sku.trim() || !productForm.name.trim()) {
			toast.error("SKU and name are required.");
			return;
		}
		if (!productForm.categoryCen || !productForm.unitCen) {
			toast.error("Category and unit are required.");
			return;
		}

		const salePriceValue = Number(productForm.salePrice);
		if (!Number.isFinite(salePriceValue) || salePriceValue <= 0) {
			toast.error("Sale price must be greater than zero.");
			return;
		}

		const payload: ProductCreateDto = {
			sku: productForm.sku.trim(),
			name: productForm.name.trim(),
			description: productForm.description.trim() || undefined,
			categoryCen: productForm.categoryCen,
			unitCen: productForm.unitCen,
			salePrice: salePriceValue,
			costPrice: productForm.costPrice ? Number(productForm.costPrice) : undefined,
			reorderLevel: productForm.reorderLevel ? Number(productForm.reorderLevel) : undefined,
			stationCode: productForm.stationCode.trim() || undefined,
		};

		try {
			if (editingProduct) {
				await inventoryService.updateProduct(business.companyCen, editingProduct.productCen, payload);
				toast.success("Product updated.");
			} else {
				await inventoryService.createProduct(business.companyCen, payload);
				toast.success("Product created.");
			}

			setProductDialogOpen(false);
			setEditingProduct(null);
			setProductForm(EMPTY_PRODUCT_FORM);
			await loadAll();
		} catch {
			toast.error("Failed to save product.");
		}
	};

	const handleUpdateProductStatus = async (product: Product, status: string) => {
		if (!business?.companyCen) return;
		try {
			await inventoryService.updateProductStatus(business.companyCen, product.productCen, status);
			toast.success("Product status updated.");
			await loadAll();
		} catch {
			toast.error("Failed to update product status.");
		}
	};

	const handleSaveCategory = async () => {
		if (!business?.companyCen) return;
		if (!categoryForm.name.trim()) {
			toast.error("Category name is required.");
			return;
		}

		try {
			if (editingCategory) {
				await inventoryService.updateCategory(business.companyCen, editingCategory.categoryCen, {
					name: categoryForm.name.trim(),
					description: categoryForm.description.trim() || undefined,
				});
				toast.success("Category updated.");
			} else {
				await inventoryService.createCategory(business.companyCen, {
					name: categoryForm.name.trim(),
					description: categoryForm.description.trim() || undefined,
				});
				toast.success("Category created.");
			}

			setCategoryDialogOpen(false);
			setEditingCategory(null);
			setCategoryForm({ name: "", description: "" });
			await loadAll();
		} catch {
			toast.error("Failed to save category.");
		}
	};

	const handleSaveUnit = async () => {
		if (!business?.companyCen) return;
		if (!unitForm.name.trim()) {
			toast.error("Unit name is required.");
			return;
		}

		try {
			if (editingUnit) {
				await inventoryService.updateUnit(business.companyCen, editingUnit.unitCen, {
					name: unitForm.name.trim(),
					abbreviation: unitForm.abbreviation.trim() || undefined,
				});
				toast.success("Unit updated.");
			} else {
				await inventoryService.createUnit(business.companyCen, {
					name: unitForm.name.trim(),
					abbreviation: unitForm.abbreviation.trim() || undefined,
				});
				toast.success("Unit created.");
			}

			setUnitDialogOpen(false);
			setEditingUnit(null);
			setUnitForm({ name: "", abbreviation: "" });
			await loadAll();
		} catch {
			toast.error("Failed to save unit.");
		}
	};

	const handleSaveWarehouse = async () => {
		if (!business?.companyCen) return;
		if (!warehouseForm.name.trim()) {
			toast.error("Warehouse name is required.");
			return;
		}

		try {
			if (editingWarehouse) {
				await inventoryService.updateWarehouse(business.companyCen, editingWarehouse.warehouseCen, {
					name: warehouseForm.name.trim(),
				});
				toast.success("Warehouse updated.");
			} else {
				await inventoryService.createWarehouse(business.companyCen, { name: warehouseForm.name.trim() });
				toast.success("Warehouse created.");
			}
			setWarehouseDialogOpen(false);
			setWarehouseForm({ name: "" });
			setEditingWarehouse(null);
			await loadAll();
		} catch {
			toast.error("Failed to save warehouse.");
		}
	};

	const handleToggleWarehouseActive = async (warehouse: Warehouse) => {
		if (!business?.companyCen) return;
		try {
			await inventoryService.updateWarehouse(business.companyCen, warehouse.warehouseCen, {
				isActive: warehouse.isActive === false,
			});
			toast.success("Warehouse status updated.");
			await loadAll();
		} catch {
			toast.error("Failed to update warehouse.");
		}
	};

	const handleSaveAdjustment = async () => {
		if (!business?.companyCen) return;
		if (!adjustmentForm.warehouseCen || !adjustmentForm.productCen) {
			toast.error("Warehouse and product are required.");
			return;
		}
		const quantityValue = Number(adjustmentForm.quantity);
		if (!Number.isFinite(quantityValue) || quantityValue <= 0) {
			toast.error("Quantity must be greater than zero.");
			return;
		}
		if (!adjustmentForm.reason.trim()) {
			toast.error("Reason is required.");
			return;
		}

		try {
			await inventoryService.createAdjustment(business.companyCen, {
				warehouseCen: adjustmentForm.warehouseCen,
				reason: adjustmentForm.reason.trim(),
				lines: [
					{
						productCen: adjustmentForm.productCen,
						quantity: quantityValue,
						adjustmentType: adjustmentForm.adjustmentType,
					},
				],
			});
			toast.success("Stock adjustment created.");
			setAdjustmentDialogOpen(false);
			setAdjustmentForm(EMPTY_ADJUSTMENT_FORM);
			await loadAll();
		} catch {
			toast.error("Failed to create adjustment.");
		}
	};

	const handleSaveDocument = async () => {
		if (!business?.companyCen) return;
		if (!documentForm.warehouseCen || !documentForm.productCen) {
			toast.error("Warehouse and product are required.");
			return;
		}
		const quantityValue = Number(documentForm.quantity);
		if (!Number.isFinite(quantityValue) || quantityValue <= 0) {
			toast.error("Quantity must be greater than zero.");
			return;
		}

		const payload: InventoryDocumentCreateDto = {
			documentType: documentForm.documentType,
			warehouseCen: documentForm.warehouseCen,
			reason: documentForm.reason.trim() || undefined,
			externalReference: documentForm.externalReference.trim() || undefined,
			lines: [
				{
					productCen: documentForm.productCen,
					quantity: quantityValue,
					unitCost: documentForm.unitCost ? Number(documentForm.unitCost) : undefined,
				},
			],
		};

		try {
			await inventoryService.createDocument(business.companyCen, payload);
			toast.success("Document created.");
			setDocumentDialogOpen(false);
			setDocumentForm(EMPTY_DOCUMENT_FORM);
			await loadAll();
		} catch {
			toast.error("Failed to create document.");
		}
	};

	const handleOpenKardex = async (product: Product) => {
		if (!business?.companyCen) return;
		setKardexProduct(product);
		setKardexDialogOpen(true);
		setKardexLoading(true);
		try {
			const entries = await inventoryService.getKardex(business.companyCen, product.productCen);
			setKardexEntries(entries);
		} catch {
			toast.error("Failed to load kardex.");
			setKardexEntries([]);
		} finally {
			setKardexLoading(false);
		}
	};

	return (
		<BusinessGate>
			<div className="space-y-6 p-6">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h1 className="text-3xl font-bold">Inventory</h1>
						<p className="mt-1 text-text-secondary">
							Company: <span className="font-semibold text-text-primary">{business?.name ?? "—"}</span>
						</p>
					</div>
					<Button variant="outline" onClick={loadAll} disabled={loading}>
						<RefreshCw className="mr-2 h-4 w-4" /> Refresh
					</Button>
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
					<Card className="p-6">
						<div className="text-sm font-medium text-text-secondary">Total Products</div>
						<div className="mt-2 text-3xl font-bold">{dashboard?.totalProducts ?? 0}</div>
					</Card>
					<Card className="p-6">
						<div className="text-sm font-medium text-text-secondary">Stock Quantity</div>
						<div className="mt-2 text-3xl font-bold">{dashboard?.totalStockQuantity ?? 0}</div>
					</Card>
					<Card className="p-6">
						<div className="text-sm font-medium text-text-secondary">Low Stock</div>
						<div className="mt-2 text-3xl font-bold text-warning">{dashboard?.lowStockCount ?? 0}</div>
					</Card>
					<Card className="p-6">
						<div className="text-sm font-medium text-text-secondary">Out of Stock</div>
						<div className="mt-2 text-3xl font-bold text-destructive">{dashboard?.outOfStockCount ?? 0}</div>
					</Card>
				</div>

				<Tabs defaultValue="products" className="space-y-4">
					<TabsList>
						<TabsTrigger value="products">Products</TabsTrigger>
						<TabsTrigger value="catalog">Categories & Units</TabsTrigger>
						<TabsTrigger value="stock">Stock</TabsTrigger>
						<TabsTrigger value="documents">Documents</TabsTrigger>
					</TabsList>

					<TabsContent value="products">
						<Card className="p-6 space-y-4">
							<div className="flex flex-wrap items-center justify-between gap-2">
								<h2 className="text-xl font-semibold">Products</h2>
								<Button onClick={() => handleOpenProductDialog()}>
									<Plus className="mr-2 h-4 w-4" /> New Product
								</Button>
							</div>

							<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
								<Input
									placeholder="Search products..."
									value={searchTerm}
									onChange={(event) => setSearchTerm(event.target.value)}
								/>
								<Select value={categoryFilter} onValueChange={setCategoryFilter}>
									<SelectTrigger>
										<SelectValue placeholder="All categories" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All categories</SelectItem>
										{categories.map((category) => (
											<SelectItem key={category.categoryCen} value={category.categoryCen}>
												{category.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Select value={statusFilter} onValueChange={setStatusFilter}>
									<SelectTrigger>
										<SelectValue placeholder="All statuses" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All statuses</SelectItem>
										<SelectItem value={STATUS_ACTIVE}>Active</SelectItem>
										<SelectItem value={STATUS_INACTIVE}>Inactive</SelectItem>
										<SelectItem value={STATUS_OUT_OF_STOCK}>Out of Stock</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>SKU</TableHead>
										<TableHead>Name</TableHead>
										<TableHead>Category</TableHead>
										<TableHead>Unit</TableHead>
										<TableHead>Price</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{loading ? (
										<TableRow>
											<TableCell className="col-span-7 text-center py-6">Loading...</TableCell>
										</TableRow>
									) : filteredProducts.length === 0 ? (
										<TableRow>
											<TableCell className="col-span-7 text-center py-6 text-muted-foreground">
												No products found.
											</TableCell>
										</TableRow>
									) : (
										filteredProducts.map((product) => (
											<TableRow key={product.productCen}>
												<TableCell className="text-xs text-muted-foreground">{product.sku}</TableCell>
												<TableCell className="font-medium">{product.name}</TableCell>
												<TableCell>{product.categoryName || "—"}</TableCell>
												<TableCell>{product.unitName || "—"}</TableCell>
												<TableCell>${product.salePrice.toFixed(2)}</TableCell>
												<TableCell>
													<Badge>{normalizeStatus(product.status)}</Badge>
												</TableCell>
												<TableCell className="text-right space-x-2">
													<Button variant="ghost" size="sm" onClick={() => handleOpenProductDialog(product)}>
														<Pencil className="h-4 w-4" />
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() =>
															handleUpdateProductStatus(
																product,
																isProductActive(product.status) ? STATUS_INACTIVE : STATUS_ACTIVE,
															)
														}
													>
														{isProductActive(product.status) ? "Disable" : "Enable"}
													</Button>
													<Button variant="ghost" size="sm" onClick={() => handleOpenKardex(product)}>
														Kardex
													</Button>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</Card>
					</TabsContent>

					<TabsContent value="catalog">
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
							<Card className="p-6 space-y-4">
								<div className="flex items-center justify-between">
									<h2 className="text-xl font-semibold">Categories</h2>
									<Button size="sm" onClick={() => setCategoryDialogOpen(true)}>
										<Plus className="mr-2 h-4 w-4" /> New Category
									</Button>
								</div>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Name</TableHead>
											<TableHead>Description</TableHead>
											<TableHead className="text-right">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{categories.map((category) => (
											<TableRow key={category.categoryCen}>
												<TableCell className="font-medium">{category.name}</TableCell>
												<TableCell>{category.description || "—"}</TableCell>
												<TableCell className="text-right">
													<Button
														variant="ghost"
														size="sm"
														onClick={() => {
															setEditingCategory(category);
															setCategoryForm({ name: category.name, description: category.description || "" });
															setCategoryDialogOpen(true);
														}}
													>
														<Pencil className="h-4 w-4" />
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</Card>

							<Card className="p-6 space-y-4">
								<div className="flex items-center justify-between">
									<h2 className="text-xl font-semibold">Units</h2>
									<Button size="sm" onClick={() => setUnitDialogOpen(true)}>
										<Plus className="mr-2 h-4 w-4" /> New Unit
									</Button>
								</div>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Name</TableHead>
											<TableHead>Abbreviation</TableHead>
											<TableHead className="text-right">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{units.map((unit) => (
											<TableRow key={unit.unitCen}>
												<TableCell className="font-medium">{unit.name}</TableCell>
												<TableCell>{unit.abbreviation || "—"}</TableCell>
												<TableCell className="text-right">
													<Button
														variant="ghost"
														size="sm"
														onClick={() => {
															setEditingUnit(unit);
															setUnitForm({ name: unit.name, abbreviation: unit.abbreviation || "" });
															setUnitDialogOpen(true);
														}}
													>
														<Pencil className="h-4 w-4" />
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</Card>

							<Card className="p-6 space-y-4 lg:col-span-2">
								<div className="flex items-center justify-between">
									<h2 className="text-xl font-semibold">Warehouses</h2>
									<Button
										size="sm"
										onClick={() => {
											setEditingWarehouse(null);
											setWarehouseForm({ name: "" });
											setWarehouseDialogOpen(true);
										}}
									>
										<Plus className="mr-2 h-4 w-4" /> New Warehouse
									</Button>
								</div>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Name</TableHead>
											<TableHead>Status</TableHead>
											<TableHead className="text-right">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{warehouses.map((warehouse) => (
											<TableRow key={warehouse.warehouseCen}>
												<TableCell className="font-medium">{warehouse.name}</TableCell>
												<TableCell>{warehouse.isActive === false ? "Inactive" : "Active"}</TableCell>
												<TableCell className="text-right space-x-2">
													<Button
														variant="ghost"
														size="sm"
														onClick={() => {
															setEditingWarehouse(warehouse);
															setWarehouseForm({ name: warehouse.name });
															setWarehouseDialogOpen(true);
														}}
													>
														<Pencil className="h-4 w-4" />
													</Button>
													<Button variant="outline" size="sm" onClick={() => handleToggleWarehouseActive(warehouse)}>
														{warehouse.isActive === false ? "Enable" : "Disable"}
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</Card>
						</div>
					</TabsContent>

					<TabsContent value="stock">
						<Card className="p-6 space-y-4">
							<div className="flex items-center justify-between">
								<h2 className="text-xl font-semibold">Stock</h2>
								<Button size="sm" onClick={() => setAdjustmentDialogOpen(true)}>
									<Plus className="mr-2 h-4 w-4" /> New Adjustment
								</Button>
							</div>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Product</TableHead>
										<TableHead>Warehouse</TableHead>
										<TableHead className="text-right">Available</TableHead>
										<TableHead className="text-right">Reserved</TableHead>
										<TableHead>Status</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{stockItems.length === 0 ? (
										<TableRow>
											<TableCell className="col-span-5 text-center py-6 text-muted-foreground">
												No stock records yet.
											</TableCell>
										</TableRow>
									) : (
										stockItems.map((item) => (
											<TableRow key={`${item.productCen}-${item.warehouseCen}`}>
												<TableCell className="font-medium">{item.productName}</TableCell>
												<TableCell>{item.warehouseName}</TableCell>
												<TableCell className="text-right">{item.availableQuantity}</TableCell>
												<TableCell className="text-right">{item.reservedQuantity}</TableCell>
												<TableCell>
													<Badge variant={item.isLowStock ? "secondary" : "default"}>
														{item.isLowStock ? "Low" : "Ok"}
													</Badge>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</Card>
					</TabsContent>

					<TabsContent value="documents">
						<Card className="p-6 space-y-4">
							<div className="flex items-center justify-between">
								<h2 className="text-xl font-semibold">Documents</h2>
								<Button size="sm" onClick={() => setDocumentDialogOpen(true)}>
									<Plus className="mr-2 h-4 w-4" /> New Document
								</Button>
							</div>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Document</TableHead>
										<TableHead>Type</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className="text-right">Items</TableHead>
										<TableHead>Created</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{documents.length === 0 ? (
										<TableRow>
											<TableCell className="col-span-5 text-center py-6 text-muted-foreground">
												No documents yet.
											</TableCell>
										</TableRow>
									) : (
										documents.map((doc) => (
											<TableRow key={doc.documentCen}>
												<TableCell className="font-medium">{doc.documentCen}</TableCell>
												<TableCell>{doc.documentType}</TableCell>
												<TableCell>{doc.status}</TableCell>
												<TableCell className="text-right">{doc.totalItems}</TableCell>
												<TableCell className="text-xs text-muted-foreground">{doc.createdAt}</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</Card>
					</TabsContent>
				</Tabs>
			</div>

			<Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>{editingProduct ? "Edit Product" : "New Product"}</DialogTitle>
					</DialogHeader>
					<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
						<div>
							<Label>SKU *</Label>
							<Input
								value={productForm.sku}
								onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
							/>
						</div>
						<div>
							<Label>Name *</Label>
							<Input
								value={productForm.name}
								onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
							/>
						</div>
						<div className="md:col-span-2">
							<Label>Description</Label>
							<Textarea
								value={productForm.description}
								onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
							/>
						</div>
						<div>
							<Label>Category *</Label>
							<Select
								value={productForm.categoryCen}
								onValueChange={(value) => setProductForm({ ...productForm, categoryCen: value })}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select category" />
								</SelectTrigger>
								<SelectContent>
									{categories.map((category) => (
										<SelectItem key={category.categoryCen} value={category.categoryCen}>
											{category.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>Unit *</Label>
							<Select
								value={productForm.unitCen}
								onValueChange={(value) => setProductForm({ ...productForm, unitCen: value })}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select unit" />
								</SelectTrigger>
								<SelectContent>
									{units.map((unit) => (
										<SelectItem key={unit.unitCen} value={unit.unitCen}>
											{unit.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>Sale Price *</Label>
							<Input
								type="number"
								value={productForm.salePrice}
								onChange={(e) => setProductForm({ ...productForm, salePrice: e.target.value })}
							/>
						</div>
						<div>
							<Label>Cost Price</Label>
							<Input
								type="number"
								value={productForm.costPrice}
								onChange={(e) => setProductForm({ ...productForm, costPrice: e.target.value })}
							/>
						</div>
						<div>
							<Label>Reorder Level</Label>
							<Input
								type="number"
								value={productForm.reorderLevel}
								onChange={(e) => setProductForm({ ...productForm, reorderLevel: e.target.value })}
							/>
						</div>
						<div>
							<Label>Station Code</Label>
							<Input
								value={productForm.stationCode}
								onChange={(e) => setProductForm({ ...productForm, stationCode: e.target.value })}
							/>
						</div>
					</div>
					<div className="mt-4 flex justify-end gap-2">
						<Button variant="outline" onClick={() => setProductDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleSaveProduct}>Save</Button>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{editingCategory ? "Edit Category" : "New Category"}</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div>
							<Label>Name *</Label>
							<Input
								value={categoryForm.name}
								onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
							/>
						</div>
						<div>
							<Label>Description</Label>
							<Textarea
								value={categoryForm.description}
								onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
							/>
						</div>
						<div className="flex justify-end gap-2">
							<Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
								Cancel
							</Button>
							<Button onClick={handleSaveCategory}>Save</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={unitDialogOpen} onOpenChange={setUnitDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{editingUnit ? "Edit Unit" : "New Unit"}</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div>
							<Label>Name *</Label>
							<Input value={unitForm.name} onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })} />
						</div>
						<div>
							<Label>Abbreviation</Label>
							<Input
								value={unitForm.abbreviation}
								onChange={(e) => setUnitForm({ ...unitForm, abbreviation: e.target.value })}
							/>
						</div>
						<div className="flex justify-end gap-2">
							<Button variant="outline" onClick={() => setUnitDialogOpen(false)}>
								Cancel
							</Button>
							<Button onClick={handleSaveUnit}>Save</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog
				open={warehouseDialogOpen}
				onOpenChange={(open) => {
					setWarehouseDialogOpen(open);
					if (!open) {
						setEditingWarehouse(null);
						setWarehouseForm({ name: "" });
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{editingWarehouse ? "Edit Warehouse" : "New Warehouse"}</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div>
							<Label>Name *</Label>
							<Input value={warehouseForm.name} onChange={(e) => setWarehouseForm({ name: e.target.value })} />
						</div>
						<div className="flex justify-end gap-2">
							<Button variant="outline" onClick={() => setWarehouseDialogOpen(false)}>
								Cancel
							</Button>
							<Button onClick={handleSaveWarehouse}>Save</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={adjustmentDialogOpen} onOpenChange={setAdjustmentDialogOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>New Adjustment</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div>
							<Label>Warehouse *</Label>
							<Select
								value={adjustmentForm.warehouseCen}
								onValueChange={(value) => setAdjustmentForm({ ...adjustmentForm, warehouseCen: value })}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select warehouse" />
								</SelectTrigger>
								<SelectContent>
									{warehouses.map((warehouse) => (
										<SelectItem key={warehouse.warehouseCen} value={warehouse.warehouseCen}>
											{warehouse.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>Product *</Label>
							<Select
								value={adjustmentForm.productCen}
								onValueChange={(value) => setAdjustmentForm({ ...adjustmentForm, productCen: value })}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select product" />
								</SelectTrigger>
								<SelectContent>
									{products.map((product) => (
										<SelectItem key={product.productCen} value={product.productCen}>
											{product.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>Adjustment Type</Label>
							<Select
								value={adjustmentForm.adjustmentType}
								onValueChange={(value) =>
									setAdjustmentForm({
										...adjustmentForm,
										adjustmentType: value as AdjustmentFormState["adjustmentType"],
									})
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="INCREASE">Increase</SelectItem>
									<SelectItem value="DECREASE">Decrease</SelectItem>
									<SelectItem value="SET">Set</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>Quantity *</Label>
							<Input
								type="number"
								value={adjustmentForm.quantity}
								onChange={(e) => setAdjustmentForm({ ...adjustmentForm, quantity: e.target.value })}
							/>
						</div>
						<div>
							<Label>Reason *</Label>
							<Textarea
								value={adjustmentForm.reason}
								onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
							/>
						</div>
						<div className="flex justify-end gap-2">
							<Button variant="outline" onClick={() => setAdjustmentDialogOpen(false)}>
								Cancel
							</Button>
							<Button onClick={handleSaveAdjustment}>Save</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>New Document</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div>
							<Label>Document Type</Label>
							<Select
								value={documentForm.documentType}
								onValueChange={(value) =>
									setDocumentForm({ ...documentForm, documentType: value as DocumentFormState["documentType"] })
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="ENTRY">Entry</SelectItem>
									<SelectItem value="EXIT">Exit</SelectItem>
									<SelectItem value="SALE_EXIT">Sale Exit</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>Warehouse *</Label>
							<Select
								value={documentForm.warehouseCen}
								onValueChange={(value) => setDocumentForm({ ...documentForm, warehouseCen: value })}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select warehouse" />
								</SelectTrigger>
								<SelectContent>
									{warehouses.map((warehouse) => (
										<SelectItem key={warehouse.warehouseCen} value={warehouse.warehouseCen}>
											{warehouse.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>Product *</Label>
							<Select
								value={documentForm.productCen}
								onValueChange={(value) => setDocumentForm({ ...documentForm, productCen: value })}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select product" />
								</SelectTrigger>
								<SelectContent>
									{products.map((product) => (
										<SelectItem key={product.productCen} value={product.productCen}>
											{product.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>Quantity *</Label>
							<Input
								type="number"
								value={documentForm.quantity}
								onChange={(e) => setDocumentForm({ ...documentForm, quantity: e.target.value })}
							/>
						</div>
						<div>
							<Label>Unit Cost</Label>
							<Input
								type="number"
								value={documentForm.unitCost}
								onChange={(e) => setDocumentForm({ ...documentForm, unitCost: e.target.value })}
							/>
						</div>
						<div>
							<Label>Reason</Label>
							<Textarea
								value={documentForm.reason}
								onChange={(e) => setDocumentForm({ ...documentForm, reason: e.target.value })}
							/>
						</div>
						<div>
							<Label>External Reference</Label>
							<Input
								value={documentForm.externalReference}
								onChange={(e) => setDocumentForm({ ...documentForm, externalReference: e.target.value })}
							/>
						</div>
						<div className="flex justify-end gap-2">
							<Button variant="outline" onClick={() => setDocumentDialogOpen(false)}>
								Cancel
							</Button>
							<Button onClick={handleSaveDocument}>Save</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={kardexDialogOpen} onOpenChange={setKardexDialogOpen}>
				<DialogContent className="max-w-3xl">
					<DialogHeader>
						<DialogTitle>Kardex - {kardexProduct?.name ?? ""}</DialogTitle>
					</DialogHeader>
					{!kardexProduct ? null : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Type</TableHead>
									<TableHead className="text-right">Quantity</TableHead>
									<TableHead>Warehouse</TableHead>
									<TableHead>Reason</TableHead>
									<TableHead>Document</TableHead>
									<TableHead>Created</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{kardexLoading ? (
									<TableRow>
										<TableCell className="col-span-6 text-center py-6">Loading...</TableCell>
									</TableRow>
								) : kardexEntries.length === 0 ? (
									<TableRow>
										<TableCell className="col-span-6 text-center py-6 text-muted-foreground">
											No movements yet.
										</TableCell>
									</TableRow>
								) : (
									kardexEntries.map((entry) => (
										<TableRow key={entry.movementCen}>
											<TableCell>{entry.movementType}</TableCell>
											<TableCell className="text-right">{entry.quantity}</TableCell>
											<TableCell className="text-xs">{entry.warehouseCen}</TableCell>
											<TableCell className="text-xs">{entry.reason || "—"}</TableCell>
											<TableCell className="text-xs text-muted-foreground">{entry.documentCen || "—"}</TableCell>
											<TableCell className="text-xs text-muted-foreground">{entry.createdAt}</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					)}
				</DialogContent>
			</Dialog>
		</BusinessGate>
	);
}
