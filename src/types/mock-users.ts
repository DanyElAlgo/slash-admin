import type { UserInfo } from "./entity";

export interface MockUser extends UserInfo {
	password?: string; // For demo purposes only
}

export const MOCK_USERS: MockUser[] = [
	{
		id: "user-1",
		username: "Company 1",
		email: "john@company1.com",
		avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
		roles: ["admin"],
		permissions: ["inventory.manage", "products.create", "stock.manage"],
	},
	{
		id: "user-2",
		username: "Company 2",
		email: "jane@company2.com",
		avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
		roles: ["manager"],
		permissions: ["inventory.view", "stock.manage"],
	},
	{
		id: "user-3",
		username: "Company 3",
		email: "mike@company3.com",
		avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
		roles: ["supervisor"],
		permissions: ["inventory.view", "stock.view"],
	},
];
