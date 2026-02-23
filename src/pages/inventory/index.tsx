import { useProducts, useInventoryActions } from "@/store/inventoryStore";
import { useUserInfo } from "@/store/userStore";
import { Card } from "@/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { Badge } from "@/ui/badge";

export default function InventoryDashboard() {
	const products = useProducts();
	const { getSummary } = useInventoryActions();
	const userInfo = useUserInfo();

	const userId = userInfo?.id || "";
	const summary = getSummary(userId);

	// Define grid columns: 2fr 1fr 1fr 1fr 1fr 1fr 1fr (proportional widths)
	const gridColsStyle = "grid-cols-9";
	const headerGridColsStyle = "grid-cols-9";

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold">Inventory Management</h1>
				<p className="text-text-secondary mt-1">
					Logged in as: <span className="font-semibold text-text-primary">{userInfo?.username}</span>
				</p>
			</div>

			{/* Summary Cards */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<Card className="p-6">
					<div className="text-sm font-medium text-text-secondary">Total Products</div>
					<div className="mt-2 text-3xl font-bold">{summary.totalProducts}</div>
				</Card>
				<Card className="p-6">
					<div className="text-sm font-medium text-text-secondary">Total Inventory Value</div>
					<div className="mt-2 text-3xl font-bold">${(summary.totalValue / 1000).toFixed(1)}k</div>
				</Card>
				<Card className="p-6">
					<div className="text-sm font-medium text-text-secondary">Low Stock Items</div>
					<div className="mt-2 text-3xl font-bold text-warning">{summary.lowStockCount}</div>
				</Card>
			</div>

			{/* Products Table */}
			<Card>
				<div className="p-6">
					<h2 className="text-xl font-semibold mb-4">Products</h2>
					<Table>
						<TableHeader className={gridColsStyle}>
							<TableRow className={headerGridColsStyle}>
								<TableHead className="col-span-2">Product Name</TableHead>
								<TableHead>ID</TableHead>
								<TableHead>Warehouse (debug)</TableHead>
								<TableHead>Quantity</TableHead>
								<TableHead>Price</TableHead>
								<TableHead>Total Value</TableHead>
								<TableHead>Category</TableHead>
								<TableHead>Stock Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{products.length === 0 ? (
								<TableRow className={gridColsStyle}>
									<TableCell className="text-center py-8 text-text-secondary">No products found</TableCell>
								</TableRow>
							) : (
								products.map((product) => (
									<TableRow key={product.id} className={gridColsStyle}>
										<TableCell className="col-span-2 font-medium">{product.name}</TableCell>
										<TableCell className="text-ellipsis overflow-hidden whitespace-nowrap">{product.id}</TableCell>
										<TableCell>{product.warehouseId}</TableCell>
										<TableCell>{product.quantity}</TableCell>
										<TableCell>${product.price}</TableCell>
										<TableCell>${(product.quantity * product.price).toLocaleString()}</TableCell>
										<TableCell>{product.category}</TableCell>
										<TableCell className="flex justify-center">
											{product.quantity < 10 ? (
												<Badge className="bg-warning text-white">Low Stock</Badge>
											) : (
												<Badge className="bg-success text-white">In Stock</Badge>
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
