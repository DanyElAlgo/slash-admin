import { useEffect } from "react";
import { toast } from "sonner";
import { GLOBAL_CONFIG } from "@/global-config";
import { useCurrentBusiness } from "@/store/userStore";

type RestockEvent = {
	companyCen: string;
	productCen: string;
	productName: string;
	quantity: number;
	warehouseCen: string;
	occurredAt: string;
};

export function useRestockEvents() {
	const business = useCurrentBusiness();
	const companyCen = business?.companyCen;

	useEffect(() => {
		if (!companyCen) return;

		const url = `${GLOBAL_CONFIG.inventoryApiUrl}/inventory/companies/${companyCen}/restock-events`;
		const source = new EventSource(url);

		source.onmessage = (e) => {
			try {
				const restock: RestockEvent = JSON.parse(e.data);
				toast.success(`Restock: ${restock.productName} +${restock.quantity}`, {
					description: `Warehouse ${restock.warehouseCen}`,
					position: "top-center",
				});
			} catch {}
		};

		return () => source.close();
	}, [companyCen]);
}
