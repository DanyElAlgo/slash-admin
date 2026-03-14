import { Plus } from "lucide-react";
import { useCurrentBusiness } from "@/store/userStore";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";

export default function OrdersPage() {
	const business = useCurrentBusiness();

	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Orders</h1>
					<p className="text-text-secondary mt-1">
						Manage order tickets for <span className="font-semibold text-text-primary">{business?.name ?? "—"}</span>
					</p>
				</div>
				<Button>
					<Plus className="mr-2 h-4 w-4" /> New Order
				</Button>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<Card className="p-6">
					<div className="text-sm font-medium text-text-secondary">Total Orders</div>
					<div className="mt-2 text-3xl font-bold">0</div>
				</Card>
				<Card className="p-6">
					<div className="text-sm font-medium text-text-secondary">Pending</div>
					<div className="mt-2 text-3xl font-bold text-warning">0</div>
				</Card>
				<Card className="p-6">
					<div className="text-sm font-medium text-text-secondary">Completed Today</div>
					<div className="mt-2 text-3xl font-bold text-success">0</div>
				</Card>
			</div>

			<Card>
				<div className="p-6">
					<h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Order #</TableHead>
								<TableHead>Customer</TableHead>
								<TableHead>Items</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							<TableRow>
								<TableCell className="col-span-full text-center py-8 text-text-secondary">
									No orders yet. Create your first order to get started.
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</div>
			</Card>
		</div>
	);
}
