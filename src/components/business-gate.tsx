import { useCallback, useEffect, useMemo, useState } from "react";
import inventoryService from "@/api/services/inventoryService";
import { useCurrentBusiness, useCurrentWarehouse, useUserActions } from "@/store/userStore";
import type { Business, Warehouse } from "@/types/entity";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";

const EMPTY_OPTION = "__none__";

type BusinessGateProps = {
	children: React.ReactNode;
	title?: string;
	description?: string;
};

export default function BusinessGate({
	children,
	title = "Select a company",
	description = "Choose the active company before continuing.",
}: BusinessGateProps) {
	const currentBusiness = useCurrentBusiness();
	const currentWarehouse = useCurrentWarehouse();
	const { setCurrentBusiness, setCurrentWarehouse } = useUserActions();

	const [companies, setCompanies] = useState<Business[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedCen, setSelectedCen] = useState(EMPTY_OPTION);
	const [saving, setSaving] = useState(false);

	const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
	const [loadingWarehouses, setLoadingWarehouses] = useState(false);
	const [selectedWarehouseCen, setSelectedWarehouseCen] = useState(EMPTY_OPTION);

	const companyMap = useMemo(() => new Map(companies.map((company) => [company.companyCen, company])), [companies]);
	const warehouseMap = useMemo(() => new Map(warehouses.map((w) => [w.warehouseCen, w])), [warehouses]);

	const loadCompanies = useCallback(async () => {
		setLoading(true);
		try {
			const data = await inventoryService.getCompanies();
			setCompanies(data);
		} catch {
			setCompanies([]);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!currentBusiness) void loadCompanies();
	}, [currentBusiness, loadCompanies]);

	// Load warehouses once a company is chosen but no warehouse is selected yet.
	useEffect(() => {
		if (!currentBusiness || currentWarehouse) return;
		let cancelled = false;
		setLoadingWarehouses(true);
		inventoryService
			.getWarehouses(currentBusiness.companyCen)
			.then((data) => {
				if (cancelled) return;
				setWarehouses(data ?? []);
				// Auto-select when there is exactly one warehouse.
				if ((data?.length ?? 0) === 1) setCurrentWarehouse(data[0]);
			})
			.catch(() => {
				if (!cancelled) setWarehouses([]);
			})
			.finally(() => {
				if (!cancelled) setLoadingWarehouses(false);
			});
		return () => {
			cancelled = true;
		};
	}, [currentBusiness, currentWarehouse, setCurrentWarehouse]);

	const handleConfirmCompany = async () => {
		if (selectedCen === EMPTY_OPTION) return;
		const selected = companyMap.get(selectedCen);
		if (!selected) return;

		setSaving(true);
		try {
			setCurrentBusiness(selected);
		} finally {
			setSaving(false);
		}
	};

	const handleConfirmWarehouse = () => {
		if (selectedWarehouseCen === EMPTY_OPTION) return;
		const selected = warehouseMap.get(selectedWarehouseCen);
		if (selected) setCurrentWarehouse(selected);
	};

	// Step 1 — company.
	if (!currentBusiness) {
		return (
			<div className="flex min-h-[50vh] items-center justify-center p-6">
				<Card className="w-full max-w-lg p-6">
					<h1 className="text-2xl font-semibold">{title}</h1>
					<p className="mt-1 text-sm text-muted-foreground">{description}</p>

					<div className="mt-4 space-y-3">
						<Select value={selectedCen} onValueChange={setSelectedCen} disabled={loading}>
							<SelectTrigger>
								<SelectValue placeholder={loading ? "Loading companies..." : "Select a company"} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={EMPTY_OPTION}>Select a company</SelectItem>
								{companies.map((company) => (
									<SelectItem key={company.companyCen} value={company.companyCen}>
										{company.name} ({company.companyCen})
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<div className="flex justify-end">
							<Button onClick={handleConfirmCompany} disabled={selectedCen === EMPTY_OPTION || saving}>
								{saving ? "Setting..." : "Continue"}
							</Button>
						</div>
					</div>
				</Card>
			</div>
		);
	}

	// Step 2 — warehouse.
	if (!currentWarehouse) {
		return (
			<div className="flex min-h-[50vh] items-center justify-center p-6">
				<Card className="w-full max-w-lg p-6">
					<h1 className="text-2xl font-semibold">Select a warehouse</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Choose the warehouse you are working from for {currentBusiness.name}.
					</p>

					<div className="mt-4 space-y-3">
						<Select value={selectedWarehouseCen} onValueChange={setSelectedWarehouseCen} disabled={loadingWarehouses}>
							<SelectTrigger>
								<SelectValue placeholder={loadingWarehouses ? "Loading warehouses..." : "Select a warehouse"} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={EMPTY_OPTION}>Select a warehouse</SelectItem>
								{warehouses.map((w) => (
									<SelectItem key={w.warehouseCen} value={w.warehouseCen}>
										{w.name} ({w.warehouseCen})
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<div className="flex justify-end">
							<Button onClick={handleConfirmWarehouse} disabled={selectedWarehouseCen === EMPTY_OPTION}>
								Continue
							</Button>
						</div>
					</div>
				</Card>
			</div>
		);
	}

	return <>{children}</>;
}
