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
				title: "POS",
				path: "/sales/pos",
				icon: <Icon icon="solar:shop-bold-duotone" size="24" />,
			},
			{
				title: "KDS",
				path: "/sales/kds",
				icon: <Icon icon="solar:chef-hat-heart-bold-duotone" size="24" />,
			},
			{
				title: "Tax Configuration",
				path: "/sales/tax-config",
				icon: <Icon icon="solar:settings-bold-duotone" size="24" />,
			},
		],
	},
	{
		name: "Purchases",
		items: [
			{
				title: "Purchase Orders",
				path: "/purchases/orders",
				icon: <Icon icon="solar:cart-large-bold-duotone" size="24" />,
			},
			{
				title: "Suppliers",
				path: "/purchases/suppliers",
				icon: <Icon icon="solar:users-group-rounded-bold-duotone" size="24" />,
			},
		],
	},
];
