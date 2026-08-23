import { create } from 'zustand';
import { UserProfile, HealthConditionCode, DietaryPreferenceCode, AllergenRestrictionCode } from '@health-scanner/shared';
import { api } from '../services/api';
import { setLanguage, Language } from '../i18n';

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  userId: string | null;
  email: string | null;
  name: string | null;
  profile: UserProfile | null;
  language: Language;
  isLoading: boolean;
  error: string | null;

  // Actions
  checkSession: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  updateBasicProfile: (data: Partial<UserProfile>) => Promise<void>;
  updateHealthProfile: (data: any) => Promise<void>;
  acknowledgeDisclaimer: () => Promise<void>;
  setAppLanguage: (lang: Language) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  token: null,
  userId: null,
  email: null,
  name: null,
  profile: null,
  language: 'en',
  isLoading: false,
  error: null,

  checkSession: async () => {
    try {
      const profile = await api.getProfile();
      const lang = profile.languagePreference || 'en';
      setLanguage(lang);
      set({
        isAuthenticated: true,
        token: 'local_active_session',
        userId: profile.userId,
        email: profile.userId,
        name: profile.name,
        profile,
        language: lang,
      });
      return true;
    } catch {
      return false;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.login({ email, password });
      api.setToken(res.token);
      const lang = res.languagePreference || 'en';
      setLanguage(lang);
      set({
        isAuthenticated: true,
        token: res.token,
        userId: res.userId,
        email: res.email,
        name: res.name,
        language: lang,
        isLoading: false,
      });
      await get().fetchProfile();
      return true;
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Login failed' });
      return false;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.register({ name, email, password });
      api.setToken(res.token);
      set({
        isAuthenticated: true,
        token: res.token,
        userId: res.userId,
        email: res.email,
        name: res.name,
        isLoading: false,
      });
      await get().fetchProfile();
      return true;
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Registration failed' });
      return false;
    }
  },

  logout: () => {
    api.setToken(null);
    set({
      isAuthenticated: false,
      token: null,
      userId: null,
      email: null,
      name: null,
      profile: null,
      error: null,
    });
  },

  fetchProfile: async () => {
    try {
      const profile = await api.getProfile();
      const lang = profile.languagePreference || 'en';
      setLanguage(lang);
      set({ profile, language: lang });
    } catch (err: any) {
      console.warn('Failed to fetch profile', err);
    }
  },

  updateBasicProfile: async (data) => {
    set({ isLoading: true });
    try {
      const profile = await api.updateBasicProfile(data);
      if (data.languagePreference) {
        setLanguage(data.languagePreference);
        set({ language: data.languagePreference });
      }
      set({ profile, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  updateHealthProfile: async (data) => {
    set({ isLoading: true });
    try {
      const profile = await api.updateHealthProfile(data);
      set({ profile, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  acknowledgeDisclaimer: async () => {
    try {
      await api.acknowledgeDisclaimer();
      await get().fetchProfile();
    } catch (err: any) {
      console.error('Failed to acknowledge disclaimer', err);
    }
  },

  setAppLanguage: (lang: Language) => {
    setLanguage(lang);
    set({ language: lang });
    const profile = get().profile;
    if (profile) {
      get().updateBasicProfile({ languagePreference: lang }).catch(() => {});
    }
  },
}));
