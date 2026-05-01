import { create } from 'zustand';
import type { User, LoginCredentials, RegisterData } from '../types';
import { userService } from '../firebase';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<User | null>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
  initAuth: () => () => void;

  // Computed
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
  isOwner: () => boolean;
}


export const useAuthStore = create<AuthState>()(
  (set, get) => ({
    user: null,
    isLoading: false,
    error: null,
    isInitialized: false,

    login: async (credentials) => {
      set({ isLoading: true, error: null });
      try {
        const user = await userService.login(credentials);
        set({ user, isLoading: false });
        return true;
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'حدث خطأ أثناء تسجيل الدخول';
        set({ isLoading: false, error: msg });
        return false;
      }
    },

    register: async (data) => {
      set({ isLoading: true, error: null });
      try {
        if (data.password !== data.confirmPassword) {
          throw new Error('كلمتا المرور غير متطابقتين');
        }
        const user = await userService.register(data);
        set({ user, isLoading: false });
        return user;
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'حدث خطأ أثناء إنشاء الحساب';
        set({ isLoading: false, error: msg });
        return null;
      }
    },

    logout: async () => {
      try {
        await userService.logout();
        set({ user: null, error: null });
      } catch (error) {
        console.error('Logout error:', error);
      }
    },

    updateUser: async (data) => {
      const currentUser = get().user;
      if (!currentUser) return;
      // This requires an update profile method in userService. We will mock it here or implement it.
      // For now, update local state
      set({ user: { ...currentUser, ...data } });
    },

    clearError: () => set({ error: null }),

    setUser: (user) => set({ user }),

    initAuth: () => {
      return userService.onAuthChange((user) => {
        set({ user, isInitialized: true });
      });
    },

    isAuthenticated: () => !!get().user,
    isAdmin: () => get().user?.role === 'admin' || get().user?.role === 'owner',
    isOwner: () => get().user?.role === 'owner',
  })
);

