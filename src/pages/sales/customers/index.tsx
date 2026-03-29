import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import salesService, { type CustomerCreateDto } from "@/api/services/salesService";
import type { Customer } from "@/types/entity";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";

export default function CustomersPage() {
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [loading, setLoading] = useState(true);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
	const [formData, setFormData] = useState<CustomerCreateDto>({ name: "", phone: "" });

	const loadCustomers = useCallback(async () => {
		setLoading(true);
		try {
			const data = await salesService.getCustomers();
			setCustomers(data);
		} catch (error) {
			toast.error("Failed to load customers");
			console.error(error);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadCustomers();
	}, [loadCustomers]);

	const handleOpenDialog = (customer?: Customer) => {
		if (customer) {
			setEditingCustomer(customer);
			setFormData({ name: customer.name, phone: customer.phone || "" });
		} else {
			setEditingCustomer(null);
			setFormData({ name: "", phone: "" });
		}
		setIsDialogOpen(true);
	};

	const handleCloseDialog = () => {
		setIsDialogOpen(false);
		setEditingCustomer(null);
		setFormData({ name: "", phone: "" });
	};

	const handleSave = async () => {
		if (!formData.name.trim()) {
			toast.error("Customer name is required");
			return;
		}

		try {
			if (editingCustomer) {
				await salesService.updateCustomer(editingCustomer.id, formData);
				toast.success("Customer updated successfully");
			} else {
				await salesService.createCustomer(formData);
				toast.success("Customer created successfully");
			}
			handleCloseDialog();
			loadCustomers();
		} catch (error) {
			toast.error("Failed to save customer");
			console.error(error);
		}
	};

	const handleDelete = async (id: number) => {
		if (!confirm("Are you sure you want to delete this customer?")) return;

		try {
			await salesService.deleteCustomer(id);
			toast.success("Customer deleted successfully");
			loadCustomers();
		} catch (error) {
			toast.error("Failed to delete customer");
			console.error(error);
		}
	};

	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Customers</h1>
				<Button onClick={() => handleOpenDialog()}>
					<Plus className="mr-2 h-4 w-4" />
					New Customer
				</Button>
			</div>

			<Card>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>ID</TableHead>
							<TableHead>Name</TableHead>
							<TableHead>Phone</TableHead>
							<TableHead className="w-32 text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell className="col-span-4 text-center py-8">Loading...</TableCell>
							</TableRow>
						) : customers.length === 0 ? (
							<TableRow>
								<TableCell className="col-span-4 text-center py-8 text-muted-foreground">No customers yet.</TableCell>
							</TableRow>
						) : (
							customers.map((customer) => (
								<TableRow key={customer.id}>
									<TableCell className="text-muted-foreground">#{customer.id}</TableCell>
									<TableCell className="font-medium">{customer.name}</TableCell>
									<TableCell>{customer.phone || "—"}</TableCell>
									<TableCell className="text-right space-x-2">
										<Button variant="ghost" size="sm" onClick={() => handleOpenDialog(customer)}>
											<Pencil className="h-4 w-4" />
										</Button>
										<Button variant="ghost" size="sm" onClick={() => handleDelete(customer.id)}>
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
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>{editingCustomer ? "Edit Customer" : "New Customer"}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="name">Name *</Label>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) => setFormData({ ...formData, name: e.target.value })}
								placeholder="Customer name"
							/>
						</div>
						<div>
							<Label htmlFor="phone">Phone</Label>
							<Input
								id="phone"
								value={formData.phone}
								onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
								placeholder="e.g. +1 555 0123"
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
