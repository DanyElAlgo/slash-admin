import { Suspense, lazy } from "react";
import type { RouteObject } from "react-router";
import { Outlet } from "react-router";

const LoginPage = lazy(() => import("@/pages/sys/login"));
const BusinessSelectPage = lazy(() => import("@/pages/sys/business-select"));

const authCustom: RouteObject[] = [
	{
		path: "login",
		element: <LoginPage />,
	},
	{
		path: "select-business",
		element: <BusinessSelectPage />,
	},
];

export const authRoutes: RouteObject[] = [
	{
		path: "auth",
		element: (
			<Suspense>
				<Outlet />
			</Suspense>
		),
		children: [...authCustom],
	},
];
