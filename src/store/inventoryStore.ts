import { create } from "zustand";
import type { Category, InventoryDocument, KardexEntry, Product, StockItem, Unit, Warehouse } from "@/types/entity";

type InventoryStore = {
	products: Product[];
	categories: Category[];
	units: Unit[];
	warehouses: Warehouse[];
	stockItems: StockItem[];
	kardex: KardexEntry[];
	documents: InventoryDocument[];

	actions: {
		setProducts: (products: Product[]) => void;
		setCategories: (categories: Category[]) => void;
		setUnits: (units: Unit[]) => void;
		setWarehouses: (warehouses: Warehouse[]) => void;
		setStockItems: (items: StockItem[]) => void;
		setKardex: (entries: KardexEntry[]) => void;
		setDocuments: (documents: InventoryDocument[]) => void;
		clear: () => void;
	};
};

const useInventoryStore = create<InventoryStore>()((set) => ({
	products: [],
	categories: [],
	units: [],
	warehouses: [],
	stockItems: [],
	kardex: [],
	documents: [],

	actions: {
		setProducts: (products) => set({ products }),
		setCategories: (categories) => set({ categories }),
		setUnits: (units) => set({ units }),
		setWarehouses: (warehouses) => set({ warehouses }),
		setStockItems: (stockItems) => set({ stockItems }),
		setKardex: (kardex) => set({ kardex }),
		setDocuments: (documents) => set({ documents }),
		clear: () =>
			set({ products: [], categories: [], units: [], warehouses: [], stockItems: [], kardex: [], documents: [] }),
	},
}));

export const useProducts = () => useInventoryStore((s) => s.products);
export const useCategories = () => useInventoryStore((s) => s.categories);
export const useUnits = () => useInventoryStore((s) => s.units);
export const useWarehouses = () => useInventoryStore((s) => s.warehouses);
export const useStockItems = () => useInventoryStore((s) => s.stockItems);
export const useKardex = () => useInventoryStore((s) => s.kardex);
export const useDocuments = () => useInventoryStore((s) => s.documents);
export const useInventoryActions = () => useInventoryStore((s) => s.actions);

export default useInventoryStore;
