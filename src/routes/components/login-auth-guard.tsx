import { useCallback, useEffect } from "react";
import { useUserActions, useUserToken, useUserInfo } from "@/store/userStore";
import { useInventoryActions } from "@/store/inventoryStore";
import { useRouter } from "../hooks";

type Props = {
	children: React.ReactNode;
};
export default function LoginAuthGuard({ children }: Props) {
	const router = useRouter();
	const { accessToken } = useUserToken();
	const userInfo = useUserInfo();
	const { setUserToken, setUserInfo } = useUserActions();
	const { loadUserData } = useInventoryActions();

	const check = useCallback(() => {
		if (!accessToken) {
			// Bypass login in development mode
			if (import.meta.env.DEV) {
				// Set mock credentials for development
				const mockUser = {
					id: "dev-user-1",
					username: "Dev Admin",
					email: "admin@dev.local",
					permissions: [],
					roles: ["admin"],
				};
				setUserToken({
					accessToken: "dev-mock-token",
					refreshToken: "dev-mock-refresh",
				});
				setUserInfo(mockUser);
				loadUserData(mockUser.id);
			} else {
				router.replace("/auth/login");
			}
		}
	}, [router, accessToken, setUserToken, setUserInfo, loadUserData]);

	// Load inventory data when user changes
	useEffect(() => {
		if (userInfo?.id) {
			loadUserData(userInfo.id);
		}
	}, [userInfo?.id, loadUserData]);

	useEffect(() => {
		check();
	}, [check]);

	return <>{children}</>;
}
