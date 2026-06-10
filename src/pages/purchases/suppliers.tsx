import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import purchasesService from "@/api/services/purchasesService";
import BusinessGate from "@/components/business-gate";
import { useCurrentBusiness } from "@/store/userStore";
import type { Supplier } from "@/types/entity";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";

export default function SuppliersPage() {
	const business = useCurrentBusiness();

	const [suppliers, setSuppliers] = useState<Supplier[]>([]);
	const [loading, setLoading] = useState(true);

	const load = useCallback(async () => {
		if (!business?.companyCen) return;
		setLoading(true);
		try {
			const data = await purchasesService.listSuppliers(business.companyCen);
			setSuppliers(data ?? []);
		} catch {
			toast.error("Failed to load suppliers.");
		} finally {
			setLoading(false);
		}
	}, [business?.companyCen]);

	useEffect(() => {
		void load();
	}, [load]);

	return (
		<BusinessGate>
			<div className="space-y-6 p-6">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h1 className="text-3xl font-bold">Suppliers</h1>
						<p className="mt-1 text-text-secondary">
							Company: <span className="font-semibold text-text-primary">{business?.name ?? "—"}</span>
						</p>
					</div>
					<div className="flex gap-2">
						<Button variant="outline" onClick={() => void load()} disabled={loading}>
							<RefreshCw className="mr-2 h-4 w-4" /> Refresh
						</Button>
					</div>
				</div>

				<Card className="p-6 space-y-4">
					<Table>
						<TableHeader>
							<TableRow className="grid-cols-2 items-center">
								<TableHead className="col-span-1">CEN</TableHead>
								<TableHead className="col-span-1">Name</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{loading ? (
								<TableRow>
									<TableCell className="col-span-2 text-center py-6">Loading...</TableCell>
								</TableRow>
							) : suppliers.length === 0 ? (
								<TableRow>
									<TableCell className="col-span-2 text-center py-6 text-muted-foreground">No suppliers yet.</TableCell>
								</TableRow>
							) : (
								suppliers.map((supplier) => (
									<TableRow className="grid-cols-2 items-center" key={supplier.supplierCen}>
										<TableCell className="text-xs text-muted-foreground col-span-1">{supplier.supplierCen}</TableCell>
										<TableCell className="font-medium col-span-1">{supplier.name}</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</Card>
			</div>
		</BusinessGate>
	);
}
