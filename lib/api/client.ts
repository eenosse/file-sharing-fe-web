import axios, { AxiosError } from "axios";
import { toast } from "sonner";

const ACCESS_TOKEN_KEY = "fs_access_token";
const USER_KEY = "fs_user";

/**
 * Helpers: localStorage-safe (avoid SSR crash)
 */
function safeGetItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
}

function safeSetItem(key: string, value: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, value);
}

function safeRemoveItem(key: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}

/**
 * Auth storage helpers
 */
export function getAccessToken(): string | null {
  return safeGetItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string) {
  safeSetItem(ACCESS_TOKEN_KEY, token);
}

export function clearAuth() {
  safeRemoveItem(ACCESS_TOKEN_KEY);
  safeRemoveItem(USER_KEY);
}

export function getCurrentUser<T = any>(): T | null {
  const raw = safeGetItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: any) {
  safeSetItem(USER_KEY, JSON.stringify(user));
}

export function _isLoggedIn(): boolean {
  return true;
//   return !!getAccessToken();
}

export function _isAdmin(): boolean {
  return true;
//   const user = getCurrentUser<{ role?: string }>();
//   return user?.role === "admin";
}


const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api",
  timeout: 15000,
});

function isFormData(value: unknown): value is FormData {
  if (typeof FormData === "undefined" || !value) {
    return false;
  }

  return value instanceof FormData;
}

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    // Bỏ qua token cho một số endpoint auth nếu muốn
    const isAuthEndpoint =
      config.url?.startsWith("/auth/login") ||
      config.url?.startsWith("/auth/register") ||
      config.url?.startsWith("/auth/login/totp") ||
      config.url?.startsWith("/auth/totp");

    if (token && !isAuthEndpoint) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    // Đảm bảo Content-Type nếu là JSON
    const shouldSetJsonContentType =
      !config.headers?.["Content-Type"] &&
      config.data &&
      typeof config.data === "object" &&
      !isFormData(config.data);

    if (shouldSetJsonContentType) {
      config.headers = {
        ...config.headers,
        "Content-Type": "application/json",
      };
    }

    return config;
  },
  (error) => Promise.reject(error)
);

function redirectToLoginWithToast() {
  if (typeof window === "undefined") return;

  // Tránh toast spam nếu đang ở trang login
  if (!window.location.pathname.startsWith("/auth/login")) {
    toast.error("Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.");
  }

  const currentPath = window.location.pathname + window.location.search;
  const searchParams = new URLSearchParams({
    redirectTo: currentPath,
  });

  if (!window.location.pathname.startsWith("/auth/login")) {
    window.location.href = `/auth/login?${searchParams.toString()}`;
  }
}

api.interceptors.response.use(
  (response) => {
    // Mặc định trả về body JSON
    return response.data;
  },
  (error: AxiosError<any>) => {
    // Lỗi có response từ server
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;

      if (status === 401) {
        // Token hết hạn / không hợp lệ
        clearAuth();
        redirectToLoginWithToast();
      } else if (status === 403) {
        const message =
          data?.message || "Bạn không có quyền truy cập endpoint này.";
        toast.error(message);
      } else if (status >= 500) {
        toast.error("Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.");
      }
      // Với 400 / 422 / ...: để UI tự xử lý, không toast global để tránh trùng
    } else {
      // Không có response: lỗi mạng / backend sập
      console.error("Network or CORS error", error);
      toast.error(
        "Không thể kết nối đến server. Vui lòng kiểm tra lại backend hoặc kết nối mạng."
      );
    }

    // Cho UI xử lý tiếp (vd: catch ở component để show lỗi chi tiết)
    return Promise.reject(error);
  }
);

export default api;
