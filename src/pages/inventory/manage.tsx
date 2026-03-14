import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import inventoryService, { type ProductCreateDto } from "@/api/services/inventoryService";
import { useParams, useRouter } from "@/routes/hooks";
import { useCategories, useInventoryActions, useProducts, useUnits } from "@/store/inventoryStore";
import type { Product } from "@/types/entity";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { Textarea } from "@/ui/textarea";

const STATUS_ON_ID = 1;
const STATUS_OFF_ID = 2;

type ProductFormState = {
	name: string;
	description: string;
	unitId: string;
	unitQty: string;
	categoryId: string;
	statusId: string;
};

const EMPTY_PRODUCT_FORM: ProductFormState = {
	name: "",
	description: "",
	unitId: "",
	unitQty: "1",
	categoryId: "",
	statusId: String(STATUS_ON_ID),
};

type BasicEntityForm = {
	id: number | null;
	name: string;
	description: string;
};

const EMPTY_BASIC_ENTITY_FORM: BasicEntityForm = {
	id: null,
	name: "",
	description: "",
};

function toProductForm(product: Product): ProductFormState {
	return {
		name: product.name ?? "",
		description: product.description ?? "",
		unitId: product.unitId ? String(product.unitId) : "",
		unitQty: product.unitQty ? String(product.unitQty) : "1",
		categoryId: product.categoryId ? String(product.categoryId) : "",
		statusId: String(product.statusId ?? (product.isActive === false ? STATUS_OFF_ID : STATUS_ON_ID)),
	};
}

