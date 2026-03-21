import { Clock, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import posService, { type KDSItem } from "@/api/services/posService";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";

export default function KDSPage() {
	const [stationType, setStationType] = useState<"Cocina" | "Bar">("Cocina");
	const [items, setItems] = useState<KDSItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [autoRefresh, setAutoRefresh] = useState(true);

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
		}, 5000); // Refresh every 5 seconds

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

	const getTimeAgo = (createdAt: string): string => {
		const now = new Date();
		const created = new Date(createdAt);
		const diffMs = now.getTime() - created.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffSecs = Math.floor((diffMs % 60000) / 1000);

		if (diffMins === 0) return `${diffSecs}s ago`;
		if (diffMins === 1) return "1 min ago";
		if (diffMins < 60) return `${diffMins}m ago`;
		const diffHours = Math.floor(diffMins / 60);
		return `${diffHours}h ago`;
	};

	return (
		<div className="space-y-6 p-6 bg-background min-h-screen">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Kitchen Display System</h1>
					<p className="text-muted-foreground">Manage and prepare pending orders</p>
				</div>
				<div className="flex items-center gap-4">
					<Select value={stationType} onValueChange={(v) => setStationType(v as "Cocina" | "Bar")}>
						<SelectTrigger className="w-32">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="Cocina">Kitchen</SelectItem>
							<SelectItem value="Bar">Bar</SelectItem>
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
						<CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{items.length}</div>
						<p className="text-xs text-muted-foreground">Items to prepare</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Station</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{stationType}</div>
						<p className="text-xs text-muted-foreground">Active station</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Last Updated</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-sm font-mono">Now</div>
						<p className="text-xs text-muted-foreground">Real-time updates</p>
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
					<p className="text-lg font-medium mb-2">No pending orders</p>
					<p className="text-muted-foreground">Check back soon!</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{items.map((item) => (
						<Card key={item.itemId} className="overflow-hidden border-l-4 border-l-amber-500">
							<CardHeader>
								<div className="flex items-start justify-between">
									<div>
										<CardTitle className="text-lg">Ticket #{item.ticketNumber}</CardTitle>
										<CardDescription>
											<Clock className="inline h-3 w-3 mr-1" />
											{getTimeAgo(item.createdAt)}
										</CardDescription>
									</div>
									<Badge variant="outline">{item.quantity}x</Badge>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="bg-muted p-4 rounded">
									<p className="font-semibold text-lg">{item.productName}</p>
									<p className="text-sm text-muted-foreground mt-1">Qty: {item.quantity}</p>
								</div>

								{item.notes && (
									<div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded p-3">
										<p className="text-xs font-medium text-yellow-900 dark:text-yellow-100">Special instructions:</p>
										<p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">{item.notes}</p>
									</div>
								)}

								<div className="pt-2 border-t flex gap-2">
									<Button
										className="flex-1"
										size="sm"
										onClick={() => {
											toast.success(`Item ${item.productName} marked as completed`);
										}}
									>
										✓ Mark Done
									</Button>
									<Button
										variant="outline"
										className="flex-1"
										size="sm"
										onClick={() => {
											toast.info(`Reminder sent for ${item.productName}`);
										}}
									>
										⏰ Remind
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Footer Note */}
			<div className="text-center text-xs text-muted-foreground py-4 border-t">
				<p>
					{autoRefresh ? "Auto-refreshing every 5 seconds" : "Manual refresh enabled"} | Total Items: {items.length}
				</p>
			</div>
		</div>
	);
}
