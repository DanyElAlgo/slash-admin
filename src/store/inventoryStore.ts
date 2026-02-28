import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Product, Warehouse } from "@/types/entity";
import { sum } from "ramda";
import inventoryService from "@/api/services/inventoryService";

export interface StockMovement {
	id: string;
	productId: string;
	productName: string;
	type: "in" | "out";
	quantity: number;
	reason: string;
	date: string;
	userId: string;
}

type InventoryStore = {
	products: Product[];
	warehouses: Warehouse[];
	stockMovements: StockMovement[];
	userInventoryData: Record<string, { products: Product[]; warehouses: Warehouse[]; stockMovements: StockMovement[] }>;

	actions: {
		setUserInventoryData: (
			userId: string,
			products: Product[],
			warehouses: Warehouse[],
			movements: StockMovement[],
		) => void;
		loadUserData: (userId: string) => void;
		addProduct: (product: Product) => void;
		updateProduct: (productId: string, updates: Partial<Product>) => void;
		deleteProduct: (productId: string) => void;
		addStockMovement: (movement: StockMovement) => void;
		getSummary: (userId: string) => {
			totalProducts: number;
			totalStock: number;
			totalValue: number;
			lowStockCount: number;
		};
	};
};

// Mock data for each user
const getMockDataForUser = (
	userId: string,
): { products: Product[]; warehouses: Warehouse[]; movements: StockMovement[] } => {
	const allProducts: Record<string, Product[]> = {
		"user-1": [
			{
				id: "prod-1",
				name: "Laptop",
				quantity: 15,
				price: 1200,
				category: "Electronics",
				lastRestockDate: "2025-02-10",
				warehouseId: "001",
			},
			{
				id: "prod-1",
				name: "Laptop",
				quantity: 15,
				price: 1200,
				category: "Electronics",
				lastRestockDate: "2025-02-10",
				warehouseId: "002",
			},
			{
				id: "prod-2",
				name: "Mouse",
				quantity: 45,
				price: 25,
				category: "Accessories",
				lastRestockDate: "2025-02-08",
				warehouseId: "001",
			},
			{
				id: "prod-3",
				name: "Keyboard",
				quantity: 32,
				price: 75,
				category: "Accessories",
				lastRestockDate: "2025-02-05",
				warehouseId: "001",
			},
		],
		"user-2": [
			{
				id: "prod-1",
				name: "Office Chair",
				quantity: 8,
				price: 350,
				category: "Furniture",
				lastRestockDate: "2025-01-20",
				warehouseId: "001",
			},
			{
				id: "prod-2",
				name: "Desk Lamp",
				quantity: 25,
				price: 45,
				category: "Lighting",
				lastRestockDate: "2025-02-12",
				warehouseId: "001",
			},
			{
				id: "prod-3",
				name: "File Cabinet",
				quantity: 5,
				price: 200,
				category: "Furniture",
				lastRestockDate: "2025-02-01",
				warehouseId: "001",
			},
		],
		"user-3": [
			{
				id: "prod-1",
				name: "Monitor",
				quantity: 12,
				price: 300,
				category: "Electronics",
				lastRestockDate: "2025-02-09",
				warehouseId: "001",
			},
			{
				id: "prod-2",
				name: "Webcam",
				quantity: 18,
				price: 80,
				category: "Electronics",
				lastRestockDate: "2025-02-07",
				warehouseId: "001",
			},
		],
	};

	const allWarehouses: Record<string, Warehouse[]> = {
		"user-1": [
			{
				id: "001",
				name: "Test Warehouse",
			},
			{
				id: "002",
				name: "Another test warehouse",
			},
		],
		"user-2": [
			{
				id: "001",
				name: "Text Warehouse",
			},
			{
				id: "002",
				name: "An extra warehouse to try out",
			},
		],
		"user-3": [
			{
				id: "001",
				name: "Tent Warehouse",
			},
			{
				id: "003",
				name: "This should be a warehouse",
			},
		],
	};

	const allMovements: Record<string, StockMovement[]> = {
		"user-1": [
			{
				id: "mov-1",
				productId: "prod-1",
				productName: "Laptop",
				type: "in",
				quantity: 10,
				reason: "New stock arrival",
				date: "2025-02-10",
				userId: "user-1",
			},
			{
				id: "mov-2",
				productId: "prod-2",
				productName: "Mouse",
				type: "out",
				quantity: 5,
				reason: "Sales",
				date: "2025-02-11",
				userId: "user-1",
			},
		],
		"user-2": [
			{
				id: "mov-1",
				productId: "prod-1",
				productName: "Office Chair",
				type: "out",
				quantity: 2,
				reason: "Office setup",
				date: "2025-02-12",
				userId: "user-2",
			},
			{
				id: "mov-2",
				productId: "prod-2",
				productName: "Desk Lamp",
				type: "in",
				quantity: 15,
				reason: "Bulk purchase",
				date: "2025-02-11",
				userId: "user-2",
			},
		],
		"user-3": [
			{
				id: "mov-1",
				productId: "prod-1",
				productName: "Monitor",
				type: "in",
				quantity: 8,
				reason: "Restock",
				date: "2025-02-09",
				userId: "user-3",
			},
		],
	};

	return {
		products: allProducts[userId] || [],
		warehouses: allWarehouses[userId] || [],
		movements: allMovements[userId] || [],
	};
};

