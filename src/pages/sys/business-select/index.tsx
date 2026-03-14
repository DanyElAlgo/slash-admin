import { Building2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import businessService from "@/api/services/businessService";
import LocalePicker from "@/components/locale-picker";
import Logo from "@/components/logo";
import { GLOBAL_CONFIG } from "@/global-config";
import SettingButton from "@/layouts/components/setting-button";
import { useUserActions } from "@/store/userStore";
import type { Business } from "@/types/entity";
import { Card } from "@/ui/card";

export default function BusinessSelectPage() {
	const navigate = useNavigate();
	const { setCurrentBusiness, setUserToken, setUserInfo } = useUserActions();
	const [businesses, setBusinesses] = useState<Business[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadBusinesses = async () => {
			try {
				const data = await businessService.getBusinesses();
				setBusinesses(data);
			} catch {
				console.error("Failed to load businesses");
			} finally {
				setLoading(false);
			}
		};

		void loadBusinesses();
	}, []);

	const handleSelect = (business: Business) => {
		setCurrentBusiness(business);
		setUserToken({
			accessToken: `mock-token-biz-${business.id}`,
			refreshToken: `mock-refresh-biz-${business.id}`,
		});
		setUserInfo({
			id: `biz-${business.id}`,
			email: `admin@${business.name.toLowerCase().replace(/\s+/g, "")}.com`,
			username: business.name,
			roles: [{ id: "1", name: "admin", code: "admin" }],
			permissions: [],
		});
		navigate(GLOBAL_CONFIG.defaultRoute, { replace: true });
	};

	return (
		<div className="relative flex min-h-svh flex-col items-center justify-center bg-background p-6">
			<div className="flex flex-col items-center gap-2 mb-10">
				<Logo size={48} />
				<h1 className="text-3xl font-bold">{GLOBAL_CONFIG.appName}</h1>
				<p className="text-text-secondary text-sm">Select a company to continue</p>
			</div>

			{loading ? (
				<div className="flex items-center justify-center gap-2 text-text-secondary">
					<Loader2 className="h-5 w-5 animate-spin" />
					<span>Loading companies...</span>
				</div>
			) : businesses.length === 0 ? (
				<div className="text-center text-text-secondary">
					<p>No companies available.</p>
				</div>
			) : (
				<div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{businesses.map((biz) => (
						<Card
							key={biz.id}
							className="flex cursor-pointer flex-col items-center gap-3 p-8 transition-shadow hover:shadow-lg hover:ring-2 hover:ring-primary"
							onClick={() => handleSelect(biz)}
						>
							<div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
								<Building2 className="h-7 w-7" />
							</div>
							<span className="text-center text-lg font-semibold">{biz.name}</span>
						</Card>
					))}
				</div>
			)}

			<div className="absolute right-2 top-0 flex flex-row">
				<LocalePicker />
				<SettingButton />
			</div>
		</div>
	);
}
