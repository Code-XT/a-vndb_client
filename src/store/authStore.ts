import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthInfo } from '../types';

interface AuthState {
  token: string | null;
  user: AuthInfo | null;
  setAuth: (token: string, user: AuthInfo) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'vndb-auth' }
  )
);