const useInventoryStore = create<InventoryStore>()(
	persist(
		(set, get) => ({
			products: [],
			warehouses: [],
			stockMovements: [],
			userInventoryData: {},

			actions: {
				setUserInventoryData: (
					userId: string,
					products: Product[],
					warehouses: Warehouse[],
					movements: StockMovement[],
				) => {
					set((state) => ({
						products,
						warehouses,
						stockMovements: movements,
						userInventoryData: {
							...state.userInventoryData,
							[userId]: { products, warehouses, stockMovements: movements },
						},
					}));
				},

				loadUserData: (userId: string) => {
					const { userInventoryData } = get();
					// If user data exists in store, use it; otherwise, use mock data
					if (userInventoryData[userId]) {
						const { products, warehouses, stockMovements } = userInventoryData[userId];
						set({ products, warehouses, stockMovements });
					} else {
						const { products, warehouses, movements } = getMockDataForUser(userId);
						set({
							products,
							warehouses,
							stockMovements: movements,
							userInventoryData: {
								...userInventoryData,
								[userId]: { products, warehouses, stockMovements: movements },
							},
						});
					}
				},

				addProduct: (product: Product) => {
					set((state) => ({
						products: [...state.products, product],
					}));
				},

				updateProduct: (productId: string, updates: Partial<Product>) => {
					set((state) => ({
						products: state.products.map((p) => (p.id === productId ? { ...p, ...updates } : p)),
					}));
				},

				deleteProduct: (productId: string) => {
					set((state) => ({
						products: state.products.filter((p) => p.id !== productId),
					}));
				},

				addStockMovement: (movement: StockMovement) => {
					set((state) => ({
						stockMovements: [...state.stockMovements, movement],
					}));
				},

				getSummary: (userId: string) => {
					const { products } = get();
					const totalProducts = products.length;
					const totalValue = products.reduce((sum, p) => sum + p.quantity * p.price, 0);
					const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
					const lowStockCount = products.filter((p) => p.quantity < 10).length;

					return {
						totalProducts,
						totalValue,
						totalStock,
						lowStockCount,
					};
				},
			},
		}),
		{
			name: "inventoryStore",
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({
				userInventoryData: state.userInventoryData,
			}),
		},
	),
);

export const useProducts = () => useInventoryStore((state) => state.products);
export const useWarehouses = () => useInventoryStore((state) => state.warehouses);
export const useStockMovements = () => useInventoryStore((state) => state.stockMovements);
export const useInventoryActions = () => useInventoryStore((state) => state.actions);

export default useInventoryStore;
