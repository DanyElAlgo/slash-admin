import { Plus } from "lucide-react";
import { useCurrentBusiness } from "@/store/userStore";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";

export default function CustomersPage() {
	const business = useCurrentBusiness();

	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Customers</h1>
					<p className="text-text-secondary mt-1">
						Manage customers for <span className="font-semibold text-text-primary">{business?.name ?? "—"}</span>
					</p>
				</div>
				<Button>
					<Plus className="mr-2 h-4 w-4" /> Add Customer
				</Button>
			</div>

			<Card>
				<div className="p-6">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>ID</TableHead>
								<TableHead>Name</TableHead>
								<TableHead>Phone</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							<TableRow>
								<TableCell className="col-span-full text-center py-8 text-text-secondary">No customers yet.</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</div>
			</Card>
		</div>
	);
}
