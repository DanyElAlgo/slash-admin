import { Check, Plus, Trash2, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import inventoryService from "@/api/services/inventoryService";
import posService, { type AccountResponse } from "@/api/services/posService";
import salesService from "@/api/services/salesService";
import type { PaymentType, Product } from "@/types/entity";
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
	const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
	const [loading, setLoading] = useState(true);

	// Dialog states
	const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
	const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false);
	const [isCreateAccountDialogOpen, setIsCreateAccountDialogOpen] = useState(false);
	const [isAssignWaiterDialogOpen, setIsAssignWaiterDialogOpen] = useState(false);
	const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
	const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

	// Form states
	const [addItemForm, setAddItemForm] = useState({ productId: "", quantity: "1", notes: "" });
	const [editItemForm, setEditItemForm] = useState({ itemId: 0, quantity: 1, notes: "" });
	const [assignWaiterForm, setAssignWaiterForm] = useState({ waiterId: "" });
	const [checkoutPaymentTypeId, setCheckoutPaymentTypeId] = useState<string>("");

	const [searchProductTerm, setSearchProductTerm] = useState("");
	const [sendingCommand, setSendingCommand] = useState(false);
	const [checkingOut, setCheckingOut] = useState(false);
	const [cancelling, setCancelling] = useState(false);

	const loadAllData = useCallback(async () => {
		setLoading(true);
		try {
			const [accountsData, productsData, paymentTypesData] = await Promise.all([
				posService.getOpenAccounts(),
				inventoryService.getProducts(),
				salesService.getPaymentTypes(),
			]);
			setOpenAccounts(accountsData);
			setProducts(productsData.filter((p) => p.isActive && !p.isOutOfStock));
			setPaymentTypes(paymentTypesData);
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
			const response = await posService.createAccount();
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
		const qty = parseInt(addItemForm.quantity);
		if (!addItemForm.productId || isNaN(qty) || qty <= 0) {
			toast.error("Please select a product and quantity");
			return;
		}
		try {
			const response = await posService.addItem(selectedAccount.ticketId, {
				productId: Number(addItemForm.productId),
				quantity: qty,
				note: addItemForm.notes,
			});
			setSelectedAccount(response);
			setOpenAccounts(openAccounts.map((a) => (a.ticketId === response.ticketId ? response : a)));
			toast.success("Item added successfully");
			setIsAddItemDialogOpen(false);
			setAddItemForm({ productId: "", quantity: "1", notes: "" });
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
				note: editItemForm.notes,
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
			toast.success(`${response.message} (${response.itemsSent} items sent)`);
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

	const handleCheckout = async () => {
		if (!selectedAccount || !checkoutPaymentTypeId) return;
		setCheckingOut(true);
		try {
			await posService.checkout(selectedAccount.ticketId, {
				paymentTypeId: Number(checkoutPaymentTypeId),
			});
			toast.success(`Payment confirmed — Total: $${selectedAccount.total.toFixed(2)}`);
			setOpenAccounts(openAccounts.filter((a) => a.ticketId !== selectedAccount.ticketId));
			setSelectedAccount(null);
			setIsCheckoutDialogOpen(false);
			setCheckoutPaymentTypeId("");
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : "Checkout failed";
			toast.error(message);
		} finally {
			setCheckingOut(false);
		}
	};

	const handleCancelAccount = async () => {
		if (!selectedAccount) return;
		setCancelling(true);
		try {
			await posService.cancelAccount(selectedAccount.ticketId);
			toast.success("Account cancelled");
			setOpenAccounts(openAccounts.filter((a) => a.ticketId !== selectedAccount.ticketId));
			setSelectedAccount(null);
			setIsCancelDialogOpen(false);
		} catch (error) {
			toast.error("Failed to cancel account");
			console.error(error);
		} finally {
			setCancelling(false);
		}
	};

	const canCheckout =
		selectedAccount?.status?.toLowerCase() === "open" && selectedAccount.items.length > 0 && !!selectedAccount.waiterId;

	return (
		<div className="grid grid-cols-3 gap-6 p-6 min-h-screen bg-background">
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
											<p className="font-semibold">#{account.accountNumber}</p>
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

			<div className="col-span-2">
				{selectedAccount ? (
					<div className="space-y-4">
						<Card>
							<CardHeader>
								<div className="flex justify-between items-start">
									<div>
										<CardTitle>Account #{selectedAccount.accountNumber}</CardTitle>
										<CardDescription>{new Date(selectedAccount.createdAt).toLocaleString()}</CardDescription>
									</div>
									<div className="flex items-center gap-2">
										<Badge variant="outline">{selectedAccount.status}</Badge>
										<Button
											variant="destructive"
											size="sm"
											onClick={() => setIsCancelDialogOpen(true)}
											disabled={selectedAccount.status?.toLowerCase() !== "open"}
										>
											Cancel Account
										</Button>
									</div>
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
											<TableRow className="text-xs grid-cols-6">
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
												<TableRow key={item.id} className="text-sm grid-cols-6">
													<TableCell className="font-medium">{item.productName}</TableCell>
													<TableCell className="text-right">{item.quantity}</TableCell>
													<TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
													<TableCell className="text-right font-semibold">${item.lineTotal.toFixed(2)}</TableCell>
													<TableCell className="text-xs max-w-xs truncate">{item.note || "-"}</TableCell>
													<TableCell className="text-right space-x-1">
														<Button
															variant="ghost"
															size="sm"
															onClick={() => {
																setEditItemForm({
																	itemId: item.id,
																	quantity: item.quantity,
																	notes: item.note || "",
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

								<div className="flex gap-2 mt-4">
									<Button
										onClick={handleSendCommand}
										disabled={sendingCommand || selectedAccount.items.length === 0 || !selectedAccount.waiterId}
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
							<p className="text-muted-foreground mb-4">Select an account or create a new one</p>
							<Button onClick={() => setIsCreateAccountDialogOpen(true)}>Create New Account</Button>
						</div>
					</Card>
				)}
			</div>

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

			<Dialog open={isAssignWaiterDialogOpen} onOpenChange={setIsAssignWaiterDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Assign Waiter</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="waiter">Waiter ID *</Label>
							<Input
								id="waiter"
								type="number"
								min="1"
								placeholder="Enter waiter ID..."
								value={assignWaiterForm.waiterId}
								onChange={(e) => setAssignWaiterForm({ waiterId: e.target.value })}
							/>
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

						<div className="border rounded max-h-48 overflow-y-auto space-y-1">
							{filteredProducts.map((product) => {
								const isSelected = addItemForm.productId === product.id.toString();
								return (
									<Button
										key={product.id}
										variant="ghost"
										onClick={() => setAddItemForm({ ...addItemForm, productId: product.id.toString() })}
										className={`w-full justify-start p-3 text-left border-b rounded-none transition ${
											isSelected
												? "bg-primary/10 border-l-2 border-l-primary hover:bg-primary/15"
												: "hover:bg-secondary/60"
										}`}
									>
										<div className="flex justify-between items-center w-full">
											<span className="font-medium">{product.name}</span>
											<div className="flex items-center gap-2">
												<span className="text-sm text-muted-foreground">${product.price.toFixed(2)}</span>
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
									setAddItemForm({ productId: "", quantity: "1", notes: "" });
								}}
							>
								Cancel
							</Button>
							<Button onClick={handleAddItem}>Add Item</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

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

			<Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>Confirm Payment</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="bg-muted rounded p-4 space-y-1 text-sm">
							<div className="flex justify-between">
								<span>Subtotal:</span>
								<span>${selectedAccount?.subtotal.toFixed(2)}</span>
							</div>
							<div className="flex justify-between">
								<span>Tax:</span>
								<span>${selectedAccount?.tax.toFixed(2)}</span>
							</div>
							<div className="flex justify-between font-bold text-base pt-1 border-t">
								<span>Total:</span>
								<span>${selectedAccount?.total.toFixed(2)}</span>
							</div>
						</div>

						<div>
							<Label htmlFor="paymentType">Payment Method *</Label>
							<Select value={checkoutPaymentTypeId} onValueChange={setCheckoutPaymentTypeId}>
								<SelectTrigger id="paymentType" className="mt-1">
									<SelectValue placeholder="Select payment method..." />
								</SelectTrigger>
								<SelectContent>
									{paymentTypes.map((pt) => (
										<SelectItem key={pt.id} value={String(pt.id)}>
											{pt.name}
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
									setCheckoutPaymentTypeId("");
								}}
							>
								Cancel
							</Button>
							<Button onClick={handleCheckout} disabled={!checkoutPaymentTypeId || checkingOut}>
								{checkingOut ? "Processing..." : "Confirm Payment"}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>Cancel Account</DialogTitle>
					</DialogHeader>
					<p className="text-muted-foreground text-sm">
						Are you sure you want to cancel account #{selectedAccount?.accountNumber}? This action cannot be undone.
					</p>
					<div className="flex gap-2 justify-end mt-4">
						<Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
							Keep Account
						</Button>
						<Button variant="destructive" onClick={handleCancelAccount} disabled={cancelling}>
							{cancelling ? "Cancelling..." : "Yes, Cancel"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
