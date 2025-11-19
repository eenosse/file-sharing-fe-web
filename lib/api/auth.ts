import api from "./client";

export type LoginRequest = {
  email: string;
  password: string;
};

export type User = {
  id: string;
  username: string;
  email: string;
  role?: string;
  totpEnabled: boolean;
};

export type LoginSuccessResponse = {
  accessToken: string;
  user: User;
};

export type TOTPRequiredResponse = {
  requireTOTP: true;
  message?: string;
};

export type LoginResponse = LoginSuccessResponse | TOTPRequiredResponse;

export const authApi = {
  login: (payload: LoginRequest) =>
    api.post<LoginResponse>("/auth/login", payload),
};
