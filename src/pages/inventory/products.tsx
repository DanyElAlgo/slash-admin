import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import inventoryService, { type ProductCreateDto } from "@/api/services/inventoryService";
import type { Category, Product, Unit } from "@/types/entity";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Switch } from "@/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { Textarea } from "@/ui/textarea";

export default function ProductsPage() {
	const [products, setProducts] = useState<Product[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [units, setUnits] = useState<Unit[]>([]);
	const [loading, setLoading] = useState(true);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingProduct, setEditingProduct] = useState<Product | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("all");
	const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

	const [formData, setFormData] = useState<ProductCreateDto>({
		name: "",
		description: "",
		categoryId: undefined,
		unitId: undefined,
		unitQty: 1,
		price: 1,
		isActive: true,
	});

	const loadData = useCallback(async () => {
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
		} catch (error) {
			toast.error("Failed to load data");
			console.error(error);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
	const unitMap = useMemo(() => new Map(units.map((u) => [u.id, u.name])), [units]);

	const filteredProducts = useMemo(() => {
		return products.filter((product) => {
			const matchesSearch = !searchTerm || product.name.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesCategory = categoryFilter === "all" || product.categoryId === Number(categoryFilter);
			const matchesStatus =
				statusFilter === "all" ||
				(statusFilter === "active" && product.isActive) ||
				(statusFilter === "inactive" && !product.isActive);

			return matchesSearch && matchesCategory && matchesStatus;
		});
	}, [products, searchTerm, categoryFilter, statusFilter]);

	const handleOpenDialog = (product?: Product) => {
		if (product) {
			setEditingProduct(product);
			setFormData({
				name: product.name,
				description: product.description || "",
				categoryId: product.categoryId,
				unitId: product.unitId,
				unitQty: product.unitQty || 1,
				price: product.price,
				isActive: product.isActive,
			});
		} else {
			setEditingProduct(null);
			setFormData({
				name: "",
				description: "",
				categoryId: undefined,
				unitId: undefined,
				unitQty: 1,
				price: 1,
				isActive: true,
			});
		}
		setIsDialogOpen(true);
	};

	const handleCloseDialog = () => {
		setIsDialogOpen(false);
		setEditingProduct(null);
		setFormData({
			name: "",
			description: "",
			categoryId: undefined,
			unitId: undefined,
			unitQty: 1,
			price: 1,
			isActive: true,
		});
	};

	const handleSave = async () => {
		if (!formData.name.trim()) {
			toast.error("Product name is required");
			return;
		}
		if (!formData.categoryId) {
			toast.error("Category is required");
			return;
		}
		if (!formData.unitId) {
			toast.error("Unit is required");
			return;
		}
		if (!formData.unitQty || formData.unitQty <= 0) {
			toast.error("Valid unit quantity is required");
			return;
		}
		if (!formData.price || formData.price <= 0) {
			toast.error("Valid price is required");
			return;
		}

		try {
			if (editingProduct) {
				await inventoryService.updateProduct(editingProduct.id, formData);
				toast.success("Product updated successfully");
			} else {
				await inventoryService.createProduct(formData);
				toast.success("Product created successfully");
			}
			handleCloseDialog();
			loadData();
		} catch (error) {
			toast.error("Failed to save product");
			console.error(error);
		}
	};

	const handleDelete = async (id: number) => {
		if (!confirm("Are you sure you want to delete this product?")) return;

		try {
			await inventoryService.deleteProduct(id);
			toast.success("Product deleted successfully");
			loadData();
		} catch (error) {
			toast.error("Failed to delete product");
			console.error(error);
		}
	};

	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Products</h1>
				<Button onClick={() => handleOpenDialog()}>
					<Plus className="mr-2 h-4 w-4" />
					New Product
				</Button>
			</div>

			<Card className="p-4">
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<Input placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
					<Select value={categoryFilter} onValueChange={setCategoryFilter}>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Categories</SelectItem>
							{categories.map((category) => (
								<SelectItem key={category.id} value={category.id.toString()}>
									{category.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Status</SelectItem>
							<SelectItem value="active">Active</SelectItem>
							<SelectItem value="inactive">Inactive</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</Card>

			<Card>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Category</TableHead>
							<TableHead>Unit</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="w-32 text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell className="col-span-5 text-center py-8">Loading...</TableCell>
							</TableRow>
						) : filteredProducts.length === 0 ? (
							<TableRow>
								<TableCell className="col-span-5 text-center py-8 text-muted-foreground">No products found.</TableCell>
							</TableRow>
						) : (
							filteredProducts.map((product) => (
								<TableRow key={product.id}>
									<TableCell className="font-medium">{product.name}</TableCell>
									<TableCell>{categoryMap.get(product.categoryId || 0)}</TableCell>
									<TableCell>{unitMap.get(product.unitId || 0)}</TableCell>
									<TableCell>
										<Badge variant={product.isActive ? "default" : "secondary"}>
											{product.isActive ? "Active" : "Inactive"}
										</Badge>
									</TableCell>
									<TableCell className="text-right space-x-2">
										<Button variant="ghost" size="sm" onClick={() => handleOpenDialog(product)}>
											<Pencil className="h-4 w-4" />
										</Button>
										<Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)}>
											<Trash2 className="h-4 w-4" />
										</Button>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</Card>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>{editingProduct ? "Edit Product" : "New Product"}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="name">Name *</Label>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) => setFormData({ ...formData, name: e.target.value })}
								placeholder="Product name"
							/>
						</div>
						<div>
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								value={formData.description}
								onChange={(e) => setFormData({ ...formData, description: e.target.value })}
								placeholder="Product description"
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="category">Category *</Label>
								<Select
									value={formData.categoryId?.toString() || ""}
									onValueChange={(v) => setFormData({ ...formData, categoryId: Number(v) })}
								>
									<SelectTrigger id="category">
										<SelectValue placeholder="Select..." />
									</SelectTrigger>
									<SelectContent>
										{categories.map((category) => (
											<SelectItem key={category.id} value={category.id.toString()}>
												{category.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div>
								<Label htmlFor="unit">Unit *</Label>
								<Select
									value={formData.unitId?.toString() || ""}
									onValueChange={(v) => setFormData({ ...formData, unitId: Number(v) })}
								>
									<SelectTrigger id="unit">
										<SelectValue placeholder="Select..." />
									</SelectTrigger>
									<SelectContent>
										{units.map((unit) => (
											<SelectItem key={unit.id} value={unit.id.toString()}>
												{unit.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
						<div>
							<Label htmlFor="unitQty">Unit Quantity *</Label>
							<Input
								id="unitQty"
								type="number"
								min="0.1"
								step="0.1"
								value={formData.unitQty || 1}
								onChange={(e) =>
									setFormData({
										...formData,
										unitQty: parseFloat(e.target.value) || 1,
									})
								}
								placeholder="1"
							/>
						</div>
						<div>
							<Label htmlFor="price">Price *</Label>
							<Input
								id="price"
								type="number"
								min="0.01"
								step="0.01"
								value={formData.price || 1}
								onChange={(e) =>
									setFormData({
										...formData,
										price: parseFloat(e.target.value) || 1,
									})
								}
								placeholder="0.00"
							/>
						</div>
						<div className="flex items-center justify-between">
							<Label htmlFor="isActive">Active</Label>
							<Switch
								id="isActive"
								checked={formData.isActive}
								onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
							/>
						</div>
						<div className="flex gap-2 justify-end">
							<Button variant="outline" onClick={handleCloseDialog}>
								Cancel
							</Button>
							<Button onClick={handleSave}>Save</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
