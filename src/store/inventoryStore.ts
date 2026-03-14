import { create } from "zustand";
import type { Category, KardexEntry, Product, Unit, WarehouseProduct } from "@/types/entity";

type InventoryStore = {
	products: Product[];
	categories: Category[];
	units: Unit[];
	warehouseProducts: WarehouseProduct[];
	kardex: KardexEntry[];

	actions: {
		setProducts: (products: Product[]) => void;
		setCategories: (categories: Category[]) => void;
		setUnits: (units: Unit[]) => void;
		setWarehouseProducts: (wp: WarehouseProduct[]) => void;
		setKardex: (entries: KardexEntry[]) => void;
		clear: () => void;
	};
};

const useInventoryStore = create<InventoryStore>()((set) => ({
	products: [],
	categories: [],
	units: [],
	warehouseProducts: [],
	kardex: [],

	actions: {
		setProducts: (products) => set({ products }),
		setCategories: (categories) => set({ categories }),
		setUnits: (units) => set({ units }),
		setWarehouseProducts: (warehouseProducts) => set({ warehouseProducts }),
		setKardex: (kardex) => set({ kardex }),
		clear: () => set({ products: [], categories: [], units: [], warehouseProducts: [], kardex: [] }),
	},
}));

export const useProducts = () => useInventoryStore((s) => s.products);
export const useCategories = () => useInventoryStore((s) => s.categories);
export const useUnits = () => useInventoryStore((s) => s.units);
export const useWarehouseProducts = () => useInventoryStore((s) => s.warehouseProducts);
export const useKardex = () => useInventoryStore((s) => s.kardex);
export const useInventoryActions = () => useInventoryStore((s) => s.actions);

export default useInventoryStore;
