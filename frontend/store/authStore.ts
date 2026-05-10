import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AniUser {
  id:          string;
  username:    string;
  email:       string;
  createdAt:   string;
  avatar:      string; // first letter of username
}

interface AuthState {
  user:  AniUser | null;
  token: string | null;
  // Actions
  logout: () => void;
  update: (username: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:  null,
      token: null,

      logout: () => {
        set({ user: null, token: null });
        localStorage.removeItem('aniverse-auth-v2');
      },

      update: (username) => {
        const { user } = get();
        if (!user) return;
        const updatedUser = { ...user, username: username.trim(), avatar: username[0].toUpperCase() };
        set({ user: updatedUser });
      },
    }),
    { name: 'aniverse-auth-v2' }
  )
);
