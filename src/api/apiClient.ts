import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from "axios";
import { toast } from "sonner";
import type { Result } from "#/api";
import { ResultStatus } from "#/enum";
import { GLOBAL_CONFIG } from "@/global-config";
import { t } from "@/locales/i18n";
import userStore from "@/store/userStore";

function createAxiosInstance(baseURL: string): AxiosInstance {
	const instance = axios.create({
		baseURL,
		timeout: 50000,
		headers: { "Content-Type": "application/json;charset=utf-8" },
	});

	instance.interceptors.request.use(
		(config) => {
			config.headers.Authorization = "Bearer Token";
			return config;
		},
		(error) => Promise.reject(error),
	);

	instance.interceptors.response.use(
		(res: AxiosResponse<Result<any> | unknown>) => {
			if (!res.data) {
				if (res.status >= 200 && res.status < 300) return;
				throw new Error(t("sys.api.apiRequestFailed"));
			}

			if (typeof res.data === "object" && res.data !== null && "status" in res.data && "data" in res.data) {
				const { status, data, message } = res.data as Result<any>;
				if (status === ResultStatus.SUCCESS) {
					return data;
				}
				throw new Error(message || t("sys.api.apiRequestFailed"));
			}

			return res.data;
		},
		(error: AxiosError<Result>) => {
			const { response, message } = error || {};
			const errMsg = response?.data?.message || message || t("sys.api.errorMessage");
			toast.error(errMsg, { position: "top-center" });
			if (response?.status === 401) {
				userStore.getState().actions.clearUserInfoAndToken();
			}
			return Promise.reject(error);
		},
	);

	return instance;
}

class APIClient {
	constructor(private readonly axiosInstance: AxiosInstance) {}

	get<T = unknown>(config: AxiosRequestConfig): Promise<T> {
		return this.request<T>({ ...config, method: "GET" });
	}
	post<T = unknown>(config: AxiosRequestConfig): Promise<T> {
		return this.request<T>({ ...config, method: "POST" });
	}
	put<T = unknown>(config: AxiosRequestConfig): Promise<T> {
		return this.request<T>({ ...config, method: "PUT" });
	}
	patch<T = unknown>(config: AxiosRequestConfig): Promise<T> {
		return this.request<T>({ ...config, method: "PATCH" });
	}
	delete<T = unknown>(config: AxiosRequestConfig): Promise<T> {
		return this.request<T>({ ...config, method: "DELETE" });
	}
	request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
		return this.axiosInstance.request<any, T>(config);
	}
}

export const inventoryApiClient = new APIClient(createAxiosInstance(GLOBAL_CONFIG.inventoryApiUrl));
export const salesApiClient = new APIClient(createAxiosInstance(GLOBAL_CONFIG.salesApiUrl));

export default new APIClient(createAxiosInstance(GLOBAL_CONFIG.apiBaseUrl));
