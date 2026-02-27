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
			{
				title: "Stock",
				path: "/stock",
				icon: <Icon icon="local:ic-analysis" size="24" />,
			},
			{
				title: "Inventory",
				path: "/inventory",
				icon: <Icon icon="solar:box-bold-duotone" size="24" />,
			},
		],
	},
];
