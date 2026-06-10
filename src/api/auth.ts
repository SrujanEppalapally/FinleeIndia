import apiClient, { setToken } from './client';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
  setToken(data.token);
  return data;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
  setToken(data.token);
  return data;
}

export async function forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
  await apiClient.post('/auth/forgot-password', payload);
}

export async function verifyOtp(payload: VerifyOtpPayload): Promise<void> {
  await apiClient.post('/auth/verify-otp', payload);
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  await apiClient.post('/auth/reset-password', payload);
}

export function logout(): void {
  setToken(null);
  window.location.href = '/login';
}
