import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import posService from "@/api/services/posService";
import { useCurrentBusiness } from "@/store/userStore";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";

export default function TaxConfigPage() {
	const business = useCurrentBusiness();
	const companyCen = business?.companyCen ?? "";

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [taxRate, setTaxRate] = useState("");

	const loadTaxConfig = useCallback(async () => {
		if (!companyCen) return;
		setLoading(true);
		try {
			const data = await posService.getTaxConfig(companyCen);
			setTaxRate(String(data.globalTaxPercentage));
		} catch {
			toast.error("Failed to load tax configuration");
		} finally {
			setLoading(false);
		}
	}, [companyCen]);

	useEffect(() => {
		loadTaxConfig();
	}, [loadTaxConfig]);

	const handleSave = async () => {
		const value = Number(taxRate);
		if (!taxRate || value < 0 || value > 100) {
			toast.error("Tax rate must be between 0 and 100");
			return;
		}
		setSaving(true);
		try {
			await posService.updateTaxConfig(companyCen, { globalTaxPercentage: value });
			toast.success("Tax configuration updated successfully");
			loadTaxConfig();
		} catch {
			toast.error("Failed to save tax configuration");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<p>Loading tax configuration...</p>
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-2xl font-bold">Tax Configuration</h1>
				<p className="text-muted-foreground">Configure the global tax rate that will be applied to all sales</p>
			</div>

			<Card className="max-w-md">
				<CardHeader>
					<CardTitle>Global Tax Rate</CardTitle>
					<CardDescription>Configure your default tax rate</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="space-y-2">
						<Label htmlFor="taxRate">Tax Rate (%)</Label>
						<div className="flex items-center gap-2">
							<Input
								id="taxRate"
								type="number"
								min="0"
								max="100"
								step="0.01"
								value={taxRate}
								onChange={(e) => setTaxRate(e.target.value)}
								placeholder="e.g., 19"
								className="text-lg font-semibold"
							/>
							<span className="text-lg font-semibold">%</span>
						</div>
						<p className="text-xs text-muted-foreground">Enter a value between 0 and 100</p>
					</div>

					<div className="bg-muted p-4 rounded space-y-2">
						<p className="text-sm font-medium">Example Calculation:</p>
						<div className="text-sm space-y-1">
							<p>Subtotal: $100.00</p>
							<p>
								Tax ({taxRate}%): ${(100 * (Number(taxRate) / 100)).toFixed(2)}
							</p>
							<p className="font-semibold">Total: ${(100 * (1 + Number(taxRate) / 100)).toFixed(2)}</p>
						</div>
					</div>

					<Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
						{saving ? "Saving..." : "Save Tax Configuration"}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
