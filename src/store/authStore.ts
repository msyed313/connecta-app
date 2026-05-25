import { create } from 'zustand';

interface User {
  userId   : string;
  userName : string;
  email    : string;
}

interface AuthStore {
  user         : User | null;
  accessToken  : string | null;
  refreshToken : string | null;
  setAuth      : (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth    : () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user         : null,
  accessToken  : localStorage.getItem('accessToken'),
  refreshToken : localStorage.getItem('refreshToken'),

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('accessToken',  accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ user, accessToken, refreshToken });
  },

  clearAuth: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, accessToken: null, refreshToken: null });
  },
}));