import { ChefHat, RefreshCw, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import posService from "@/api/services/posService";
import { useCurrentBusiness } from "@/store/userStore";
import type { KdsItemContractResponse, KdsTeamContractResponse } from "@/types/entity";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";

function getStatusColor(status: string): string {
	if (status === "preparing") return "border-l-blue-500";
	if (status === "delivered") return "border-l-green-500";
	if (status === "canceled") return "border-l-red-500";
	return "border-l-amber-500";
}

function getStatusLabel(status: string): string {
	if (status === "preparing") return "Preparando";
	if (status === "delivered") return "Listo";
	if (status === "canceled") return "Cancelado";
	return "Pendiente";
}

export default function KDSPage() {
	const business = useCurrentBusiness();
	const companyCen = business?.companyCen ?? "";

	const [teams, setTeams] = useState<KdsTeamContractResponse[]>([]);
	const [selectedTeamCen, setSelectedTeamCen] = useState<string>("");
	const [items, setItems] = useState<KdsItemContractResponse[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [autoRefresh, setAutoRefresh] = useState(true);
	const [advancingId, setAdvancingId] = useState<string | null>(null);
	const [resendingId, setResendingId] = useState<string | null>(null);

	const loadItems = useCallback(async () => {
		if (!selectedTeamCen || !companyCen) return;
		setLoading(true);
		try {
			const data = await posService.getKdsItemsByTeam(companyCen, selectedTeamCen);
			setItems(data ?? []);
		} catch {
			toast.error("Failed to load kitchen orders");
		} finally {
			setLoading(false);
		}
	}, [selectedTeamCen, companyCen]);

	useEffect(() => {
		if (!companyCen) return;
		posService
			.getKdsTeams(companyCen)
			.then((data) => {
				setTeams(data ?? []);
				if (data && data.length > 0) setSelectedTeamCen(data[0].teamCen);
			})
			.catch(() => toast.error("Failed to load KDS teams"));
	}, [companyCen]);

	useEffect(() => {
		loadItems();
	}, [loadItems]);

	useEffect(() => {
		if (!autoRefresh) return;
		const interval = setInterval(loadItems, 5000);
		return () => clearInterval(interval);
	}, [autoRefresh, loadItems]);

	const handleManualRefresh = async () => {
		setRefreshing(true);
		try {
			await loadItems();
			toast.success("Orders refreshed");
		} finally {
			setRefreshing(false);
		}
	};

	const handleAdvanceStatus = async (item: KdsItemContractResponse) => {
		const nextStatus = item.status === "created" ? "preparing" : "delivered";
		setAdvancingId(item.ticketItemCen);
		try {
			const updated = await posService.updateKdsItemStatus(companyCen, item.ticketItemCen, nextStatus);
			if (updated.status === "delivered") {
				setItems((prev) => prev.filter((i) => i.ticketItemCen !== item.ticketItemCen));
				toast.success(`${item.productName} marcado como Listo`);
			} else {
				setItems((prev) => prev.map((i) => (i.ticketItemCen === item.ticketItemCen ? updated : i)));
				toast.success(`${item.productName} → Preparando`);
			}
		} catch {
			toast.error("Failed to update item status");
		} finally {
			setAdvancingId(null);
		}
	};

	const handleResend = async (item: KdsItemContractResponse) => {
		setResendingId(item.ticketItemCen);
		try {
			await posService.resendTicketItem(companyCen, item.ticketCen, item.ticketItemCen);
			await loadItems();
			toast.success(`${item.productName} resent to kitchen`);
		} catch {
			toast.error("Failed to resend item");
		} finally {
			setResendingId(null);
		}
	};

	const activeTeam = teams.find((t) => t.teamCen === selectedTeamCen);
	const pendingCount = items.filter((i) => i.status === "created").length;
	const preparingCount = items.filter((i) => i.status === "preparing").length;

	return (
		<div className="space-y-6 p-6 bg-background min-h-screen">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Kitchen Display System</h1>
					<p className="text-muted-foreground">Manage and prepare pending orders</p>
				</div>
				<div className="flex items-center gap-4">
					<Select value={selectedTeamCen} onValueChange={setSelectedTeamCen} disabled={teams.length === 0}>
						<SelectTrigger className="w-40">
							<SelectValue placeholder="Loading..." />
						</SelectTrigger>
						<SelectContent>
							{teams.map((team) => (
								<SelectItem key={team.teamCen} value={team.teamCen}>
									{team.name}
								</SelectItem>
							))}
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

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Pending</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-amber-500">{pendingCount}</div>
						<p className="text-xs text-muted-foreground">Items to prepare</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">In Preparation</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-blue-500">{preparingCount}</div>
						<p className="text-xs text-muted-foreground">Items in progress</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Active Team</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{activeTeam?.name ?? "—"}</div>
						<p className="text-xs text-muted-foreground">
							{autoRefresh ? "Auto-refresh every 5 seconds" : "Manual refresh"}
						</p>
					</CardContent>
				</Card>
			</div>

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
						<Card key={item.ticketItemCen} className={`overflow-hidden border-l-4 ${getStatusColor(item.status)}`}>
							<CardHeader>
								<div className="flex items-start justify-between">
									<div>
										<CardTitle className="text-lg">Ticket #{item.ticketCen}</CardTitle>
										<p className="text-xs text-muted-foreground mt-1">
											{new Date(item.createdAt).toLocaleTimeString()}
										</p>
									</div>
									<div className="flex flex-col items-end gap-1">
										<Badge variant="outline">{item.quantity}x</Badge>
										<Badge
											variant="secondary"
											className={
												item.status === "preparing"
													? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
													: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
											}
										>
											{getStatusLabel(item.status)}
										</Badge>
										{item.resendCount > 0 && (
											<Badge variant="destructive" className="text-xs">
												Resend ×{item.resendCount}
											</Badge>
										)}
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
										disabled={advancingId === item.ticketItemCen || item.status === "delivered"}
										onClick={() => handleAdvanceStatus(item)}
									>
										{advancingId === item.ticketItemCen
											? "..."
											: item.status === "preparing"
												? "✓ Mark Ready"
												: "⚡ Start Preparing"}
									</Button>
									<Button
										variant="outline"
										size="sm"
										disabled={resendingId === item.ticketItemCen}
										onClick={() => handleResend(item)}
										title="Resend to kitchen"
									>
										<RotateCcw className="h-4 w-4" />
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			<div className="text-center text-xs text-muted-foreground py-4 border-t">
				<p>
					{autoRefresh ? "Auto-refreshing every 5 seconds" : "Manual refresh enabled"} | Total Items: {items.length}
				</p>
			</div>
		</div>
	);
}
