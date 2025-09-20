import React, { createContext, useContext, useEffect, useState } from 'react';
import Constants from 'expo-constants';
import type { Role, UserProfile } from '../types/models';

interface AuthContextValue {
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setRole: (role: Role) => void; // demo helper
}

const AuthContext = createContext<AuthContextValue>({} as any);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const extra = (Constants.expoConfig?.extra || {}) as any;
  const demoMode = !!extra?.demoMode;
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (demoMode) {
      setUser({
        id: 'u_demo',
        name: 'Luciano (Demo)',
        email: 'demo@kidspot.app',
        role: 'admin',
        city: 'São Paulo',
      });
    }
  }, [demoMode]);

  const login = async (email: string, password: string) => {
    if (demoMode) {
      setUser({ id: 'u_demo', name: 'Luciano (Demo)', email, role: 'admin', city: 'São Paulo' });
      return;
    }
    // TODO: implement with Firebase Auth
    throw new Error('Auth requires Firebase config. Enable demo mode or provide keys.');
  };

  const register = async (name: string, email: string, password: string) => {
    if (demoMode) {
      setUser({ id: 'u_demo', name, email, role: 'user', city: 'São Paulo' });
      return;
    }
    // TODO: implement with Firebase Auth
    throw new Error('Register requires Firebase config. Enable demo mode or provide keys.');
  };

  const logout = async () => {
    setUser(null);
  };

  const setRole = (role: Role) => {
    if (!user) return;
    setUser({ ...user, role });
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, setRole }}>
      {children}
    </AuthContext.Provider>
  );
};
