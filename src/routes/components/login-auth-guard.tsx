import { useCallback, useEffect } from "react";
import { useUserActions, useUserToken } from "@/store/userStore";
import { useRouter } from "../hooks";

type Props = {
	children: React.ReactNode;
};
export default function LoginAuthGuard({ children }: Props) {
	const router = useRouter();
	const { accessToken } = useUserToken();
	const { setUserToken, setUserInfo, setCurrentBusiness, setCurrentWarehouse } = useUserActions();

	const check = useCallback(() => {
		if (!accessToken) {
			// Bypass login in development mode
			if (import.meta.env.DEV) {
				const mockUser = {
					id: "dev-user-1",
					username: "Dev Admin",
					email: "admin@dev.local",
					permissions: [],
					roles: [{ id: "1", name: "admin", code: "admin" }],
				};
				setUserToken({
					accessToken: "dev-mock-token",
					refreshToken: "dev-mock-refresh",
				});
				setUserInfo(mockUser);
				setCurrentBusiness({ companyCen: "BUS-000002", name: "Dev Business", isActive: true });
				setCurrentWarehouse({ warehouseCen: "WAR-000003", name: "Dev Warehouse", isActive: true });
			} else {
				router.replace("/auth/select-business");
			}
		}
	}, [router, accessToken, setUserToken, setUserInfo, setCurrentBusiness, setCurrentWarehouse]);

	useEffect(() => {
		check();
	}, [check]);

	return <>{children}</>;
}
