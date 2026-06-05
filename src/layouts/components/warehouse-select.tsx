import { Warehouse as WarehouseIcon } from "lucide-react";
import { useCallback, useEffect } from "react";
import inventoryService from "@/api/services/inventoryService";
import { useInventoryActions, useWarehouses } from "@/store/inventoryStore";
import { useCurrentBusiness, useCurrentWarehouse, useUserActions } from "@/store/userStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";

/**
 * Global warehouse picker shown in the dashboard header next to the company.
 * The selected warehouse is persisted in the user store and consumed by sales
 * pages (e.g. POS) to filter the catalog and to bind newly-opened tickets, so
 * stock is consumed from the right warehouse at payment time.
 */
export default function WarehouseSelect() {
	const business = useCurrentBusiness();
	const companyCen = business?.companyCen ?? "";
	const warehouses = useWarehouses();
	const currentWarehouse = useCurrentWarehouse();
	const { setWarehouses } = useInventoryActions();
	const { setCurrentWarehouse } = useUserActions();

	const loadWarehouses = useCallback(async () => {
		if (!companyCen) {
			setWarehouses([]);
			return;
		}
		try {
			const data = await inventoryService.getWarehouses(companyCen);
			setWarehouses(data ?? []);
			// Convenience: if the company has a single warehouse and none is selected,
			// pick it automatically so the user isn't gated for no reason.
			if ((data?.length ?? 0) === 1 && !currentWarehouse) {
				setCurrentWarehouse(data[0]);
			}
		} catch {
			setWarehouses([]);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [companyCen]);

	useEffect(() => {
		void loadWarehouses();
	}, [loadWarehouses]);

	// No company selected yet → nothing to pick from.
	if (!companyCen) return null;

	const handleChange = (warehouseCen: string) => {
		const selected = warehouses.find((w) => w.warehouseCen === warehouseCen) ?? null;
		setCurrentWarehouse(selected);
	};

	return (
		<Select value={currentWarehouse?.warehouseCen ?? ""} onValueChange={handleChange}>
			<SelectTrigger className="h-9 w-[180px] gap-2" aria-label="Select warehouse">
				<WarehouseIcon className="h-4 w-4 shrink-0 text-text-secondary" />
				<SelectValue placeholder="Select warehouse" />
			</SelectTrigger>
			<SelectContent>
				{warehouses.length === 0 ? (
					<SelectItem value="__none__" disabled>
						No warehouses
					</SelectItem>
				) : (
					warehouses.map((w) => (
						<SelectItem key={w.warehouseCen} value={w.warehouseCen}>
							{w.name}
						</SelectItem>
					))
				)}
			</SelectContent>
		</Select>
	);
}
