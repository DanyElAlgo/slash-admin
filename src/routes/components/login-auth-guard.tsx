import { useCallback, useEffect } from "react";
import { useUserActions, useUserToken } from "@/store/userStore";
import { useRouter } from "../hooks";

type Props = {
	children: React.ReactNode;
};
export default function LoginAuthGuard({ children }: Props) {
	const router = useRouter();
	const { accessToken } = useUserToken();
	const { setUserToken, setUserInfo, setCurrentBusiness } = useUserActions();

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
				setCurrentBusiness({ id: 1, name: "Dev Business" });
			} else {
				router.replace("/auth/select-business");
			}
		}
	}, [router, accessToken, setUserToken, setUserInfo, setCurrentBusiness]);

	useEffect(() => {
		check();
	}, [check]);

	return <>{children}</>;
}
