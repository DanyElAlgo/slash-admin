import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import purchasesService from "@/api/services/purchasesService";
import BusinessGate from "@/components/business-gate";
import { useCurrentBusiness } from "@/store/userStore";
import type { Supplier } from "@/types/entity";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";

type SupplierFormState = {
	name: string;
	contactEmail: string;
	contactPhone: string;
};

const EMPTY_FORM: SupplierFormState = {
	name: "",
	contactEmail: "",
	contactPhone: "",
};

export default function SuppliersPage() {
	const business = useCurrentBusiness();

	const [suppliers, setSuppliers] = useState<Supplier[]>([]);
	const [loading, setLoading] = useState(true);

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editing, setEditing] = useState<Supplier | null>(null);
	const [form, setForm] = useState<SupplierFormState>(EMPTY_FORM);
	const [saving, setSaving] = useState(false);

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

	const handleOpenCreate = () => {
		setEditing(null);
		setForm(EMPTY_FORM);
		setDialogOpen(true);
	};

	const handleOpenEdit = (supplier: Supplier) => {
		setEditing(supplier);
		setForm({
			name: supplier.name,
			contactEmail: "",
			contactPhone: "",
		});
		setDialogOpen(true);
	};

	const handleSave = async () => {
		if (!business?.companyCen) return;
		if (!form.name.trim()) {
			toast.error("Name is required.");
			return;
		}

		setSaving(true);
		try {
			if (editing) {
				await purchasesService.updateSupplier(business.companyCen, editing.supplierCen, {
					name: form.name.trim(),
					contactEmail: form.contactEmail.trim() || undefined,
					contactPhone: form.contactPhone.trim() || undefined,
					isActive: true,
				});
				toast.success("Supplier updated.");
			} else {
				await purchasesService.createSupplier(business.companyCen, {
					name: form.name.trim(),
					contactEmail: form.contactEmail.trim() || undefined,
					contactPhone: form.contactPhone.trim() || undefined,
				});
				toast.success("Supplier created.");
			}
			setDialogOpen(false);
			setEditing(null);
			setForm(EMPTY_FORM);
			await load();
		} catch {
			// apiClient already toasts
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async (supplier: Supplier) => {
		if (!business?.companyCen) return;
		if (!confirm(`Deactivate supplier "${supplier.name}"?`)) return;
		try {
			await purchasesService.deleteSupplier(business.companyCen, supplier.supplierCen);
			toast.success("Supplier deactivated.");
			await load();
		} catch {
			// apiClient already toasts
		}
	};

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
						<Button onClick={handleOpenCreate}>
							<Plus className="mr-2 h-4 w-4" /> New Supplier
						</Button>
					</div>
				</div>

				<Card className="p-6 space-y-4">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>CEN</TableHead>
								<TableHead>Name</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{loading ? (
								<TableRow>
									<TableCell className="col-span-3 text-center py-6">Loading...</TableCell>
								</TableRow>
							) : suppliers.length === 0 ? (
								<TableRow>
									<TableCell className="col-span-3 text-center py-6 text-muted-foreground">No suppliers yet.</TableCell>
								</TableRow>
							) : (
								suppliers.map((supplier) => (
									<TableRow key={supplier.supplierCen}>
										<TableCell className="text-xs text-muted-foreground">{supplier.supplierCen}</TableCell>
										<TableCell className="font-medium">{supplier.name}</TableCell>
										<TableCell className="text-right space-x-1">
											<Button variant="ghost" size="sm" onClick={() => handleOpenEdit(supplier)}>
												<Pencil className="h-4 w-4" />
											</Button>
											<Button variant="ghost" size="sm" onClick={() => handleDelete(supplier)}>
												<Trash2 className="h-4 w-4" />
											</Button>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</Card>
			</div>

			<Dialog
				open={dialogOpen}
				onOpenChange={(open) => {
					setDialogOpen(open);
					if (!open) {
						setEditing(null);
						setForm(EMPTY_FORM);
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{editing ? "Edit Supplier" : "New Supplier"}</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div>
							<Label>Name *</Label>
							<Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
						</div>
						<div>
							<Label>Contact email</Label>
							<Input
								type="email"
								value={form.contactEmail}
								onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
							/>
						</div>
						<div>
							<Label>Contact phone</Label>
							<Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
						</div>
						<div className="flex justify-end gap-2">
							<Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
								Cancel
							</Button>
							<Button onClick={handleSave} disabled={saving}>
								{saving ? "Saving..." : "Save"}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</BusinessGate>
	);
}
