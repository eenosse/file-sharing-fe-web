import { authClient, adminClient } from "./client";

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
  role?: string; // Why allow users to register with role?
};

export type User = {
  id: string;
  username: string;
  email: string;
};

export type TOTPSetup = {
  secret: string;
  qrCode: string;
};

export type LoginSuccessResponse = {
  accessToken: string;
  user: User;
};

export type RegisterSuccessResponse = {
  message: string;
  userId: string;
  totpSetup?: TOTPSetup;
};

export type TOTPRequiredResponse = {
  requireTOTP: boolean;
  message?: string;
};

export type LoginResponse = LoginSuccessResponse | TOTPRequiredResponse;

export interface TotpSetupResponse {
  message: string;
  totpSetup: TOTPSetup;
}

export interface TotpVerifyRequest {
  code: string;
}

export interface TotpVerifyResponse {
  message: string;
  totpEnabled: boolean;
}

export interface TotpLoginRequest {
  email: string;
  code: string;
}

export const authApi = {
  login: (payload: LoginRequest) =>
    authClient.post<LoginResponse>("/auth/login", payload),
  register: (payload: RegisterRequest) =>
    authClient.post<RegisterSuccessResponse>("/auth/register", payload),
  setupTotp: () => adminClient.post<TotpSetupResponse>("/auth/totp/setup", {}),
  verifyTotp: (payload: TotpVerifyRequest) =>
    adminClient.post<TotpVerifyResponse>("/auth/totp/verify", payload),
  loginTotp: (payload: TotpLoginRequest) =>
    authClient.post<LoginSuccessResponse>("/auth/login/totp", payload),
};