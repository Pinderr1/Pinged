import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from '../theme';

export interface ThemeSlice {
  darkMode: boolean;
  toggleTheme: () => void;
}

export interface LoadingSlice {
  loadingVisible: boolean;
  showLoading: () => void;
  hideLoading: () => void;
}

export interface HydrationSlice {
  hasHydrated: boolean;
}

export type AppState = ThemeSlice & LoadingSlice & HydrationSlice;

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      darkMode: false,
      toggleTheme: () => set((s) => ({ darkMode: !s.darkMode })),
      loadingVisible: false,
      showLoading: () => set({ loadingVisible: true }),
      hideLoading: () => set({ loadingVisible: false }),
      hasHydrated: false,
    }),
    {
      name: 'app-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ darkMode: state.darkMode }),
      onRehydrateStorage: () => () => {
        set({ hasHydrated: true });
      },
    }
  )
);

// selectors
export const selectDarkMode = (state: AppState) => state.darkMode;
export const selectTheme = (state: AppState) =>
  state.darkMode ? darkTheme : lightTheme;
export const selectToggleTheme = (state: AppState) => state.toggleTheme;
export const selectLoadingVisible = (state: AppState) => state.loadingVisible;
export const selectLoadingActions = (state: AppState) => ({
  show: state.showLoading,
  hide: state.hideLoading,
});
export const selectHydrated = (state: AppState) => state.hasHydrated;

