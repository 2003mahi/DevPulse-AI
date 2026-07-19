import { create } from 'zustand';

export interface User {
  name: string;
  email: string;
  githubUsername: string;
}

interface StoredAccount {
  name: string;
  email: string;
  password: string;
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
  // Auth helpers
  registerAccount: (account: StoredAccount) => { success: boolean; error?: string };
  loginWithCredentials: (email: string, password: string) => { success: boolean; error?: string };
}

const ACCOUNTS_KEY = 'devpulse_accounts';
const USER_KEY = 'devpulse_user';

function getAccounts(): StoredAccount[] {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveAccounts(accounts: StoredAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export const useAppStore = create<AppState>((set) => ({
  user: (() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    } catch {
      return null;
    }
  })(),
  sidebarOpen: false,

  login: (user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user });
  },

  logout: () => {
    localStorage.removeItem(USER_KEY);
    set({ user: null });
  },

  updateUser: (user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    // Also sync the accounts store so future logins reflect the updated profile
    const accounts = getAccounts();
    const idx = accounts.findIndex((a) => a.email === user.email);
    if (idx !== -1) {
      accounts[idx] = { ...accounts[idx], name: user.name, githubUsername: user.githubUsername };
      saveAccounts(accounts);
    }
    set({ user });
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  registerAccount: ({ name, email, password, githubUsername }) => {
    const accounts = getAccounts();
    if (accounts.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'An account with this email already exists.' };
    }
    const newAccount: StoredAccount = { name, email, password, githubUsername };
    saveAccounts([...accounts, newAccount]);
    // Log the user in immediately after registering
    const user: User = { name, email, githubUsername };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user });
    return { success: true };
  },

  loginWithCredentials: (email, password) => {
    const accounts = getAccounts();
    const account = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
    if (!account) {
      return { success: false, error: 'No account found with this email.' };
    }
    if (account.password !== password) {
      return { success: false, error: 'Incorrect password.' };
    }
    const user: User = { name: account.name, email: account.email, githubUsername: account.githubUsername };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user });
    return { success: true };
  },
}));
