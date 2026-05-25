import axiosInstance from './axiosInstance';
import type { RegisterRequest, VerifyOtpRequest, LoginRequest, AuthResponse } from '../types/auth.types';

export const authApi = {

  register: async (data: RegisterRequest) => {
    const res = await axiosInstance.post('/auth/register', data);
    return res.data;
  },

  verifyOtp: async (data: VerifyOtpRequest): Promise<{ message: string; data: AuthResponse }> => {
    const res = await axiosInstance.post('/auth/verify-otp', data);
    return res.data;
  },

  login: async (data: LoginRequest): Promise<{ message: string; data: AuthResponse }> => {
    const res = await axiosInstance.post('/auth/login', data);
    return res.data;
  },

  forgotPassword: async (email: string) => {
    const res = await axiosInstance.post('/auth/forgot-password', { email });
    return res.data;
  },

  verifyResetOtp: async (email: string, otpCode: string) => {
    const res = await axiosInstance.post('/auth/verify-reset-otp', { email, otpCode });
    return res.data;
  },

  resetPassword: async (email: string, otpCode: string, newPassword: string) => {
    const res = await axiosInstance.post('/auth/reset-password', { email, otpCode, newPassword });
    return res.data;
  },

  logout: async (refreshToken: string) => {
    const res = await axiosInstance.post('/auth/logout', { refreshToken });
    return res.data;
  },

  getMe: async () => {
    const res = await axiosInstance.get('/auth/me');
    return res.data;
  },
};