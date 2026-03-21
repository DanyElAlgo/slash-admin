import { ChevronRight, Minus, Plus, Trash2, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import inventoryService from "@/api/services/inventoryService";
import posService, { type AccountResponse } from "@/api/services/posService";
import salesService from "@/api/services/salesService";
import type { OrderItem, Product } from "@/types/entity";
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
	const [openAccounts, setOpenAccounts] = useState<AccountResponse[]>([]);
	const [selectedAccount, setSelectedAccount] = useState<AccountResponse | null>(null);
	const [products, setProducts] = useState<Product[]>([]);
	const [waiters, setWaiters] = useState<{ id: number; name: string }[]>([]);
	const [loading, setLoading] = useState(true);

	// Dialog states
	const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
	const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false);
	const [isCreateAccountDialogOpen, setIsCreateAccountDialogOpen] = useState(false);
	const [isAssignWaiterDialogOpen, setIsAssignWaiterDialogOpen] = useState(false);

	// Form states
	const [addItemForm, setAddItemForm] = useState({
		productId: "",
		quantity: 1,
		notes: "",
	});

	const [editItemForm, setEditItemForm] = useState({
		itemId: 0,
		quantity: 1,
		notes: "",
	});

	const [assignWaiterForm, setAssignWaiterForm] = useState({
		waiterId: "",
	});

	const [searchProductTerm, setSearchProductTerm] = useState("");
	const [sendingCommand, setSendingCommand] = useState(false);

	const loadAllData = useCallback(async () => {
		setLoading(true);
		try {
			const [accountsData, productsData, waitersData] = await Promise.all([
				posService.getOpenAccounts(),
				inventoryService.getProducts(),
				posService.getWaiters().catch(() => []),
			]);
			setOpenAccounts(accountsData);
			setProducts(productsData.filter((p) => p.isActive && !p.isOutOfStock));
			setWaiters(waitersData);
		} catch (error) {
			toast.error("Failed to load data");
			console.error(error);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadAllData();
	}, [loadAllData]);

	const filteredProducts = useMemo(() => {
		return products.filter((p) => !searchProductTerm || p.name.toLowerCase().includes(searchProductTerm.toLowerCase()));
	}, [products, searchProductTerm]);

	const handleCreateAccount = async () => {
		try {
			const response = await posService.createAccount({ businessId: 1 }); // TODO: Get from context
			setOpenAccounts([...openAccounts, response]);
			setSelectedAccount(response);
			toast.success("Account created successfully");
			setIsCreateAccountDialogOpen(false);
		} catch (error) {
			toast.error("Failed to create account");
			console.error(error);
		}
	};

	const handleAssignWaiter = async () => {
		if (!selectedAccount || !assignWaiterForm.waiterId) {
			toast.error("Please select a waiter");
			return;
		}

		try {
			const response = await posService.assignWaiter(selectedAccount.ticketId, {
				waiterId: Number(assignWaiterForm.waiterId),
			});
			setSelectedAccount(response);
			setOpenAccounts(openAccounts.map((a) => (a.ticketId === response.ticketId ? response : a)));
			toast.success("Waiter assigned successfully");
			setIsAssignWaiterDialogOpen(false);
			setAssignWaiterForm({ waiterId: "" });
		} catch (error) {
			toast.error("Failed to assign waiter");
			console.error(error);
		}
	};

	const handleAddItem = async () => {
		if (!selectedAccount) {
			toast.error("Please select an account");
			return;
		}
		if (!addItemForm.productId || addItemForm.quantity <= 0) {
			toast.error("Please select a product and quantity");
			return;
		}

		try {
			const response = await posService.addItem(selectedAccount.ticketId, {
				productId: Number(addItemForm.productId),
				quantity: addItemForm.quantity,
				notes: addItemForm.notes,
			});
			setSelectedAccount(response);
			setOpenAccounts(openAccounts.map((a) => (a.ticketId === response.ticketId ? response : a)));
			toast.success("Item added successfully");
			setIsAddItemDialogOpen(false);
			setAddItemForm({ productId: "", quantity: 1, notes: "" });
			setSearchProductTerm("");
		} catch (error) {
			toast.error("Failed to add item");
			console.error(error);
		}
	};

	const handleUpdateItem = async (itemId: number) => {
		if (!selectedAccount) return;

		try {
			const response = await posService.updateItem(selectedAccount.ticketId, itemId, {
				quantity: editItemForm.quantity,
				notes: editItemForm.notes,
			});
			setSelectedAccount(response);
			setOpenAccounts(openAccounts.map((a) => (a.ticketId === response.ticketId ? response : a)));
			toast.success("Item updated successfully");
			setIsEditItemDialogOpen(false);
		} catch (error) {
			toast.error("Failed to update item");
			console.error(error);
		}
	};

	const handleRemoveItem = async (itemId: number) => {
		if (!selectedAccount) return;

		try {
			const response = await posService.removeItem(selectedAccount.ticketId, itemId);
			setSelectedAccount(response);
			setOpenAccounts(openAccounts.map((a) => (a.ticketId === response.ticketId ? response : a)));
			toast.success("Item removed successfully");
		} catch (error) {
			toast.error("Failed to remove item");
			console.error(error);
		}
	};

	const handleSendCommand = async () => {
		if (!selectedAccount) return;

		if (selectedAccount.items.length === 0) {
			toast.error("Please add items before sending command");
			return;
		}

		if (!selectedAccount.waiterId) {
			toast.error("Please assign a waiter before sending command");
			return;
		}

		setSendingCommand(true);
		try {
			const response = await posService.sendCommand(selectedAccount.ticketId);
			toast.success(`Command sent to ${response.stations.join(", ")} (${response.commandsCreated} items)`);
			// Reload the account to get updated state
			const updated = await posService.getAccount(selectedAccount.ticketId);
			setSelectedAccount(updated);
			setOpenAccounts(openAccounts.map((a) => (a.ticketId === updated.ticketId ? updated : a)));
		} catch (error) {
			toast.error("Failed to send command");
			console.error(error);
		} finally {
			setSendingCommand(false);
		}
	};

	const waiterMap = useMemo(() => new Map(waiters.map((w) => [w.id, w.name])), [waiters]);

	return (
		<div className="grid grid-cols-3 gap-6 p-6 min-h-screen bg-background">
			{/* Left: Accounts List */}
			<div className="col-span-1">
				<Card className="h-full flex flex-col">
					<CardHeader>
						<CardTitle>Open Accounts</CardTitle>
						<CardDescription>{openAccounts.length} accounts</CardDescription>
					</CardHeader>
					<CardContent className="flex-1 overflow-y-auto space-y-2">
						{loading ? (
							<p className="text-muted-foreground">Loading...</p>
						) : openAccounts.length === 0 ? (
							<p className="text-muted-foreground text-sm">No open accounts</p>
						) : (
							openAccounts.map((account) => (
								<Button
									key={account.ticketId}
									onClick={() => setSelectedAccount(account)}
									className={`w-full p-3 rounded border text-left transition ${
										selectedAccount?.ticketId === account.ticketId
											? "border-primary bg-primary/10"
											: "border-border hover:border-primary/50"
									}`}
								>
									<div className="flex justify-between items-start">
										<div>
											<p className="font-semibold">#{account.ticketNumber}</p>
											<p className="text-xs text-muted-foreground">{account.items.length} items</p>
										</div>
										<div className="text-right">
											<p className="font-semibold text-sm">${account.total.toFixed(2)}</p>
										</div>
									</div>
								</Button>
							))
						)}
					</CardContent>
					<div className="border-t p-4">
						<Button onClick={() => setIsCreateAccountDialogOpen(true)} className="w-full">
							<Plus className="mr-2 h-4 w-4" />
							New Account
						</Button>
					</div>
				</Card>
			</div>

			{/* Middle/Right: Account Details and Items */}
			<div className="col-span-2">
				{selectedAccount ? (
					<div className="space-y-4">
						{/* Account Header */}
						<Card>
							<CardHeader>
								<div className="flex justify-between items-start">
									<div>
										<CardTitle>Account #{selectedAccount.ticketNumber}</CardTitle>
										<CardDescription>{new Date(selectedAccount.createdAt).toLocaleString()}</CardDescription>
									</div>
									<Badge variant="outline">{selectedAccount.status}</Badge>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<Label className="text-xs">Assigned Waiter</Label>
									{selectedAccount.waiterName ? (
										<div className="flex justify-between items-center mt-1">
											<p className="font-medium">{selectedAccount.waiterName}</p>
											<Button variant="ghost" size="sm" onClick={() => setIsAssignWaiterDialogOpen(true)}>
												Change
											</Button>
										</div>
									) : (
										<Button variant="outline" className="w-full mt-1" onClick={() => setIsAssignWaiterDialogOpen(true)}>
											<Plus className="mr-2 h-4 w-4" />
											Assign Waiter
										</Button>
									)}
								</div>
							</CardContent>
						</Card>

						{/* Items */}
						<Card>
							<CardHeader>
								<CardTitle>Items</CardTitle>
							</CardHeader>
							<CardContent>
								{selectedAccount.items.length === 0 ? (
									<p className="text-muted-foreground text-sm">No items added yet</p>
								) : (
									<Table>
										<TableHeader>
											<TableRow className="text-xs">
												<TableHead>Product</TableHead>
												<TableHead className="text-right">Qty</TableHead>
												<TableHead className="text-right">Price</TableHead>
												<TableHead className="text-right">Total</TableHead>
												<TableHead>Notes</TableHead>
												<TableHead className="text-right">Actions</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{selectedAccount.items.map((item) => (
												<TableRow key={item.id} className="text-sm">
													<TableCell className="font-medium">{item.productName}</TableCell>
													<TableCell className="text-right">{item.qty}</TableCell>
													<TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
													<TableCell className="text-right font-semibold">
														${(item.qty * item.unitPrice).toFixed(2)}
													</TableCell>
													<TableCell className="text-xs max-w-xs truncate">{item.notes || "-"}</TableCell>
													<TableCell className="text-right space-x-1">
														<Button
															variant="ghost"
															size="sm"
															onClick={() => {
																setEditItemForm({
																	itemId: item.id,
																	quantity: item.qty,
																	notes: item.notes || "",
																});
																setIsEditItemDialogOpen(true);
															}}
														>
															Edit
														</Button>
														<Button variant="ghost" size="sm" onClick={() => handleRemoveItem(item.id)}>
															<Trash2 className="h-3 w-3" />
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

						{/* Totals */}
						<Card className="bg-muted/50">
							<CardContent className="pt-6">
								<div className="space-y-2">
									<div className="flex justify-between text-sm">
										<span>Subtotal:</span>
										<span className="font-medium">${selectedAccount.subtotal.toFixed(2)}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span>Tax:</span>
										<span className="font-medium">${selectedAccount.tax.toFixed(2)}</span>
									</div>
									<div className="border-t pt-2 flex justify-between">
										<span className="font-semibold">Total:</span>
										<span className="font-bold text-lg">${selectedAccount.total.toFixed(2)}</span>
									</div>
								</div>

								<Button
									onClick={handleSendCommand}
									disabled={sendingCommand || selectedAccount.items.length === 0 || !selectedAccount.waiterId}
									className="w-full mt-4"
									size="lg"
								>
									<Zap className="mr-2 h-4 w-4" />
									{sendingCommand ? "Sending..." : "Send Command to Kitchen"}
								</Button>
							</CardContent>
						</Card>
					</div>
				) : (
					<Card className="h-full flex items-center justify-center">
						<div className="text-center">
							<p className="text-muted-foreground mb-4">Select an account or create a new one</p>
							<Button onClick={() => setIsCreateAccountDialogOpen(true)}>Create New Account</Button>
						</div>
					</Card>
				)}
			</div>

			{/* Dialog: Create Account */}
			<Dialog open={isCreateAccountDialogOpen} onOpenChange={setIsCreateAccountDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create New Account</DialogTitle>
					</DialogHeader>
					<p className="text-muted-foreground">Create a new sales account/ticket?</p>
					<div className="flex gap-2 justify-end mt-4">
						<Button variant="outline" onClick={() => setIsCreateAccountDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleCreateAccount}>Create</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Dialog: Assign Waiter */}
			<Dialog open={isAssignWaiterDialogOpen} onOpenChange={setIsAssignWaiterDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Assign Waiter</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="waiter">Select Waiter *</Label>
							<Select value={assignWaiterForm.waiterId} onValueChange={(v) => setAssignWaiterForm({ waiterId: v })}>
								<SelectTrigger id="waiter">
									<SelectValue placeholder="Choose waiter..." />
								</SelectTrigger>
								<SelectContent>
									{waiters.map((waiter) => (
										<SelectItem key={waiter.id} value={waiter.id.toString()}>
											{waiter.name}
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

			{/* Dialog: Add Item */}
			<Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
				<DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Add Item to Account</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<Input
							placeholder="Search products..."
							value={searchProductTerm}
							onChange={(e) => setSearchProductTerm(e.target.value)}
						/>

						<div className="border rounded max-h-48 overflow-y-auto">
							{filteredProducts.map((product) => (
								<Button
									key={product.id}
									onClick={() => {
										setAddItemForm({
											...addItemForm,
											productId: product.id.toString(),
										});
									}}
									className={`w-full p-3 text-left border-b hover:bg-muted transition ${
										addItemForm.productId === product.id.toString() ? "bg-primary/10 border-primary" : ""
									}`}
								>
									<div className="flex justify-between">
										<span className="font-medium">{product.name}</span>
										<span className="text-sm text-muted-foreground">product.price</span>
									</div>
								</Button>
							))}
						</div>

						<div>
							<Label htmlFor="quantity">Quantity</Label>
							<Input
								id="quantity"
								type="number"
								min="1"
								value={addItemForm.quantity}
								onChange={(e) =>
									setAddItemForm({
										...addItemForm,
										quantity: Math.max(1, parseInt(e.target.value) || 1),
									})
								}
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
									setAddItemForm({
										productId: "",
										quantity: 1,
										notes: "",
									});
								}}
							>
								Cancel
							</Button>
							<Button onClick={handleAddItem}>Add Item</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Dialog: Edit Item */}
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
							<Button
								onClick={() => {
									handleUpdateItem(editItemForm.itemId);
									setIsEditItemDialogOpen(false);
								}}
							>
								Save
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
