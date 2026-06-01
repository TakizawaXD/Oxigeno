import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  darkMode: boolean;
  currentModule: string;
  language: 'es' | 'en';
  businessType: 'medical_oxygen' | 'bakery' | 'retail' | 'services' | 'general';

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setDarkMode: (dark: boolean) => void;
  setCurrentModule: (module: string) => void;
  setLanguage: (lang: 'es' | 'en') => void;
  setBusinessType: (type: 'medical_oxygen' | 'bakery' | 'retail' | 'services' | 'general') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      sidebarCollapsed: false,
      darkMode: false,
      currentModule: 'dashboard',
      language: 'es',
      businessType: 'medical_oxygen',

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setDarkMode: (dark) => {
        if (dark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        set({ darkMode: dark });
      },
      setCurrentModule: (module) => set({ currentModule: module }),
      setLanguage: (lang) => set({ language: lang }),
      setBusinessType: (type) => set({ businessType: type }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        darkMode: state.darkMode,
        language: state.language,
        businessType: state.businessType,
      }),
    }
  )
);

// Initialize dark mode on load
const stored = localStorage.getItem('ui-storage');
if (stored) {
  try {
    const parsed = JSON.parse(stored);
    if (parsed.state?.darkMode) {
      document.documentElement.classList.add('dark');
    }
  } catch {
    // Ignore
  }
}
