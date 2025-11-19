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

export type TOPTSetup = {
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
  toptSetup?: TOPTSetup;
};

export type TOTPRequiredResponse = {
  requireTOTP: boolean;
  message?: string;
};

export type LoginResponse = LoginSuccessResponse | TOTPRequiredResponse;

export interface TotpSetupResponse {
  message: string;
  toptSetup: TOPTSetup;
}

export interface TotpVerifyRequest {
  code: string;
}

export interface TotpVerifyResponse {
  message: string;
  toptEnabled: boolean;
}

export const authApi = {
  login: (payload: LoginRequest) =>
    authClient.post<LoginResponse>("/auth/login", payload),
  register: (payload: RegisterRequest) =>
    authClient.post<RegisterSuccessResponse>("/auth/register", payload),
  setupTotp: () => adminClient.post<TotpSetupResponse>("/auth/totp/setup", {}),
  verifyTotp: (payload: TotpVerifyRequest) =>
    adminClient.post<TotpVerifyResponse>("/auth/totp/verify", payload),
};