import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'device' | 'light' | 'dark';

interface SettingsState {
  showNSFW: boolean;
  theme: Theme;
  toggleNSFW: () => void;
  setTheme: (t: Theme) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      showNSFW: false,
      theme: 'device',
      toggleNSFW: () => set((state) => ({ showNSFW: !state.showNSFW })),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'vndb-settings' }
  )
);