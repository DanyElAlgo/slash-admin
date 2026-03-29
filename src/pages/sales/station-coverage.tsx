import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import inventoryService from "@/api/services/inventoryService";
import stationService from "@/api/services/stationService";
import type { Category, Station, StationTypeWithDetails } from "@/types/entity";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Textarea } from "@/ui/textarea";

export default function StationCoveragePage() {
	const [stationTypes, setStationTypes] = useState<StationTypeWithDetails[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [selectedType, setSelectedType] = useState<StationTypeWithDetails | null>(null);
	const [loading, setLoading] = useState(true);

	// Coverage pending save (debounced)
	const [pendingCoverage, setPendingCoverage] = useState<number[] | null>(null);
	const [savingCoverage, setSavingCoverage] = useState(false);

	// Dialogs
	const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
	const [isStationDialogOpen, setIsStationDialogOpen] = useState(false);
	const [editingType, setEditingType] = useState<StationTypeWithDetails | null>(null);

	const [typeForm, setTypeForm] = useState({ name: "", description: "" });
	const [stationForm, setStationForm] = useState({ name: "" });

	const loadData = useCallback(async () => {
		setLoading(true);
		try {
			const [typesData, catsData] = await Promise.all([
				stationService.getStationTypes(),
				inventoryService.getCategories(),
			]);
			setStationTypes(typesData);
			setCategories(catsData);
			// Refresh selected type if still exists
			if (selectedType) {
				const refreshed = typesData.find((t) => t.id === selectedType.id);
				setSelectedType(refreshed ?? null);
			}
		} catch (error) {
			toast.error("Failed to load data");
			console.error(error);
		} finally {
			setLoading(false);
		}
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		loadData();
	}, [loadData]);

	// Save coverage when pendingCoverage changes (debounced 400ms)
	useEffect(() => {
		if (pendingCoverage === null || !selectedType) return;
		const timer = setTimeout(async () => {
			setSavingCoverage(true);
			try {
				await stationService.setCoverage(selectedType.id, pendingCoverage);
				setSelectedType((prev) => (prev ? { ...prev, categoryIds: pendingCoverage } : prev));
				setStationTypes((prev) =>
					prev.map((t) => (t.id === selectedType.id ? { ...t, categoryIds: pendingCoverage } : t)),
				);
				toast.success("Coverage updated");
			} catch (error) {
				toast.error("Failed to update coverage");
				console.error(error);
			} finally {
				setSavingCoverage(false);
			}
			setPendingCoverage(null);
		}, 400);
		return () => clearTimeout(timer);
	}, [pendingCoverage, selectedType]);

	const handleSelectType = (type: StationTypeWithDetails) => {
		setSelectedType(type);
		setPendingCoverage(null);
	};

	const handleToggleCategory = (categoryId: number) => {
		if (!selectedType) return;
		const current = pendingCoverage ?? selectedType.categoryIds;
		const next = current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId];
		setPendingCoverage(next);
	};

	const getEffectiveCoverage = () => {
		if (!selectedType) return [];
		return pendingCoverage ?? selectedType.categoryIds;
	};

	const handleOpenTypeDialog = (type?: StationTypeWithDetails) => {
		if (type) {
			setEditingType(type);
			setTypeForm({ name: type.name, description: type.description ?? "" });
		} else {
			setEditingType(null);
			setTypeForm({ name: "", description: "" });
		}
		setIsTypeDialogOpen(true);
	};

	const handleSaveType = async () => {
		if (!typeForm.name.trim()) {
			toast.error("Name is required");
			return;
		}
		try {
			if (editingType) {
				const updated = await stationService.updateStationType(editingType.id, typeForm);
				setStationTypes((prev) => prev.map((t) => (t.id === editingType.id ? updated : t)));
				if (selectedType?.id === editingType.id) setSelectedType(updated);
				toast.success("Station type updated");
			} else {
				const created = await stationService.createStationType(typeForm);
				setStationTypes((prev) => [...prev, created]);
				toast.success("Station type created");
			}
			setIsTypeDialogOpen(false);
		} catch (error) {
			toast.error("Failed to save station type");
			console.error(error);
		}
	};

	const handleDeleteType = async (type: StationTypeWithDetails) => {
		if (type.stations.length > 0) {
			toast.error("Cannot delete a type that has stations. Remove stations first.");
			return;
		}
		if (!confirm(`Delete station type "${type.name}"?`)) return;
		try {
			await stationService.deleteStationType(type.id);
			setStationTypes((prev) => prev.filter((t) => t.id !== type.id));
			if (selectedType?.id === type.id) setSelectedType(null);
			toast.success("Station type deleted");
		} catch (error) {
			toast.error("Failed to delete station type");
			console.error(error);
		}
	};

	const handleCreateStation = async () => {
		if (!selectedType || !stationForm.name.trim()) {
			toast.error("Station name is required");
			return;
		}
		try {
			const created = await stationService.createStation({
				name: stationForm.name,
				typeId: selectedType.id,
			});
			const updatedStations = [...selectedType.stations, created as Station];
			const updated = { ...selectedType, stations: updatedStations };
			setSelectedType(updated);
			setStationTypes((prev) => prev.map((t) => (t.id === selectedType.id ? updated : t)));
			setStationForm({ name: "" });
			setIsStationDialogOpen(false);
			toast.success("Station created");
		} catch (error) {
			toast.error("Failed to create station");
			console.error(error);
		}
	};

	const handleDeleteStation = async (station: Station) => {
		if (!selectedType) return;
		if (!confirm(`Delete station "${station.name}"?`)) return;
		try {
			await stationService.deleteStation(station.id);
			const updatedStations = selectedType.stations.filter((s) => s.id !== station.id);
			const updated = { ...selectedType, stations: updatedStations };
			setSelectedType(updated);
			setStationTypes((prev) => prev.map((t) => (t.id === selectedType.id ? updated : t)));
			toast.success("Station deleted");
		} catch (error) {
			toast.error("Failed to delete station");
			console.error(error);
		}
	};

	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Station Coverage</h1>
					<p className="text-muted-foreground text-sm">
						Assign product categories to kitchen/bar station types to control KDS routing.
					</p>
				</div>
			</div>

			<div className="grid grid-cols-3 gap-6">
				{/* Left: Station Types list */}
				<div className="col-span-1 space-y-2">
					<div className="flex items-center justify-between mb-1">
						<span className="text-sm font-semibold">Station Types</span>
						<Button size="sm" variant="outline" onClick={() => handleOpenTypeDialog()}>
							<Plus className="h-3 w-3 mr-1" />
							Add
						</Button>
					</div>

					{loading ? (
						<p className="text-muted-foreground text-sm">Loading...</p>
					) : stationTypes.length === 0 ? (
						<p className="text-muted-foreground text-sm">No station types yet.</p>
					) : (
						stationTypes.map((type) => (
							<div
								key={type.id}
								className={`flex items-center justify-between rounded border p-3 cursor-pointer transition ${
									selectedType?.id === type.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
								}`}
								onClick={() => handleSelectType(type)}
							>
								<div>
									<p className="font-medium text-sm">{type.name}</p>
									<p className="text-xs text-muted-foreground">
										{type.stations.length} station{type.stations.length !== 1 ? "s" : ""} · {type.categoryIds.length}{" "}
										categories
									</p>
								</div>
								<div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
									<Button variant="ghost" size="sm" onClick={() => handleOpenTypeDialog(type)}>
										<Pencil className="h-3 w-3" />
									</Button>
									<Button variant="ghost" size="sm" onClick={() => handleDeleteType(type)}>
										<Trash2 className="h-3 w-3" />
									</Button>
								</div>
							</div>
						))
					)}
				</div>

				{/* Right: Type details */}
				<div className="col-span-2">
					{selectedType ? (
						<div className="space-y-6">
							{/* Stations */}
							<Card className="p-4">
								<div className="flex items-center justify-between mb-3">
									<h3 className="font-semibold">Stations — {selectedType.name}</h3>
									<Button size="sm" variant="outline" onClick={() => setIsStationDialogOpen(true)}>
										<Plus className="h-3 w-3 mr-1" />
										Add Station
									</Button>
								</div>

								{selectedType.stations.length === 0 ? (
									<p className="text-muted-foreground text-sm">No stations for this type.</p>
								) : (
									<div className="space-y-2">
										{selectedType.stations.map((station) => (
											<div
												key={station.id}
												className="flex items-center justify-between rounded border border-border p-2"
											>
												<span className="text-sm font-medium">{station.name}</span>
												<Button variant="ghost" size="sm" onClick={() => handleDeleteStation(station)}>
													<Trash2 className="h-3 w-3" />
												</Button>
											</div>
										))}
									</div>
								)}
							</Card>

							{/* Category Coverage */}
							<Card className="p-4">
								<div className="flex items-center justify-between mb-3">
									<h3 className="font-semibold">Category Coverage</h3>
									{savingCoverage && <span className="text-xs text-muted-foreground">Saving...</span>}
								</div>
								<p className="text-xs text-muted-foreground mb-3">
									Products in these categories will be routed to <strong>{selectedType.name}</strong> when sending
									commands.
								</p>

								{categories.length === 0 ? (
									<p className="text-muted-foreground text-sm">
										No categories found. Create categories in Inventory first.
									</p>
								) : (
									<div className="grid grid-cols-2 gap-2">
										{categories.map((cat) => {
											const isChecked = getEffectiveCoverage().includes(cat.id);
											return (
												<label
													key={cat.id}
													className={`flex items-center gap-2 rounded border p-2 cursor-pointer transition ${
														isChecked ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
													}`}
												>
													<input
														type="checkbox"
														checked={isChecked}
														onChange={() => handleToggleCategory(cat.id)}
														className="accent-primary"
													/>
													<div>
														<p className="text-sm font-medium">{cat.name}</p>
														{cat.description && <p className="text-xs text-muted-foreground">{cat.description}</p>}
													</div>
													{isChecked && (
														<Badge variant="secondary" className="ml-auto text-xs">
															Assigned
														</Badge>
													)}
												</label>
											);
										})}
									</div>
								)}
							</Card>
						</div>
					) : (
						<div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-muted-foreground text-sm">
							Select a station type to manage its stations and category coverage.
						</div>
					)}
				</div>
			</div>

			{/* Dialog: Add/Edit Station Type */}
			<Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>{editingType ? "Edit Station Type" : "New Station Type"}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="typeName">Name *</Label>
							<Input
								id="typeName"
								value={typeForm.name}
								onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
								placeholder="e.g., Cocina, Bar..."
							/>
						</div>
						<div>
							<Label htmlFor="typeDesc">Description</Label>
							<Textarea
								id="typeDesc"
								value={typeForm.description}
								onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
								placeholder="Optional description"
							/>
						</div>
						<div className="flex gap-2 justify-end">
							<Button variant="outline" onClick={() => setIsTypeDialogOpen(false)}>
								Cancel
							</Button>
							<Button onClick={handleSaveType}>Save</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Dialog: Add Station */}
			<Dialog open={isStationDialogOpen} onOpenChange={setIsStationDialogOpen}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>Add Station — {selectedType?.name}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="stationName">Station Name *</Label>
							<Input
								id="stationName"
								value={stationForm.name}
								onChange={(e) => setStationForm({ name: e.target.value })}
								placeholder="e.g., Cocina Principal, Bar 1..."
							/>
						</div>
						<div className="flex gap-2 justify-end">
							<Button variant="outline" onClick={() => setIsStationDialogOpen(false)}>
								Cancel
							</Button>
							<Button onClick={handleCreateStation}>Create</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
