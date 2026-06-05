import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { UserInfo, UserToken } from "#/entity";
import { StorageEnum } from "#/enum";
import userService, { type SignInReq } from "@/api/services/userService";
import type { Business, Warehouse } from "@/types/entity";

type UserStore = {
	userInfo: Partial<UserInfo>;
	userToken: UserToken;
	currentBusiness: Business | null;
	currentWarehouse: Warehouse | null;

	actions: {
		setUserInfo: (userInfo: UserInfo) => void;
		setUserToken: (token: UserToken) => void;
		setCurrentBusiness: (business: Business) => void;
		setCurrentWarehouse: (warehouse: Warehouse | null) => void;
		clearUserInfoAndToken: () => void;
	};
};

const useUserStore = create<UserStore>()(
	persist(
		(set) => ({
			userInfo: {},
			userToken: {},
			currentBusiness: null,
			currentWarehouse: null,
			actions: {
				setUserInfo: (userInfo) => {
					set({ userInfo });
				},
				setUserToken: (userToken) => {
					set({ userToken });
				},
				setCurrentBusiness: (business) => {
					// Switching company invalidates the selected warehouse: it belongs to the
					// previous company. Force a fresh pick for the new company.
					set({ currentBusiness: business, currentWarehouse: null });
				},
				setCurrentWarehouse: (warehouse) => {
					set({ currentWarehouse: warehouse });
				},
				clearUserInfoAndToken() {
					set({ userInfo: {}, userToken: {}, currentBusiness: null, currentWarehouse: null });
				},
			},
		}),
		{
			name: "userStore",
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({
				[StorageEnum.UserInfo]: state.userInfo,
				[StorageEnum.UserToken]: state.userToken,
				currentBusiness: state.currentBusiness,
				currentWarehouse: state.currentWarehouse,
			}),
		},
	),
);

export const useUserInfo = () => useUserStore((state) => state.userInfo);
export const useUserToken = () => useUserStore((state) => state.userToken);
export const useUserPermissions = () => useUserStore((state) => state.userInfo.permissions || []);
export const useUserRoles = () => useUserStore((state) => state.userInfo.roles || []);
export const useUserActions = () => useUserStore((state) => state.actions);
export const useCurrentBusiness = () => useUserStore((state) => state.currentBusiness);
export const useCurrentWarehouse = () => useUserStore((state) => state.currentWarehouse);

export const useSignIn = () => {
	const { setUserToken, setUserInfo } = useUserActions();

	const signInMutation = useMutation({
		mutationFn: userService.signin,
	});

	const signIn = async (data: SignInReq) => {
		try {
			const res = await signInMutation.mutateAsync(data);
			const { user, accessToken, refreshToken } = res;
			setUserToken({ accessToken, refreshToken });
			setUserInfo(user);
		} catch (err) {
			toast.error(err.message, {
				position: "top-center",
			});
			throw err;
		}
	};

	return signIn;
};

export default useUserStore;
