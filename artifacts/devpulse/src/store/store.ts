import { create } from 'zustand';

export interface User {
  name: string;
  email: string;
  githubUsername: string;
}

interface AppState {
  user: User | null;
  sidebarOpen: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: JSON.parse(localStorage.getItem('devpulse_user') || 'null'),
  sidebarOpen: false,
  login: (user) => {
    localStorage.setItem('devpulse_user', JSON.stringify(user));
    set({ user });
  },
  logout: () => {
    localStorage.removeItem('devpulse_user');
    set({ user: null });
  },
  updateUser: (user) => {
    localStorage.setItem('devpulse_user', JSON.stringify(user));
    set({ user });
  },
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));