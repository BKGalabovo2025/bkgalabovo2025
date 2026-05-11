import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  // Sidebar
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Global UI
  activeBranch: string;
  setActiveBranch: (branch: string) => void;

  // Search/Filter persistence (Optional)
  memberSearchQuery: string;
  setMemberSearchQuery: (query: string) => void;

  // Inventory/Sales sync state
  lastSaleTimestamp: number | null;
  triggerSaleUpdate: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Sidebar
      isSidebarOpen: true,
      toggleSidebar: () =>
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),

      // Global UI
      activeBranch: "bkgalabovo", // Default
      setActiveBranch: (branch) => set({ activeBranch: branch }),

      // Search/Filter
      memberSearchQuery: "",
      setMemberSearchQuery: (query) => set({ memberSearchQuery: query }),

      // Sync
      lastSaleTimestamp: null,
      triggerSaleUpdate: () => set({ lastSaleTimestamp: Date.now() }),
    }),
    {
      name: "bkg-app-storage", // Key in localStorage
      partialize: (state) => ({
        activeBranch: state.activeBranch,
        isSidebarOpen: state.isSidebarOpen,
      }), // Only persist these
    }
  )
);
