import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  profileSettings: {
    username: string;
    email: string;
    avatar?: string;
  };
  setProfileSettings: (settings: Partial<UserState['profileSettings']>) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profileSettings: {
        username: '',
        email: '',
      },
      setProfileSettings: (settings) =>
        set((state) => ({
          profileSettings: { ...state.profileSettings, ...settings },
        })),
      reset: () =>
        set({
          profileSettings: { username: '', email: '' },
        }),
    }),
    {
      name: 'user-storage',
    }
  )
);
