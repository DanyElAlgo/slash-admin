import { useCurrentBusiness } from "@/store/userStore";
import { Card } from "@/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";

export default function PaymentsPage() {
	const business = useCurrentBusiness();

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-3xl font-bold">Payments</h1>
				<p className="text-text-secondary mt-1">
					Payment history for <span className="font-semibold text-text-primary">{business?.name ?? "—"}</span>
				</p>
			</div>

			<Card>
				<div className="p-6">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Payment #</TableHead>
								<TableHead>Order #</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Paid At</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							<TableRow>
								<TableCell className="col-span-full text-center py-8 text-text-secondary">
									No payments recorded yet.
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</div>
			</Card>
		</div>
	);
}
