import { Check, Plus, Printer, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import BusinessGate from "@/components/business-gate";
import catalogService from "@/api/services/catalogService";
import posService from "@/api/services/posService";
import { useCurrentBusiness } from "@/store/userStore";
import type {
	PaymentMethodContractResponse,
	ProcessPaymentConflict,
	SellableProductContractDto,
	TicketContractResponse,
	TicketItemContractResponse,
	TicketTotalsContractResponse,
	WaiterContractResponse,
} from "@/types/entity";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { Textarea } from "@/ui/textarea";

export default function POSPage() {
	const business = useCurrentBusiness();
	const companyCen = business?.companyCen ?? "";

	const [tickets, setTickets] = useState<TicketContractResponse[]>([]);
	const [selectedTicketCen, setSelectedTicketCen] = useState<string | null>(null);
	const [ticketItems, setTicketItems] = useState<TicketItemContractResponse[]>([]);
	const [totals, setTotals] = useState<TicketTotalsContractResponse | null>(null);
	const [products, setProducts] = useState<SellableProductContractDto[]>([]);
	const [paymentMethods, setPaymentMethods] = useState<PaymentMethodContractResponse[]>([]);
	const [waiters, setWaiters] = useState<WaiterContractResponse[]>([]);
	const [loading, setLoading] = useState(true);

	const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
	const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false);
	const [isCreateTicketDialogOpen, setIsCreateTicketDialogOpen] = useState(false);
	const [isAssignWaiterDialogOpen, setIsAssignWaiterDialogOpen] = useState(false);
	const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
	const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
	const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);

	const [addItemForm, setAddItemForm] = useState({ productCen: "", quantity: "1", notes: "" });
	const [editItemForm, setEditItemForm] = useState({ ticketItemCen: "", quantity: 1, notes: "" });
	const [assignWaiterCen, setAssignWaiterCen] = useState("");
	const [checkoutPaymentMethodCode, setCheckoutPaymentMethodCode] = useState("");
	const [paymentConflict, setPaymentConflict] = useState<ProcessPaymentConflict | null>(null);
	const [searchProductTerm, setSearchProductTerm] = useState("");

	const [sendingCommand, setSendingCommand] = useState(false);
	const [checkingOut, setCheckingOut] = useState(false);
	const [cancelling, setCancelling] = useState(false);
	const [printing, setPrinting] = useState(false);

	const selectedTicket = useMemo(
		() => tickets.find((t) => t.ticketCen === selectedTicketCen) ?? null,
		[tickets, selectedTicketCen],
	);

	const loadAllData = useCallback(async () => {
		if (!companyCen) return;
		setLoading(true);
		try {
			const [ticketsData, productsData, paymentMethodsData, waitersData] = await Promise.all([
				posService.getTickets(companyCen),
				catalogService.getProducts(companyCen, { onlyAvailable: true }),
				posService.getPaymentMethods(),
				posService.getWaiters(companyCen),
			]);
			setTickets(ticketsData ?? []);
			setProducts(productsData ?? []);
			setPaymentMethods(paymentMethodsData ?? []);
			setWaiters(waitersData ?? []);
		} catch {
			toast.error("Failed to load POS data");
		} finally {
			setLoading(false);
		}
	}, [companyCen]);

	useEffect(() => {
		loadAllData();
	}, [loadAllData]);

	const refreshTicketData = useCallback(async () => {
		if (!selectedTicketCen || !companyCen) return;
		try {
			const [items, totalsData] = await Promise.all([
				posService.getTicketItems(companyCen, selectedTicketCen),
				posService.getTicketTotals(companyCen, selectedTicketCen),
			]);
			setTicketItems(items ?? []);
			setTotals(totalsData);
		} catch {
			// ignore — ticket may have been closed
		}
	}, [selectedTicketCen, companyCen]);

	useEffect(() => {
		if (!selectedTicketCen || !companyCen) {
			setTicketItems([]);
			setTotals(null);
			return;
		}
		void refreshTicketData();
	}, [selectedTicketCen, companyCen, refreshTicketData]);

	const filteredProducts = useMemo(
		() => products.filter((p) => !searchProductTerm || p.name.toLowerCase().includes(searchProductTerm.toLowerCase())),
		[products, searchProductTerm],
	);

	const handleCreateTicket = async () => {
		try {
			const ticket = await posService.createTicket(companyCen);
			setTickets((prev) => [...prev, ticket]);
			setSelectedTicketCen(ticket.ticketCen);
			toast.success("Ticket created");
			setIsCreateTicketDialogOpen(false);
		} catch {
			toast.error("Failed to create ticket");
		}
	};

	const handleAssignWaiter = async () => {
		if (!selectedTicketCen || !assignWaiterCen) {
			toast.error("Please select a waiter");
			return;
		}
		try {
			const result = await posService.assignWaiter(companyCen, selectedTicketCen, assignWaiterCen);
			setTickets((prev) =>
				prev.map((t) => (t.ticketCen === selectedTicketCen ? { ...t, waiterCen: result.waiterCen } : t)),
			);
			toast.success(`Waiter assigned: ${result.waiterName}`);
			setIsAssignWaiterDialogOpen(false);
			setAssignWaiterCen("");
		} catch {
			toast.error("Failed to assign waiter");
		}
	};

	const handleAddItem = async () => {
		if (!selectedTicketCen) return;
		const qty = parseInt(addItemForm.quantity);
		if (!addItemForm.productCen || isNaN(qty) || qty <= 0) {
			toast.error("Please select a product and quantity");
			return;
		}
		try {
			await posService.addTicketItem(companyCen, selectedTicketCen, {
				productCen: addItemForm.productCen,
				quantity: qty,
				note: addItemForm.notes || undefined,
			});
			await refreshTicketData();
			toast.success("Item added");
			setIsAddItemDialogOpen(false);
			setAddItemForm({ productCen: "", quantity: "1", notes: "" });
			setSearchProductTerm("");
		} catch {
			toast.error("Failed to add item");
		}
	};

	const handleUpdateItem = async () => {
		if (!selectedTicketCen || !editItemForm.ticketItemCen) return;
		try {
			await posService.updateTicketItem(companyCen, selectedTicketCen, editItemForm.ticketItemCen, {
				quantity: editItemForm.quantity,
				note: editItemForm.notes || undefined,
			});
			await refreshTicketData();
			toast.success("Item updated");
			setIsEditItemDialogOpen(false);
		} catch {
			toast.error("Failed to update item");
		}
	};

	const handleSendToKitchen = async () => {
		if (!selectedTicketCen) return;
		if (ticketItems.length === 0) {
			toast.error("Add items before sending to kitchen");
			return;
		}
		if (!selectedTicket?.waiterCen) {
			toast.error("Assign a waiter before sending to kitchen");
			return;
		}
		setSendingCommand(true);
		try {
			const sentItems = await posService.sendTicketToKitchen(companyCen, selectedTicketCen);
			setTicketItems(sentItems ?? ticketItems);
			await refreshTicketData();
			toast.success(`${sentItems?.length ?? 0} items sent to kitchen`);
		} catch {
			toast.error("Failed to send to kitchen");
		} finally {
			setSendingCommand(false);
		}
	};

	const handleCheckout = async () => {
		if (!selectedTicketCen || !checkoutPaymentMethodCode) return;
		setCheckingOut(true);
		try {
			const { success, conflict } = await posService.payTicket(
				companyCen,
				selectedTicketCen,
				checkoutPaymentMethodCode,
			);
			if (success) {
				toast.success(`Payment confirmed — Total: $${success.total.toFixed(2)}`);
				setTickets((prev) => prev.filter((t) => t.ticketCen !== selectedTicketCen));
				setSelectedTicketCen(null);
				setIsCheckoutDialogOpen(false);
				setCheckoutPaymentMethodCode("");
			} else if (conflict) {
				setPaymentConflict(conflict);
				setIsCheckoutDialogOpen(false);
				setIsConflictDialogOpen(true);
			}
		} catch {
			toast.error("Checkout failed");
		} finally {
			setCheckingOut(false);
		}
	};

	const handleCancelTicket = async () => {
		if (!selectedTicketCen) return;
		setCancelling(true);
		try {
			await posService.cancelTicket(companyCen, selectedTicketCen);
			toast.success("Ticket cancelled");
			setTickets((prev) => prev.filter((t) => t.ticketCen !== selectedTicketCen));
			setSelectedTicketCen(null);
			setIsCancelDialogOpen(false);
		} catch {
			toast.error("Failed to cancel ticket");
		} finally {
			setCancelling(false);
		}
	};

	const handlePrint = async () => {
		if (!selectedTicketCen) return;
		setPrinting(true);
		try {
			const blob = await posService.printTicket(companyCen, selectedTicketCen);
			const url = URL.createObjectURL(blob);
			window.open(url, "_blank");
		} catch {
			toast.error("Failed to print ticket");
		} finally {
			setPrinting(false);
		}
	};

	const canCheckout =
		selectedTicket?.status?.toLowerCase() === "open" && ticketItems.length > 0 && !!selectedTicket?.waiterCen;

	const selectedWaiter = waiters.find((w) => w.waiterCen === selectedTicket?.waiterCen);

	return (
		<BusinessGate>
			<div className="grid grid-cols-3 gap-6 p-6 min-h-screen bg-background">
				<div className="col-span-1">
					<Card className="h-full flex flex-col">
						<CardHeader>
							<CardTitle>Open Tickets</CardTitle>
							<CardDescription>{tickets.length} tickets</CardDescription>
						</CardHeader>
						<CardContent className="flex-1 overflow-y-auto space-y-2">
							{loading ? (
								<p className="text-muted-foreground">Loading...</p>
							) : tickets.length === 0 ? (
								<p className="text-muted-foreground text-sm">No open tickets</p>
							) : (
								tickets.map((ticket) => (
									<Button
										key={ticket.ticketCen}
										onClick={() => setSelectedTicketCen(ticket.ticketCen)}
										className={`w-full p-3 rounded border text-left transition ${
											selectedTicketCen === ticket.ticketCen
												? "border-primary bg-primary/10"
												: "border-border hover:border-primary/50"
										}`}
									>
										<div className="flex justify-between items-start">
											<div>
												<p className="font-semibold">#{ticket.dailyNumber}</p>
												<p className="text-xs text-muted-foreground">{ticket.status}</p>
											</div>
											<div className="text-right">
												<p className="text-xs text-muted-foreground">
													{new Date(ticket.createdAt).toLocaleTimeString()}
												</p>
											</div>
										</div>
									</Button>
								))
							)}
						</CardContent>
						<div className="border-t p-4">
							<Button onClick={() => setIsCreateTicketDialogOpen(true)} className="w-full">
								<Plus className="mr-2 h-4 w-4" />
								New Ticket
							</Button>
						</div>
					</Card>
				</div>

				<div className="col-span-2">
					{selectedTicket ? (
						<div className="space-y-4">
							<Card>
								<CardHeader>
									<div className="flex justify-between items-start">
										<div>
											<CardTitle>Ticket #{selectedTicket.dailyNumber}</CardTitle>
											<CardDescription>{new Date(selectedTicket.createdAt).toLocaleString()}</CardDescription>
										</div>
										<div className="flex items-center gap-2">
											<Badge variant="outline">{selectedTicket.status}</Badge>
											<Button
												variant="outline"
												size="sm"
												onClick={handlePrint}
												disabled={printing}
												title="Print ticket"
											>
												<Printer className="h-4 w-4" />
											</Button>
											<Button
												variant="destructive"
												size="sm"
												onClick={() => setIsCancelDialogOpen(true)}
												disabled={selectedTicket.status?.toLowerCase() !== "open"}
											>
												Cancel
											</Button>
										</div>
									</div>
								</CardHeader>
								<CardContent className="space-y-4">
									<div>
										<Label className="text-xs">Assigned Waiter</Label>
										{selectedWaiter ? (
											<div className="flex justify-between items-center mt-1">
												<p className="font-medium">{selectedWaiter.name}</p>
												<Button variant="ghost" size="sm" onClick={() => setIsAssignWaiterDialogOpen(true)}>
													Change
												</Button>
											</div>
										) : (
											<Button
												variant="outline"
												className="w-full mt-1"
												onClick={() => setIsAssignWaiterDialogOpen(true)}
											>
												<Plus className="mr-2 h-4 w-4" />
												Assign Waiter
											</Button>
										)}
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle>Items</CardTitle>
								</CardHeader>
								<CardContent>
									{ticketItems.length === 0 ? (
										<p className="text-muted-foreground text-sm">No items added yet</p>
									) : (
										<Table>
											<TableHeader>
												<TableRow className="grid-cols-6 items-center">
													<TableHead className="col-span-1">Product</TableHead>
													<TableHead className="text-right col-span-1">Qty</TableHead>
													<TableHead className="text-right col-span-1">Price</TableHead>
													<TableHead className="text-right col-span-1">Total</TableHead>
													<TableHead className="col-span-1">Notes</TableHead>
													<TableHead className="text-right col-span-1">Actions</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{ticketItems.map((item) => (
													<TableRow key={item.ticketItemCen} className="grid-cols-6 items-center text-sm">
														<TableCell className="font-medium col-span-1">{item.productName}</TableCell>
														<TableCell className="text-right col-span-1">{item.quantity}</TableCell>
														<TableCell className="text-right col-span-1">${item.unitPrice.toFixed(2)}</TableCell>
														<TableCell className="text-right font-semibold col-span-1">
															${(item.quantity * item.unitPrice).toFixed(2)}
														</TableCell>
														<TableCell className="text-xs max-w-xs truncate col-span-1">{item.note || "-"}</TableCell>
														<TableCell className="text-right col-span-1">
															<Button
																variant="ghost"
																size="sm"
																onClick={() => {
																	setEditItemForm({
																		ticketItemCen: item.ticketItemCen,
																		quantity: item.quantity,
																		notes: item.note || "",
																	});
																	setIsEditItemDialogOpen(true);
																}}
															>
																Edit
															</Button>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									)}
									<Button variant="outline" className="w-full mt-4" onClick={() => setIsAddItemDialogOpen(true)}>
										<Plus className="mr-2 h-4 w-4" />
										Add Item
									</Button>
								</CardContent>
							</Card>

							<Card className="bg-muted/50">
								<CardContent className="pt-6">
									<div className="space-y-2">
										<div className="flex justify-between text-sm">
											<span>Subtotal:</span>
											<span className="font-medium">${(totals?.subtotal ?? 0).toFixed(2)}</span>
										</div>
										<div className="flex justify-between text-sm">
											<span>Tax:</span>
											<span className="font-medium">${(totals?.taxAmount ?? 0).toFixed(2)}</span>
										</div>
										<div className="border-t pt-2 flex justify-between">
											<span className="font-semibold">Total:</span>
											<span className="font-bold text-lg">${(totals?.total ?? 0).toFixed(2)}</span>
										</div>
									</div>

									<div className="flex gap-2 mt-4">
										<Button
											onClick={handleSendToKitchen}
											disabled={sendingCommand || ticketItems.length === 0 || !selectedTicket.waiterCen}
											className="flex-1"
											size="lg"
											variant="outline"
										>
											<Zap className="mr-2 h-4 w-4" />
											{sendingCommand ? "Sending..." : "Send to Kitchen"}
										</Button>
										<Button
											onClick={() => setIsCheckoutDialogOpen(true)}
											disabled={!canCheckout}
											className="flex-1"
											size="lg"
										>
											Checkout
										</Button>
									</div>
								</CardContent>
							</Card>
						</div>
					) : (
						<Card className="h-full flex items-center justify-center">
							<div className="text-center">
								<p className="text-muted-foreground mb-4">Select a ticket or create a new one</p>
								<Button onClick={() => setIsCreateTicketDialogOpen(true)}>Create New Ticket</Button>
							</div>
						</Card>
					)}
				</div>

				{/* Create Ticket Dialog */}
				<Dialog open={isCreateTicketDialogOpen} onOpenChange={setIsCreateTicketDialogOpen}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create New Ticket</DialogTitle>
						</DialogHeader>
						<p className="text-muted-foreground">Open a new sales ticket?</p>
						<div className="flex gap-2 justify-end mt-4">
							<Button variant="outline" onClick={() => setIsCreateTicketDialogOpen(false)}>
								Cancel
							</Button>
							<Button onClick={handleCreateTicket}>Create</Button>
						</div>
					</DialogContent>
				</Dialog>

				{/* Assign Waiter Dialog */}
				<Dialog open={isAssignWaiterDialogOpen} onOpenChange={setIsAssignWaiterDialogOpen}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Assign Waiter</DialogTitle>
						</DialogHeader>
						<div className="space-y-4">
							<div>
								<Label>Waiter *</Label>
								<Select value={assignWaiterCen} onValueChange={setAssignWaiterCen}>
									<SelectTrigger className="mt-1">
										<SelectValue placeholder="Select a waiter..." />
									</SelectTrigger>
									<SelectContent>
										{waiters.map((w) => (
											<SelectItem key={w.waiterCen} value={w.waiterCen}>
												{w.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="flex gap-2 justify-end">
								<Button variant="outline" onClick={() => setIsAssignWaiterDialogOpen(false)}>
									Cancel
								</Button>
								<Button onClick={handleAssignWaiter}>Assign</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>

				{/* Add Item Dialog */}
				<Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
					<DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Add Item to Ticket</DialogTitle>
						</DialogHeader>
						<div className="space-y-4">
							<Input
								placeholder="Search products..."
								value={searchProductTerm}
								onChange={(e) => setSearchProductTerm(e.target.value)}
							/>
							<div className="border rounded max-h-48 overflow-y-auto space-y-1">
								{filteredProducts.map((product) => {
									const isSelected = addItemForm.productCen === product.productCen;
									return (
										<Button
											key={product.productCen}
											variant="ghost"
											onClick={() => setAddItemForm({ ...addItemForm, productCen: product.productCen })}
											className={`w-full justify-start p-3 text-left border-b rounded-none transition ${
												isSelected
													? "bg-primary/10 border-l-2 border-l-primary hover:bg-primary/15"
													: "hover:bg-secondary/60"
											}`}
										>
											<div className="flex justify-between items-center w-full">
												<span className="font-medium">{product.name}</span>
												<div className="flex items-center gap-2">
													<span className="text-sm text-muted-foreground">${product.salePrice.toFixed(2)}</span>
													{isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
												</div>
											</div>
										</Button>
									);
								})}
							</div>
							<div>
								<Label htmlFor="quantity">Quantity</Label>
								<Input
									id="quantity"
									type="number"
									min="1"
									value={addItemForm.quantity}
									onChange={(e) => setAddItemForm({ ...addItemForm, quantity: e.target.value })}
								/>
							</div>
							<div>
								<Label htmlFor="notes">Notes (Optional)</Label>
								<Textarea
									id="notes"
									value={addItemForm.notes}
									onChange={(e) => setAddItemForm({ ...addItemForm, notes: e.target.value })}
									placeholder="e.g., No spicy, extra sauce..."
								/>
							</div>
							<div className="flex gap-2 justify-end">
								<Button
									variant="outline"
									onClick={() => {
										setIsAddItemDialogOpen(false);
										setAddItemForm({ productCen: "", quantity: "1", notes: "" });
									}}
								>
									Cancel
								</Button>
								<Button onClick={handleAddItem}>Add Item</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>

				{/* Edit Item Dialog */}
				<Dialog open={isEditItemDialogOpen} onOpenChange={setIsEditItemDialogOpen}>
					<DialogContent className="max-w-md">
						<DialogHeader>
							<DialogTitle>Edit Item</DialogTitle>
						</DialogHeader>
						<div className="space-y-4">
							<div>
								<Label htmlFor="editQuantity">Quantity</Label>
								<Input
									id="editQuantity"
									type="number"
									min="1"
									value={editItemForm.quantity}
									onChange={(e) =>
										setEditItemForm({
											...editItemForm,
											quantity: Math.max(1, parseInt(e.target.value) || 1),
										})
									}
								/>
							</div>
							<div>
								<Label htmlFor="editNotes">Notes</Label>
								<Textarea
									id="editNotes"
									value={editItemForm.notes}
									onChange={(e) => setEditItemForm({ ...editItemForm, notes: e.target.value })}
									placeholder="e.g., No spicy, extra sauce..."
								/>
							</div>
							<div className="flex gap-2 justify-end">
								<Button variant="outline" onClick={() => setIsEditItemDialogOpen(false)}>
									Cancel
								</Button>
								<Button onClick={handleUpdateItem}>Save</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>

				{/* Checkout Dialog */}
				<Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
					<DialogContent className="max-w-sm">
						<DialogHeader>
							<DialogTitle>Confirm Payment</DialogTitle>
						</DialogHeader>
						<div className="space-y-4">
							<div className="bg-muted rounded p-4 space-y-1 text-sm">
								<div className="flex justify-between">
									<span>Subtotal:</span>
									<span>${(totals?.subtotal ?? 0).toFixed(2)}</span>
								</div>
								<div className="flex justify-between">
									<span>Tax:</span>
									<span>${(totals?.taxAmount ?? 0).toFixed(2)}</span>
								</div>
								<div className="flex justify-between font-bold text-base pt-1 border-t">
									<span>Total:</span>
									<span>${(totals?.total ?? 0).toFixed(2)}</span>
								</div>
							</div>
							<div>
								<Label htmlFor="paymentMethod">Payment Method *</Label>
								<Select value={checkoutPaymentMethodCode} onValueChange={setCheckoutPaymentMethodCode}>
									<SelectTrigger id="paymentMethod" className="mt-1">
										<SelectValue placeholder="Select payment method..." />
									</SelectTrigger>
									<SelectContent>
										{paymentMethods
											.filter((pm) => pm.isActive)
											.map((pm) => (
												<SelectItem key={pm.paymentMethodCode} value={pm.paymentMethodCode}>
													{pm.name}
												</SelectItem>
											))}
									</SelectContent>
								</Select>
							</div>
							<div className="flex gap-2 justify-end">
								<Button
									variant="outline"
									onClick={() => {
										setIsCheckoutDialogOpen(false);
										setCheckoutPaymentMethodCode("");
									}}
								>
									Cancel
								</Button>
								<Button onClick={handleCheckout} disabled={!checkoutPaymentMethodCode || checkingOut}>
									{checkingOut ? "Processing..." : "Confirm Payment"}
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>

				{/* Cancel Ticket Dialog */}
				<Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
					<DialogContent className="max-w-sm">
						<DialogHeader>
							<DialogTitle>Cancel Ticket</DialogTitle>
						</DialogHeader>
						<p className="text-muted-foreground text-sm">
							Are you sure you want to cancel ticket #{selectedTicket?.dailyNumber}? This action cannot be undone.
						</p>
						<div className="flex gap-2 justify-end mt-4">
							<Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
								Keep Ticket
							</Button>
							<Button variant="destructive" onClick={handleCancelTicket} disabled={cancelling}>
								{cancelling ? "Cancelling..." : "Yes, Cancel"}
							</Button>
						</div>
					</DialogContent>
				</Dialog>

				{/* Stock Conflict Dialog */}
				<Dialog open={isConflictDialogOpen} onOpenChange={setIsConflictDialogOpen}>
					<DialogContent className="max-w-md">
						<DialogHeader>
							<DialogTitle>Stock Conflict</DialogTitle>
						</DialogHeader>
						<p className="text-muted-foreground text-sm">{paymentConflict?.message}</p>
						{paymentConflict && paymentConflict.insufficiencies.length > 0 && (
							<div className="border rounded divide-y mt-2">
								{paymentConflict.insufficiencies.map((ins, idx) => (
									<div key={idx} className="p-3 text-sm">
										<p className="font-medium">{ins.productName}</p>
										<p className="text-muted-foreground">
											Requested: {ins.requestedQuantity} — Available: {ins.availableQuantity} — Missing:{" "}
											{ins.missingQuantity}
										</p>
									</div>
								))}
							</div>
						)}
						<div className="flex justify-end mt-4">
							<Button
								onClick={() => {
									setIsConflictDialogOpen(false);
									setPaymentConflict(null);
								}}
							>
								Close
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>
		</BusinessGate>
	);
}
