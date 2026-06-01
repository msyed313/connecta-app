import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://localhost:7283/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const url  = error.config?.url ?? '';
    const status = error.response?.status;

    // These endpoints are allowed to return 401 — do NOT redirect
    const isAuthEndpoint =
      url.includes('/auth/login')            ||
      url.includes('/auth/register')         ||
      url.includes('/auth/verify-otp')       ||
      url.includes('/auth/forgot-password')  ||
      url.includes('/auth/verify-reset-otp') ||
      url.includes('/auth/reset-password');

    // Only redirect if 401 comes from a protected endpoint (not auth)
    if (status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }

    // Always reject so catch block in component receives the error
    return Promise.reject(error);
  }
);

export default axiosInstance;