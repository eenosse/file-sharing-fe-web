import { User } from "@/lib/api/auth";

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

export function getCurrentUser(): User | null {
    const raw = safeGetItem(USER_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as User;
    } catch {
        return null;
    }
}

export function setCurrentUser(user: User) {
    safeSetItem(USER_KEY, JSON.stringify(user));
}

export function _isLoggedIn(): boolean {
    // return true;
    return !!getAccessToken();
}

export function _isAdmin(): boolean {
    return true;
    //   const user = getCurrentUser();
    //   return user?.role === "admin";
}

export function isFormData(value: unknown): value is FormData {
    if (typeof FormData === "undefined" || !value) {
        return false;
    }

    return value instanceof FormData;
}