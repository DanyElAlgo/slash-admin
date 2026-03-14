import { Icon } from "@/components/icon";
import type { NavProps } from "@/components/nav";

export const frontendNavData: NavProps["data"] = [
	{
		name: "sys.nav.dashboard",
		items: [
			{
				title: "sys.nav.workbench",
				path: "/workbench",
				icon: <Icon icon="local:ic-workbench" size="24" />,
			},
		],
	},
	{
		name: "Inventory",
		items: [
			{
				title: "Stock",
				path: "/stock",
				icon: <Icon icon="local:ic-analysis" size="24" />,
			},
			{
				title: "Products",
				path: "/inventory",
				icon: <Icon icon="solar:box-bold-duotone" size="24" />,
			},
		],
	},
	{
		name: "Sales",
		items: [
			{
				title: "Orders",
				path: "/sales/orders",
				icon: <Icon icon="solar:clipboard-list-bold-duotone" size="24" />,
			},
			{
				title: "Customers",
				path: "/sales/customers",
				icon: <Icon icon="solar:users-group-rounded-bold-duotone" size="24" />,
			},
			{
				title: "Payments",
				path: "/sales/payments",
				icon: <Icon icon="solar:wallet-money-bold-duotone" size="24" />,
			},
		],
	},
];
