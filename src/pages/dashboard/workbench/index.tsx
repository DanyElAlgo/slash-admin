import { Card } from "@/ui/card";
import { useUserInfo } from "@/store/userStore";
import { useInventoryActions } from "@/store/inventoryStore";

export default function Workbench() {
	const { getSummary } = useInventoryActions();
	const userInfo = useUserInfo();

	const userId = userInfo?.id || "";
	const summary = getSummary(userId);

	return (
		<div className="flex flex-col gap-4 w-full">
			<div>
				<h1 className="text-3xl font-bold">Main Dashboard</h1>
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
					<div className="text-sm font-medium text-text-secondary">Total Stock</div>
					<div className="mt-2 text-3xl font-bold">{summary.totalStock}</div>
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
		</div>
	);
}
