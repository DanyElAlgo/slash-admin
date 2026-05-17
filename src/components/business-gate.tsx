import { useCallback, useEffect, useMemo, useState } from "react";
import inventoryService from "@/api/services/inventoryService";
import { useCurrentBusiness, useUserActions } from "@/store/userStore";
import type { Business } from "@/types/entity";
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
	const { setCurrentBusiness } = useUserActions();

	const [companies, setCompanies] = useState<Business[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedCen, setSelectedCen] = useState(EMPTY_OPTION);
	const [saving, setSaving] = useState(false);

	const companyMap = useMemo(() => new Map(companies.map((company) => [company.companyCen, company])), [companies]);

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
		void loadCompanies();
	}, [loadCompanies]);

	const handleConfirm = async () => {
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

	if (currentBusiness) {
		return <>{children}</>;
	}

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
						<Button onClick={handleConfirm} disabled={selectedCen === EMPTY_OPTION || saving}>
							{saving ? "Setting..." : "Continue"}
						</Button>
					</div>
				</div>
			</Card>
		</div>
	);
}