export default function InventoryManagePage() {
	const router = useRouter();
	const { id } = useParams();
	const productId = id ? Number(id) : null;
	const isEditingProduct = Number.isFinite(productId) && productId !== null;

	const products = useProducts();
	const categories = useCategories();
	const units = useUnits();
	const { setProducts, setCategories, setUnits } = useInventoryActions();

	const [loading, setLoading] = useState(true);
	const [submittingProduct, setSubmittingProduct] = useState(false);
	const [submittingCategory, setSubmittingCategory] = useState(false);
	const [submittingUnit, setSubmittingUnit] = useState(false);

	const [productForm, setProductForm] = useState<ProductFormState>(EMPTY_PRODUCT_FORM);
	const [categoryForm, setCategoryForm] = useState<BasicEntityForm>(EMPTY_BASIC_ENTITY_FORM);
	const [unitForm, setUnitForm] = useState<BasicEntityForm>(EMPTY_BASIC_ENTITY_FORM);

	const editingProduct = useMemo(() => {
		if (!isEditingProduct || productId === null) return null;
		return products.find((product) => product.id === productId) ?? null;
	}, [isEditingProduct, productId, products]);

	const loadInventoryData = useCallback(async () => {
		setLoading(true);
		try {
			const [productsData, categoriesData, unitsData] = await Promise.all([
				inventoryService.getProducts(),
				inventoryService.getCategories(),
				inventoryService.getUnits(),
			]);

			setProducts(productsData);
			setCategories(categoriesData);
			setUnits(unitsData);
		} catch {
			toast.error("Failed to load inventory data.");
		} finally {
			setLoading(false);
		}
	}, [setCategories, setProducts, setUnits]);

	useEffect(() => {
		void loadInventoryData();
	}, [loadInventoryData]);

	useEffect(() => {
		if (!isEditingProduct) {
			setProductForm(EMPTY_PRODUCT_FORM);
			return;
		}

		if (!editingProduct) return;
		setProductForm(toProductForm(editingProduct));
	}, [editingProduct, isEditingProduct]);

	const handleProductField = (field: keyof ProductFormState, value: string) => {
		setProductForm((prev) => ({ ...prev, [field]: value }));
	};

	const handleSaveProduct = async () => {
		if (!productForm.name.trim()) {
			toast.error("Product name is required.");
			return;
		}

		const unitQtyValue = Number(productForm.unitQty);
		if (!Number.isFinite(unitQtyValue) || unitQtyValue <= 0) {
			toast.error("Unit quantity must be greater than zero.");
			return;
		}

		const payload: ProductCreateDto = {
			name: productForm.name.trim(),
			description: productForm.description.trim() || undefined,
			unitId: productForm.unitId ? Number(productForm.unitId) : undefined,
			unitQty: unitQtyValue,
			categoryId: productForm.categoryId ? Number(productForm.categoryId) : undefined,
			statusId: productForm.statusId ? Number(productForm.statusId) : STATUS_ON_ID,
			isActive: (productForm.statusId ? Number(productForm.statusId) : STATUS_ON_ID) === STATUS_ON_ID,
		};

		setSubmittingProduct(true);
		try {
			if (isEditingProduct && productId !== null) {
				await inventoryService.updateProduct(productId, payload);
				toast.success("Product updated.");
			} else {
				await inventoryService.createProduct(payload);
				toast.success("Product created.");
				setProductForm(EMPTY_PRODUCT_FORM);
			}

			await loadInventoryData();
		} catch {
			toast.error("Failed to save product.");
		} finally {
			setSubmittingProduct(false);
		}
	};

	const handleDeleteProduct = async (targetId: number) => {
		const confirmed = window.confirm("Delete this product?");
		if (!confirmed) return;

		try {
			await inventoryService.deleteProduct(targetId);
			toast.success("Product deleted.");
			await loadInventoryData();
			if (productId === targetId) {
				router.replace("/inventory/manage");
			}
		} catch {
			toast.error("Failed to delete product.");
		}
	};

	const handleSaveCategory = async () => {
		if (!categoryForm.name.trim()) {
			toast.error("Category name is required.");
			return;
		}

		setSubmittingCategory(true);
		try {
			if (categoryForm.id !== null) {
				await inventoryService.updateCategory(categoryForm.id, {
					name: categoryForm.name.trim(),
					description: categoryForm.description.trim() || undefined,
				});
				toast.success("Category updated.");
			} else {
				await inventoryService.createCategory({
					name: categoryForm.name.trim(),
					description: categoryForm.description.trim() || undefined,
				});
				toast.success("Category created.");
			}

			setCategoryForm(EMPTY_BASIC_ENTITY_FORM);
			const categoriesData = await inventoryService.getCategories();
			setCategories(categoriesData);
		} catch {
			toast.error("Failed to save category.");
		} finally {
			setSubmittingCategory(false);
		}
	};

	const handleDeleteCategory = async (targetId: number) => {
		const confirmed = window.confirm("Delete this category?");
		if (!confirmed) return;

		try {
			await inventoryService.deleteCategory(targetId);
			toast.success("Category deleted.");
			const categoriesData = await inventoryService.getCategories();
			setCategories(categoriesData);
			if (productForm.categoryId && Number(productForm.categoryId) === targetId) {
				handleProductField("categoryId", "");
			}
		} catch {
			toast.error("Failed to delete category.");
		}
	};

	const handleSaveUnit = async () => {
		if (!unitForm.name.trim()) {
			toast.error("Unit name is required.");
			return;
		}

		setSubmittingUnit(true);
		try {
			if (unitForm.id !== null) {
				await inventoryService.updateUnit(unitForm.id, {
					name: unitForm.name.trim(),
					description: unitForm.description.trim() || undefined,
				});
				toast.success("Unit updated.");
			} else {
				await inventoryService.createUnit({
					name: unitForm.name.trim(),
					description: unitForm.description.trim() || undefined,
				});
				toast.success("Unit created.");
			}

			setUnitForm(EMPTY_BASIC_ENTITY_FORM);
			const unitsData = await inventoryService.getUnits();
			setUnits(unitsData);
		} catch {
			toast.error("Failed to save unit.");
		} finally {
			setSubmittingUnit(false);
		}
	};

	const handleDeleteUnit = async (targetId: number) => {
		const confirmed = window.confirm("Delete this unit?");
		if (!confirmed) return;

		try {
			await inventoryService.deleteUnit(targetId);
			toast.success("Unit deleted.");
			const unitsData = await inventoryService.getUnits();
			setUnits(unitsData);
			if (productForm.unitId && Number(productForm.unitId) === targetId) {
				handleProductField("unitId", "");
			}
		} catch {
			toast.error("Failed to delete unit.");
		}
	};

	return (
		<div className="space-y-6 p-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-3xl font-bold">{isEditingProduct ? "Edit Product" : "Create Product"}</h1>
					<p className="mt-1 text-text-secondary">Manage products, categories and units from one place.</p>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" onClick={() => router.push("/inventory")}>
						<ArrowLeft className="h-4 w-4" /> Back to Inventory
					</Button>
					{isEditingProduct ? (
						<Button variant="secondary" onClick={() => router.replace("/inventory/manage")}>
							New Product
						</Button>
					) : null}
				</div>
			</div>

			<Card className="p-6">
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div className="space-y-2 md:col-span-2">
						<Label htmlFor="product-name">Name</Label>
						<Input
							id="product-name"
							value={productForm.name}
							onChange={(event) => handleProductField("name", event.target.value)}
							placeholder="Product name"
						/>
					</div>

					<div className="space-y-2 md:col-span-2">
						<Label htmlFor="product-description">Description</Label>
						<Textarea
							id="product-description"
							value={productForm.description}
							onChange={(event) => handleProductField("description", event.target.value)}
							placeholder="Optional product description"
						/>
					</div>

					<div className="space-y-2">
						<Label>Category</Label>
						<Select value={productForm.categoryId} onValueChange={(value) => handleProductField("categoryId", value)}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select category" />
							</SelectTrigger>
							<SelectContent>
								{categories.map((category) => (
									<SelectItem key={category.id} value={String(category.id)}>
										{category.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>Unit</Label>
						<Select value={productForm.unitId} onValueChange={(value) => handleProductField("unitId", value)}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select unit" />
							</SelectTrigger>
							<SelectContent>
								{units.map((unit) => (
									<SelectItem key={unit.id} value={String(unit.id)}>
										{unit.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label htmlFor="product-unit-qty">Unit Quantity</Label>
						<Input
							id="product-unit-qty"
							type="number"
							min={1}
							value={productForm.unitQty}
							onChange={(event) => handleProductField("unitQty", event.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<Label>Status</Label>
						<Select value={productForm.statusId} onValueChange={(value) => handleProductField("statusId", value)}>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={String(STATUS_ON_ID)}>On</SelectItem>
								<SelectItem value={String(STATUS_OFF_ID)}>Off</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className="mt-6 flex flex-wrap items-center gap-2">
					<Button onClick={() => void handleSaveProduct()} disabled={submittingProduct || loading}>
						{submittingProduct ? "Saving..." : isEditingProduct ? "Update Product" : "Create Product"}
					</Button>
					{isEditingProduct && productId !== null ? (
						<Button
							variant="destructive"
							onClick={() => void handleDeleteProduct(productId)}
							disabled={submittingProduct}
						>
							Delete Product
						</Button>
					) : null}
				</div>
			</Card>

			<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
				<Card className="p-6">
					<div className="mb-4 flex items-center justify-between">
						<h2 className="text-lg font-semibold">Categories</h2>
						<Badge variant="outline">{categories.length}</Badge>
					</div>

					<div className="space-y-3">
						<Input
							placeholder="Category name"
							value={categoryForm.name}
							onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: event.target.value }))}
						/>
						<Textarea
							placeholder="Description"
							value={categoryForm.description}
							onChange={(event) => setCategoryForm((prev) => ({ ...prev, description: event.target.value }))}
						/>
						<div className="flex items-center gap-2">
							<Button size="sm" onClick={() => void handleSaveCategory()} disabled={submittingCategory || loading}>
								{categoryForm.id !== null ? "Update" : "Add"}
							</Button>
							{categoryForm.id !== null ? (
								<Button size="sm" variant="outline" onClick={() => setCategoryForm(EMPTY_BASIC_ENTITY_FORM)}>
									Cancel
								</Button>
							) : null}
						</div>
					</div>

					<div className="mt-4 space-y-2">
						{categories.map((category) => (
							<div key={category.id} className="flex items-center justify-between rounded-md border p-3">
								<div>
									<p className="font-medium">{category.name}</p>
									<p className="text-sm text-text-secondary">{category.description || "—"}</p>
								</div>
								<div className="flex items-center gap-1">
									<Button
										size="icon"
										variant="outline"
										onClick={() =>
											setCategoryForm({
												id: category.id,
												name: category.name,
												description: category.description || "",
											})
										}
									>
										<Pencil className="h-4 w-4" />
									</Button>
									<Button size="icon" variant="destructive" onClick={() => void handleDeleteCategory(category.id)}>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							</div>
						))}
						{categories.length === 0 ? <p className="text-sm text-text-secondary">No categories yet.</p> : null}
					</div>
				</Card>

				<Card className="p-6">
					<div className="mb-4 flex items-center justify-between">
						<h2 className="text-lg font-semibold">Units</h2>
						<Badge variant="outline">{units.length}</Badge>
					</div>

					<div className="space-y-3">
						<Input
							placeholder="Unit name"
							value={unitForm.name}
							onChange={(event) => setUnitForm((prev) => ({ ...prev, name: event.target.value }))}
						/>
						<Textarea
							placeholder="Description"
							value={unitForm.description}
							onChange={(event) => setUnitForm((prev) => ({ ...prev, description: event.target.value }))}
						/>
						<div className="flex items-center gap-2">
							<Button size="sm" onClick={() => void handleSaveUnit()} disabled={submittingUnit || loading}>
								{unitForm.id !== null ? "Update" : "Add"}
							</Button>
							{unitForm.id !== null ? (
								<Button size="sm" variant="outline" onClick={() => setUnitForm(EMPTY_BASIC_ENTITY_FORM)}>
									Cancel
								</Button>
							) : null}
						</div>
					</div>

					<div className="mt-4 space-y-2">
						{units.map((unit) => (
							<div key={unit.id} className="flex items-center justify-between rounded-md border p-3">
								<div>
									<p className="font-medium">{unit.name}</p>
									<p className="text-sm text-text-secondary">{unit.description || "—"}</p>
								</div>
								<div className="flex items-center gap-1">
									<Button
										size="icon"
										variant="outline"
										onClick={() =>
											setUnitForm({
												id: unit.id,
												name: unit.name,
												description: unit.description || "",
											})
										}
									>
										<Pencil className="h-4 w-4" />
									</Button>
									<Button size="icon" variant="destructive" onClick={() => void handleDeleteUnit(unit.id)}>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							</div>
						))}
						{units.length === 0 ? <p className="text-sm text-text-secondary">No units yet.</p> : null}
					</div>
				</Card>
			</div>
			{loading ? <p className="text-sm text-text-secondary">Loading inventory data...</p> : null}
		</div>
	);
}
