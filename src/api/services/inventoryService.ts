import apiClient from "../apiClient";
import type { Product, StockMovement } from "@/types/entity";

const inventoryService = {
	getProducts: () => apiClient.get<Product[]>("/products"),
	createProduct: (data: Product) => apiClient.post<Product>("/products", data),
	updateStock: (productId: string, quantity: number) => apiClient.post(`/products/${productId}/stock`, { quantity }),
};

export default inventoryService;
