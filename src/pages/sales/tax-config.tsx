import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import posService from "@/api/services/posService";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";

interface TaxConfig {
	id: number;
	taxRate: number;
	isActive: boolean;
	createdAt: string;
}

export default function TaxConfigPage() {
	const [taxConfig, setTaxConfig] = useState<TaxConfig | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [taxRate, setTaxRate] = useState("");

	const loadTaxConfig = useCallback(async () => {
		setLoading(true);
		try {
			const data = await posService.getTaxConfig();
			setTaxConfig(data);
			setTaxRate((data.taxRate * 100).toFixed(2));
		} catch (error) {
			toast.error("Failed to load tax configuration");
			console.error(error);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadTaxConfig();
	}, [loadTaxConfig]);

	const handleSave = async () => {
		if (!taxRate || Number(taxRate) < 0 || Number(taxRate) > 100) {
			toast.error("Tax rate must be between 0 and 100");
			return;
		}

		setSaving(true);
		try {
			const newRate = Number(taxRate) / 100;
			await posService.updateTaxConfig({ taxRate: newRate });
			toast.success("Tax configuration updated successfully");
			loadTaxConfig();
		} catch (error) {
			toast.error("Failed to save tax configuration");
			console.error(error);
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
					<CardDescription>
						{taxConfig
							? `Last updated: ${new Date(taxConfig.createdAt).toLocaleDateString()}`
							: "Configure your default tax rate"}
					</CardDescription>
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
