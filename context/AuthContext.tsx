import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { endpoints, apiFetch } from '../constants/api';

export interface User {
  username: string;
  email?: string;
  profilePicture?: string;
  role?: string;
  teamId?: number;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY_TOKEN = '@teamly_token';
const STORAGE_KEY_USER = '@teamly_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'ADMIN' || (user?.username || '').includes('admin');

  // Hydrate session on mount
  useEffect(() => {
    async function loadSession() {
      try {
        const storedToken = await AsyncStorage.getItem(STORAGE_KEY_TOKEN);
        const storedUser = await AsyncStorage.getItem(STORAGE_KEY_USER);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error('Failed to load session', e);
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, []);

  const login = async (newToken: string, newUser: User) => {
    try {
      setToken(newToken);
      setUser(newUser);
      await AsyncStorage.setItem(STORAGE_KEY_TOKEN, newToken);
      await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
    } catch (e) {
      console.error('Failed to save session', e);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        try {
          await apiFetch(endpoints.signout, { method: 'POST' }, token);
        } catch (_) {}
      }
      setToken(null);
      setUser(null);
      await AsyncStorage.removeItem(STORAGE_KEY_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEY_USER);
    } catch (e) {
      console.error('Failed to clear session', e);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    try {
      const newUser = user ? { ...user, ...updates } : null;
      setUser(newUser);
      if (newUser) {
        await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
      }
    } catch (e) {
      console.error('Failed to update persisted user', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        logout,
        updateUser,
        isAuthenticated: !!token,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
