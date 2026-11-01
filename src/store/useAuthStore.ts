import { create } from 'zustand';
import { User, UserStatus } from '../types';
import { apiRequest, setAuthToken, getAuthToken } from '../api/client';
import { updateSocketAuth } from '../lib/socket';
import { voiceManager } from '../lib/webrtc';

interface AudioSettings {
  inputDeviceId: string;
  outputDeviceId: string;
  inputVolume: number;
  outputVolume: number;
  echoCancellation: boolean;
  noiseSuppression: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSettingsOpen: boolean;
  audioSettings: AudioSettings;

  // Actions
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  setStatus: (status: UserStatus, customStatus?: string) => Promise<void>;
  updateAudioSettings: (settings: Partial<AudioSettings>) => void;
  openSettings: () => void;
  closeSettings: () => void;
}

const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  inputDeviceId: 'default',
  outputDeviceId: 'default',
  inputVolume: 100,
  outputVolume: 100,
  echoCancellation: true,
  noiseSuppression: true,
};

function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('accord_user');
    if (!raw || raw === 'null' || raw === 'undefined') return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setStoredUser(user: User | null) {
  try {
    if (user) {
      localStorage.setItem('accord_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('accord_user');
    }
  } catch {}
}

const initialUser = getStoredUser();
const initialToken = getAuthToken();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialUser,
  token: initialToken,
  isAuthenticated: Boolean(initialUser && initialToken),
  isLoading: !initialUser && Boolean(initialToken),
  isSettingsOpen: false,
  audioSettings: {
    ...DEFAULT_AUDIO_SETTINGS,
    ...(JSON.parse(localStorage.getItem('accord_audio_settings') || '{}')),
  },

  login: async (emailOrUsername, password) => {
    const res = await apiRequest<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ emailOrUsername, password }),
    });

    setAuthToken(res.token);
    setStoredUser(res.user);
    updateSocketAuth(res.token);
    set({ user: res.user, token: res.token, isAuthenticated: true, isLoading: false });
  },

  register: async (username, email, password, displayName) => {
    const res = await apiRequest<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, displayName }),
    });

    setAuthToken(res.token);
    setStoredUser(res.user);
    updateSocketAuth(res.token);
    set({ user: res.user, token: res.token, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    setAuthToken(null);
    setStoredUser(null);
    updateSocketAuth(null);
    set({ user: null, token: null, isAuthenticated: false, isSettingsOpen: false, isLoading: false });
  },

  checkAuth: async () => {
    const token = getAuthToken();
    if (!token) {
      // If no token, check if we have demo or default login
      try {
        const res = await apiRequest<{ token: string; user: User }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ emailOrUsername: 'alex', password: 'password123' }),
        });
        setAuthToken(res.token);
        setStoredUser(res.user);
        updateSocketAuth(res.token);
        set({ user: res.user, token: res.token, isAuthenticated: true, isLoading: false });
        return;
      } catch {
        setStoredUser(null);
        set({ user: null, token: null, isLoading: false, isAuthenticated: false });
        return;
      }
    }

    try {
      const res = await apiRequest<{ user: User }>('/auth/me');
      updateSocketAuth(token);
      setStoredUser(res.user);
      set({ user: res.user, token, isAuthenticated: true, isLoading: false });
    } catch {
      try {
        const res = await apiRequest<{ token: string; user: User }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ emailOrUsername: 'alex', password: 'password123' }),
        });
        setAuthToken(res.token);
        setStoredUser(res.user);
        updateSocketAuth(res.token);
        set({ user: res.user, token: res.token, isAuthenticated: true, isLoading: false });
      } catch {
        setAuthToken(null);
        setStoredUser(null);
        updateSocketAuth(null);
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    }
  },

  updateProfile: async (data) => {
    const res = await apiRequest<{ user: User }>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    setStoredUser(res.user);
    set({ user: res.user });
  },

  changePassword: async (currentPassword, newPassword) => {
    await apiRequest('/auth/password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  setStatus: async (status, customStatus) => {
    const res = await apiRequest<{ user: User }>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify({ status, customStatus }),
    });
    setStoredUser(res.user);
    set({ user: res.user });
  },

  updateAudioSettings: (newSettings) => {
    const updated = { ...get().audioSettings, ...newSettings };
    localStorage.setItem('accord_audio_settings', JSON.stringify(updated));
    set({ audioSettings: updated });

    if (newSettings.inputDeviceId !== undefined || newSettings.echoCancellation !== undefined || newSettings.noiseSuppression !== undefined) {
      voiceManager.switchInputDevice(
        updated.inputDeviceId,
        updated.echoCancellation,
        updated.noiseSuppression
      );
    }
    if (newSettings.outputDeviceId !== undefined) {
      voiceManager.switchOutputDevice(updated.outputDeviceId);
    }
  },

  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
}));
