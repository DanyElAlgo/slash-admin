import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import inventoryService from "@/api/services/inventoryService";
import type { Unit } from "@/types/entity";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";

export default function UnitsPage() {
	const [units, setUnits] = useState<Unit[]>([]);
	const [loading, setLoading] = useState(true);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
	const [formData, setFormData] = useState({ name: "", description: "" });

	const loadUnits = useCallback(async () => {
		setLoading(true);
		try {
			const data = await inventoryService.getUnits();
			setUnits(data);
		} catch (error) {
			toast.error("Failed to load units");
			console.error(error);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadUnits();
	}, [loadUnits]);

	const handleOpenDialog = (unit?: Unit) => {
		if (unit) {
			setEditingUnit(unit);
			setFormData({ name: unit.name, description: unit.description || "" });
		} else {
			setEditingUnit(null);
			setFormData({ name: "", description: "" });
		}
		setIsDialogOpen(true);
	};

	const handleCloseDialog = () => {
		setIsDialogOpen(false);
		setEditingUnit(null);
		setFormData({ name: "", description: "" });
	};

	const handleSave = async () => {
		if (!formData.name.trim()) {
			toast.error("Unit name is required");
			return;
		}

		try {
			if (editingUnit) {
				await inventoryService.updateUnit(editingUnit.id, formData);
				toast.success("Unit updated successfully");
			} else {
				const response = await inventoryService.getUnits();
				const isDuplicate = response.some((u) => u.name.toLowerCase() === formData.name.toLowerCase());
				if (isDuplicate) {
					toast.error("A unit with this name already exists");
					return;
				}
				await inventoryService.createUnit(formData);
				toast.success("Unit created successfully");
			}
			handleCloseDialog();
			loadUnits();
		} catch (error) {
			toast.error("Failed to save unit");
			console.error(error);
		}
	};

	const handleDelete = async (id: number) => {
		if (!confirm("Are you sure you want to delete this unit?")) return;

		try {
			await inventoryService.deleteUnit(id);
			toast.success("Unit deleted successfully");
			loadUnits();
		} catch (error) {
			toast.error("Failed to delete unit");
			console.error(error);
		}
	};

	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Units of Measure</h1>
				<Button onClick={() => handleOpenDialog()}>
					<Plus className="mr-2 h-4 w-4" />
					New Unit
				</Button>
			</div>

			<Card>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Description</TableHead>
							<TableHead className="w-32 text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell className="col-span-3 text-center py-8">Loading...</TableCell>
							</TableRow>
						) : units.length === 0 ? (
							<TableRow>
								<TableCell className="col-span-3 text-center py-8 text-muted-foreground">
									No units found. Create one to get started.
								</TableCell>
							</TableRow>
						) : (
							units.map((unit) => (
								<TableRow key={unit.id}>
									<TableCell className="font-medium">{unit.name}</TableCell>
									<TableCell>{unit.description}</TableCell>
									<TableCell className="text-right space-x-2">
										<Button variant="ghost" size="sm" onClick={() => handleOpenDialog(unit)}>
											<Pencil className="h-4 w-4" />
										</Button>
										<Button variant="ghost" size="sm" onClick={() => handleDelete(unit.id)}>
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
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{editingUnit ? "Edit Unit" : "New Unit"}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) => setFormData({ ...formData, name: e.target.value })}
								placeholder="e.g., Kilograms, Liters"
							/>
						</div>
						<div>
							<Label htmlFor="description">Description</Label>
							<Input
								id="description"
								value={formData.description}
								onChange={(e) => setFormData({ ...formData, description: e.target.value })}
								placeholder="Optional description"
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
