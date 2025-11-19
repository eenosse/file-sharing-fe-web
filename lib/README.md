# Shared axios interceptor
Mục đích: đồng nhất việc request xuống backend, thay vì định nghĩa tạo request trên page.

## client.ts

### Helper với localStorage

```
function safeGetItem(key: string): string | null;
function safeSetItem(key: string, value: string): void;
function safeRemoveItem(key: string): void;
```

Local storage này sẽ lưu ở client side, nạp lên rút xuống có nghĩa là server đang kêu client tự đưa, đổi.

### Auth storage

Dùng để đựng đống token server giao. Xài chung hết cho dễ.

```
export function getAccessToken(): string | null;
export function setAccessToken(token: string): void;
export function clearAuth(): void;

export function getCurrentUser<T = any>(): T | null;
export function setCurrentUser(user: any): void;

// currently return true, change to debug
export function _isLoggedIn(): boolean;
export function _isAdmin(): boolean;
```

### Axios instance

Dùng làm người giao tiếp với backend cho front end. Hạn chế bloat code page bằng implement fetch ở thư mục /lib/api (có ví dụ ở admin.ts)

```
export const adminApi = {
  getPolicy(): Promise<SystemPolicy> {
    return api.get<SystemPolicy>("/admin/policy");
  },

  updatePolicy(payload: SystemPolicyUpdate): Promise<UpdatePolicyResponse> {
    return api.patch<UpdatePolicyResponse>("/admin/policy", payload);
  },

  cleanupExpiredFiles(): Promise<CleanupResponse> {
    return api.post<CleanupResponse>("/admin/cleanup");
  },
};
```

Thống nhất đống cách thức request xuống backend server `const res = await adminApi.cleanupExpiredFiles();`