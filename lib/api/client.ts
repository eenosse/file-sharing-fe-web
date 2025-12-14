import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosInstance,
  AxiosRequestConfig,
} from "axios";
import { toast } from "sonner";
import { getAccessToken, clearAuth } from "@/lib/api/helper";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";
const DEFAULT_TIMEOUT = 15000; // 15s for normal requests
const UPLOAD_TIMEOUT = 10 * 60 * 1000; // 10 Minutes for large files [cite: 361, 373]

interface ErrorResponse {
  message: string;
}

interface ApiClient extends AxiosInstance {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
}

// 1. Token Injector (Used by Admin & Upload clients)
const attachTokenInterceptor = (config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
};

const unauthErrorResponseInterceptor = (error: AxiosError<ErrorResponse>) => {
  if (error.response) {
    const { status, data } = error.response;

    if (status >= 500) {
      toast.error("System error. Please try again later.");
    }
  } else {
    toast.error("Network error. Please check your connection.");
  }
  return Promise.reject(error);
};

// 2. Global Error Handler (Used by all authed clients)
const errorResponseInterceptor = (error: AxiosError<ErrorResponse>) => {
  if (error.response) {
    const { status, data } = error.response;

    if (status === 401) {
      // Token expired handling
      clearAuth();
      toast.error("Session expired. Please login again.");
      window.location.href = "/login";
    } else if (status === 403) {
      toast.error(data?.message || "Access denied.");
    } else if (status === 413) {
      toast.error("File is too large.");
    } else if (status >= 500) {
      toast.error("System error. Please try again later.");
    }
  } else {
    toast.error("Network error. Please check your connection.");
  }
  return Promise.reject(error);
};

// 3. Data Unwrap (Optional, purely preference)
const responseDataInterceptor = (response: AxiosResponse) => response.data;

// --- Client Definitions ---

/**
 * 1. Auth Client
 * - No Authorization Token retrieval
 * - Standard JSON handling
 * - Standard Timeout
 * - Use for: /auth/login, /auth/register 
 */
const authClient: ApiClient = axios.create({
  baseURL: BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});
// Only attach response interceptor (no token needed on request)
authClient.interceptors.response.use(responseDataInterceptor, unauthErrorResponseInterceptor);

/**
 * 2. Admin Client
 * - REQUIRES Authorization Token
 * - Enforces JSON Content-Type
 * - Standard Timeout
 * - Use for: /api/admin/*, /api/auth/totp/setup (endpoints needing token but just JSON) [cite: 96, 356]
 */
const adminClient: ApiClient = axios.create({
  baseURL: BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});
adminClient.interceptors.request.use(attachTokenInterceptor, Promise.reject);
adminClient.interceptors.response.use(responseDataInterceptor, errorResponseInterceptor);


/**
 * 3. Upload Client
 * - REQUIRES Authorization Token
 * - Enforces Multipart/Form-Data
 * - LONG Timeout (for 50MB-100MB files) 
 * - Use for: /api/files/upload [cite: 126]
 */
const uploadClient: ApiClient = axios.create({
  baseURL: BASE_URL,
  timeout: UPLOAD_TIMEOUT,
  headers: {
    // Explicitly set multipart (though Axios can detect FormData, this ensures safety)
    "Content-Type": "multipart/form-data",
  },
});
uploadClient.interceptors.request.use(attachTokenInterceptor, Promise.reject);
uploadClient.interceptors.response.use(responseDataInterceptor, errorResponseInterceptor);

export {
  authClient,
  adminClient,
  uploadClient,
};