import { Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";
import { useRouter } from "@/routes/hooks";
import { useCurrentBusiness, useUserActions, useUserInfo } from "@/store/userStore";
import { Button } from "@/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/ui/dropdown-menu";

export default function AccountDropdown() {
	const { replace } = useRouter();
	const { username, email, avatar } = useUserInfo();
	const business = useCurrentBusiness();
	const { clearUserInfoAndToken } = useUserActions();
	const { t } = useTranslation();

	const logout = () => {
		try {
			clearUserInfoAndToken();
		} catch (error) {
			console.log(error);
		} finally {
			replace("/auth/select-business");
		}
	};

	const switchBusiness = () => {
		clearUserInfoAndToken();
		replace("/auth/select-business");
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="rounded-full">
					{avatar ? <img className="h-6 w-6 rounded-full" src={avatar} alt="" /> : <Building2 className="h-5 w-5" />}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56">
				<div className="flex items-center gap-2 p-2">
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
						<Building2 className="h-5 w-5" />
					</div>
					<div className="flex flex-col items-start">
						<div className="text-text-primary text-sm font-medium">{business?.name ?? username}</div>
						<div className="text-text-secondary text-xs">{email}</div>
					</div>
				</div>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<NavLink to="https://docs-admin.slashspaces.com/" target="_blank">
						{t("sys.docs")}
					</NavLink>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<NavLink to="/management/user/profile">{t("sys.nav.user.profile")}</NavLink>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<NavLink to="/management/user/account">{t("sys.nav.user.account")}</NavLink>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={switchBusiness}>
					<Building2 className="mr-2 h-4 w-4" />
					Switch Company
				</DropdownMenuItem>
				<DropdownMenuItem className="font-bold text-warning" onClick={logout}>
					{t("sys.login.logout")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
