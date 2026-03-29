import { Package } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import inventoryService from "@/api/services/inventoryService";
import type { Product, Warehouse, WarehouseProduct } from "@/types/entity";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { Textarea } from "@/ui/textarea";

type StockAction = "set" | "add" | "remove";

export default function StockManagementPage() {
	const [warehouseProducts, setWarehouseProducts] = useState<WarehouseProduct[]>([]);
	const [products, setProducts] = useState<Product[]>([]);
	const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
	const [loading, setLoading] = useState(true);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [dialogMode, setDialogMode] = useState<StockAction>("set");
	const [selectedWarehouseProduct, setSelectedWarehouseProduct] = useState<WarehouseProduct | null>(null);
	const [searchTerm, setSearchTerm] = useState("");

	const [formData, setFormData] = useState({
		quantity: "",
		reason: "",
	});

	const loadData = useCallback(async () => {
		setLoading(true);
		try {
			const [warehouseProductsData, productsData, warehousesData] = await Promise.all([
				inventoryService.getWarehouseProducts(),
				inventoryService.getProducts(),
				inventoryService.getWarehouses(),
			]);
			setWarehouseProducts(warehouseProductsData);
			setProducts(productsData);
			setWarehouses(warehousesData);
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

	const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
	const warehouseMap = useMemo(() => new Map(warehouses.map((w) => [w.id, w.name])), [warehouses]);

	const filteredWarehouseProducts = useMemo(() => {
		return warehouseProducts.filter((wp) => {
			const product = productMap.get(wp.productId);
			return !searchTerm || product?.name.toLowerCase().includes(searchTerm.toLowerCase());
		});
	}, [warehouseProducts, searchTerm, productMap]);

	const handleOpenDialog = (warehouseProduct: WarehouseProduct, mode: StockAction) => {
		setSelectedWarehouseProduct(warehouseProduct);
		setDialogMode(mode);
		setFormData({
			quantity: "",
			reason: mode === "set" ? "Initial stock" : "",
		});
		setIsDialogOpen(true);
	};

	const handleCloseDialog = () => {
		setIsDialogOpen(false);
		setSelectedWarehouseProduct(null);
		setFormData({ quantity: "", reason: "" });
	};

	const handleSave = async () => {
		if (!formData.quantity || Number(formData.quantity) <= 0) {
			toast.error("Quantity must be greater than 0");
			return;
		}
		if (!formData.reason.trim()) {
			toast.error("Reason is required");
			return;
		}
		if (dialogMode !== "set" && Number(formData.quantity) > 1000000) {
			toast.error("Quantity exceeds maximum limit");
			return;
		}

		if (!selectedWarehouseProduct) return;

		try {
			const quantity = Number(formData.quantity);

			if (dialogMode === "set") {
				await inventoryService.setStock({
					productId: selectedWarehouseProduct.productId,
					warehouseId: selectedWarehouseProduct.warehouseId,
					quantity,
					reason: formData.reason,
				});
			} else if (dialogMode === "add") {
				await inventoryService.addStock({
					productId: selectedWarehouseProduct.productId,
					warehouseId: selectedWarehouseProduct.warehouseId,
					quantity,
					reason: formData.reason,
				});
			} else {
				const currentStock = selectedWarehouseProduct.stockLeft || 0;
				if (quantity > currentStock) {
					toast.error(`Cannot remove ${quantity} units. Current stock: ${currentStock}`);
					return;
				}
				await inventoryService.subtractStock({
					productId: selectedWarehouseProduct.productId,
					warehouseId: selectedWarehouseProduct.warehouseId,
					quantity,
					reason: formData.reason,
				});
			}

			toast.success("Stock updated successfully");
			handleCloseDialog();
			loadData();
		} catch (error) {
			toast.error("Failed to update stock");
			console.error(error);
		}
	};

	const handleToggleOutOfStock = async (wp: WarehouseProduct) => {
		const newValue = !wp.isOutOfStock;
		try {
			await inventoryService.setOutOfStock(wp.warehouseId, wp.productId, newValue);
			toast.success(newValue ? "Product marked as out of stock" : "Product marked as available");
			loadData();
		} catch (error) {
			toast.error("Failed to update out of stock status");
			console.error(error);
		}
	};

	const getStockStatus = (warehouseProduct: WarehouseProduct) => {
		if (warehouseProduct.isOutOfStock) {
			return <Badge variant="destructive">Out of Stock</Badge>;
		}
		const stock = warehouseProduct.stockLeft || 0;
		const lowStock = warehouseProduct.lowStockQty || 10;
		if (stock <= lowStock) {
			return <Badge variant="secondary">Low Stock</Badge>;
		}
		return <Badge variant="default">In Stock</Badge>;
	};

	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Stock Management</h1>
			</div>

			<Card className="p-4">
				<Input
					placeholder="Search by product name..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
				/>
			</Card>

			<Card>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Product</TableHead>
							<TableHead>Warehouse</TableHead>
							<TableHead className="text-right">Stock</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="w-56 text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell className="col-span-5 text-center py-8">Loading...</TableCell>
							</TableRow>
						) : filteredWarehouseProducts.length === 0 ? (
							<TableRow>
								<TableCell className="col-span-5 text-center py-8 text-muted-foreground">No products found.</TableCell>
							</TableRow>
						) : (
							filteredWarehouseProducts.map((wp) => {
								const product = productMap.get(wp.productId);
								return (
									<TableRow key={wp.id}>
										<TableCell className="font-medium flex items-center gap-2">
											<Package className="h-4 w-4" />
											{product?.name}
										</TableCell>
										<TableCell>{warehouseMap.get(wp.warehouseId)}</TableCell>
										<TableCell className="text-right font-semibold">{wp.stockLeft || 0}</TableCell>
										<TableCell>{getStockStatus(wp)}</TableCell>
										<TableCell className="text-right space-x-1">
											<Button variant="ghost" size="sm" onClick={() => handleOpenDialog(wp, "set")}>
												Set
											</Button>
											<Button variant="ghost" size="sm" onClick={() => handleOpenDialog(wp, "add")}>
												+Add
											</Button>
											<Button variant="ghost" size="sm" onClick={() => handleOpenDialog(wp, "remove")}>
												-Remove
											</Button>
											<Button
												variant={wp.isOutOfStock ? "outline" : "destructive"}
												size="sm"
												onClick={() => handleToggleOutOfStock(wp)}
											>
												{wp.isOutOfStock ? "Available" : "Agotado"}
											</Button>
										</TableCell>
									</TableRow>
								);
							})
						)}
					</TableBody>
				</Table>
			</Card>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>
							{dialogMode === "set" ? "Set Stock" : dialogMode === "add" ? "Add Stock" : "Remove Stock"}
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						{selectedWarehouseProduct && (
							<>
								<div className="p-3 bg-muted rounded">
									<p className="text-sm font-medium">{productMap.get(selectedWarehouseProduct.productId)?.name}</p>
									<p className="text-xs text-muted-foreground">
										{warehouseMap.get(selectedWarehouseProduct.warehouseId)}
									</p>
									<p className="text-xs text-muted-foreground mt-1">
										Current stock: {selectedWarehouseProduct.stockLeft || 0}
									</p>
								</div>

								<div>
									<Label htmlFor="quantity">{dialogMode === "set" ? "Set Quantity" : "Quantity"} *</Label>
									<Input
										id="quantity"
										type="number"
										min="0"
										step="1"
										value={formData.quantity}
										onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
										placeholder={dialogMode === "set" ? "100" : "10"}
									/>
								</div>

								<div>
									<Label htmlFor="reason">Reason/Notes *</Label>
									<Textarea
										id="reason"
										value={formData.reason}
										onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
										placeholder="Why are you making this adjustment?"
										rows={3}
									/>
								</div>

								<div className="flex gap-2 justify-end">
									<Button variant="outline" onClick={handleCloseDialog}>
										Cancel
									</Button>
									<Button onClick={handleSave}>Save</Button>
								</div>
							</>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
