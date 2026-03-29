import { ChefHat, Printer, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import posService, { type KDSItem } from "@/api/services/posService";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";

function getStatusColor(status: string): string {
	const s = status.toLowerCase();
	if (s.includes("preparac") || s.includes("preparation")) return "border-l-blue-500";
	return "border-l-amber-500";
}

function getStatusLabel(status: string): string {
	const s = status.toLowerCase();
	if (s.includes("preparac") || s.includes("preparation")) return "En Preparación";
	if (s.includes("listo") || s.includes("ready")) return "Listo";
	return "Pendiente";
}

function isInPreparation(status: string): boolean {
	const s = status.toLowerCase();
	return s.includes("preparac") || s.includes("preparation");
}

export default function KDSPage() {
	const [stationType, setStationType] = useState<string>("cocina");
	const [items, setItems] = useState<KDSItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [autoRefresh, setAutoRefresh] = useState(true);
	const [advancingId, setAdvancingId] = useState<number | null>(null);

	// Reprint dialog
	const [reprintData, setReprintData] = useState<{
		commandId: number;
		ticketId: number;
		waiterName: string;
		printedAt: string;
		items: { productName: string; quantity: number; note?: string; stationName: string }[];
	} | null>(null);

	const loadKDSItems = useCallback(async () => {
		setLoading(true);
		try {
			const data = await posService.getKDSPending(stationType);
			setItems(data);
		} catch (error) {
			toast.error(`Failed to load ${stationType} orders`);
			console.error(error);
		} finally {
			setLoading(false);
		}
	}, [stationType]);

	useEffect(() => {
		loadKDSItems();
	}, [loadKDSItems]);

	useEffect(() => {
		if (!autoRefresh) return;
		const interval = setInterval(() => {
			loadKDSItems();
		}, 5000);
		return () => clearInterval(interval);
	}, [autoRefresh, loadKDSItems]);

	const handleManualRefresh = async () => {
		setRefreshing(true);
		try {
			await loadKDSItems();
			toast.success("Orders refreshed");
		} finally {
			setRefreshing(false);
		}
	};

	const handleAdvanceStatus = async (item: KDSItem) => {
		setAdvancingId(item.orderItemId);
		try {
			const updated = await posService.advanceKdsItemStatus(item.orderItemId);
			const updatedStatus = updated.status?.toLowerCase() ?? "";
			if (updatedStatus.includes("listo") || updatedStatus.includes("ready")) {
				setItems((prev) => prev.filter((i) => i.orderItemId !== item.orderItemId));
				toast.success(`${item.productName} marcado como Listo`);
			} else {
				setItems((prev) => prev.map((i) => (i.orderItemId === item.orderItemId ? updated : i)));
				toast.success(`${item.productName} → En Preparación`);
			}
		} catch (error) {
			toast.error("Failed to update item status");
			console.error(error);
		} finally {
			setAdvancingId(null);
		}
	};

	const handleReprint = async (item: KDSItem) => {
		try {
			const data = await posService.getCommandReprint(item.commandId);
			setReprintData(data);
		} catch (error) {
			toast.error("Failed to load command data");
			console.error(error);
		}
	};

	const pendingCount = items.filter((i) => !isInPreparation(i.status)).length;
	const inPrepCount = items.filter((i) => isInPreparation(i.status)).length;

	return (
		<div className="space-y-6 p-6 bg-background min-h-screen">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Kitchen Display System</h1>
					<p className="text-muted-foreground">Manage and prepare pending orders</p>
				</div>
				<div className="flex items-center gap-4">
					<Select value={stationType} onValueChange={(v) => setStationType(v)}>
						<SelectTrigger className="w-32">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="cocina">Kitchen</SelectItem>
							<SelectItem value="bar">Bar</SelectItem>
						</SelectContent>
					</Select>

					<Button variant="outline" size="sm" onClick={handleManualRefresh} disabled={refreshing}>
						<RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
					</Button>

					<Button variant={autoRefresh ? "default" : "outline"} size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>
						{autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
					</Button>
				</div>
			</div>

			{/* Status Summary */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Pendientes</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-amber-500">{pendingCount}</div>
						<p className="text-xs text-muted-foreground">Items por preparar</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">En Preparación</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-blue-500">{inPrepCount}</div>
						<p className="text-xs text-muted-foreground">Items en proceso</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Estación Activa</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{stationType}</div>
						<p className="text-xs text-muted-foreground">
							{autoRefresh ? "Auto-refresh cada 5 segundos" : "Actualización manual"}
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Orders Grid */}
			{loading ? (
				<div className="flex items-center justify-center py-12">
					<p className="text-muted-foreground">Loading orders...</p>
				</div>
			) : items.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-12 bg-muted/50 rounded-lg">
					<ChefHat className="h-12 w-12 text-muted-foreground mb-4" />
					<p className="text-lg font-medium mb-2">No pending orders</p>
					<p className="text-muted-foreground">Check back soon!</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{items.map((item) => (
						<Card
							key={`${item.commandId}-${item.orderItemId}`}
							className={`overflow-hidden border-l-4 ${getStatusColor(item.status)}`}
						>
							<CardHeader>
								<div className="flex items-start justify-between">
									<div>
										<CardTitle className="text-lg">Ticket #{item.ticketId}</CardTitle>
										<CardDescription>{item.stationName}</CardDescription>
									</div>
									<div className="flex flex-col items-end gap-1">
										<Badge variant="outline">{item.quantity}x</Badge>
										<Badge
											variant="secondary"
											className={
												isInPreparation(item.status)
													? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
													: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
											}
										>
											{getStatusLabel(item.status)}
										</Badge>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="bg-muted p-4 rounded">
									<p className="font-semibold text-lg">{item.productName}</p>
									<p className="text-sm text-muted-foreground mt-1">Qty: {item.quantity}</p>
								</div>

								{item.note && (
									<div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded p-3">
										<p className="text-xs font-medium text-yellow-900 dark:text-yellow-100">Special instructions:</p>
										<p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">{item.note}</p>
									</div>
								)}

								<div className="pt-2 border-t flex gap-2">
									<Button
										className="flex-1"
										size="sm"
										disabled={advancingId === item.orderItemId}
										onClick={() => handleAdvanceStatus(item)}
									>
										{advancingId === item.orderItemId
											? "..."
											: isInPreparation(item.status)
												? "✓ Mark Ready"
												: "⚡ Start Preparing"}
									</Button>
									<Button variant="outline" size="sm" onClick={() => handleReprint(item)} title="Reprint command">
										<Printer className="h-4 w-4" />
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Footer */}
			<div className="text-center text-xs text-muted-foreground py-4 border-t">
				<p>
					{autoRefresh ? "Auto-refreshing every 5 seconds" : "Manual refresh enabled"} | Total Items: {items.length}
				</p>
			</div>

			{/* Reprint Dialog */}
			<Dialog open={reprintData !== null} onOpenChange={(open) => !open && setReprintData(null)}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Comanda — Ticket #{reprintData?.ticketId}</DialogTitle>
					</DialogHeader>
					{reprintData && (
						<div className="space-y-4">
							<div className="text-sm text-muted-foreground">
								<p>Mesero: {reprintData.waiterName || "—"}</p>
								<p>Impreso: {new Date(reprintData.printedAt).toLocaleString()}</p>
							</div>
							<div className="border rounded divide-y">
								{reprintData.items.map((ri, idx) => (
									<div key={idx} className="p-3">
										<div className="flex justify-between font-medium">
											<span>{ri.productName}</span>
											<span>x{ri.quantity}</span>
										</div>
										<p className="text-xs text-muted-foreground">{ri.stationName}</p>
										{ri.note && <p className="text-xs text-yellow-700 mt-1">Nota: {ri.note}</p>}
									</div>
								))}
							</div>
							<div className="flex justify-end gap-2">
								<Button variant="outline" onClick={() => setReprintData(null)}>
									Cerrar
								</Button>
								<Button onClick={() => window.print()}>
									<Printer className="mr-2 h-4 w-4" />
									Imprimir
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
