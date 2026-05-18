import type { RouteObject } from "react-router";
import { Navigate } from "react-router";
import { Component } from "./utils";

export function getFrontendDashboardRoutes(): RouteObject[] {
	const frontendDashboardRoutes: RouteObject[] = [
		{ path: "workbench", element: Component("/pages/dashboard/workbench") },
		{ path: "stock", element: Component("/pages/dashboard/stock") },
		{ path: "inventory", element: Component("/pages/inventory") },
		{
			path: "sales",
			children: [
				{ index: true, element: <Navigate to="pos" replace /> },
				{ path: "tax-config", element: Component("/pages/sales/tax-config") },
				{ path: "pos", element: Component("/pages/sales/pos") },
				{ path: "kds", element: Component("/pages/sales/kds") },
			],
		},
		{
			path: "error",
			children: [
				{ index: true, element: <Navigate to="403" replace /> },
				{ path: "403", element: Component("/pages/sys/error/Page403") },
				{ path: "404", element: Component("/pages/sys/error/Page404") },
				{ path: "500", element: Component("/pages/sys/error/Page500") },
			],
		},
	];
	return frontendDashboardRoutes;
}
