import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
// --- BACKEND SWITCHING ---
// 1. For Browser Preview / Mock Mode: Keep using mockBackend
import { mockBackend as backend } from '../services/mockBackend';

// 2. For Real Node.js Backend: Uncomment the line below and comment out the mockBackend import
// import { api as backend } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<User>;
  register: (userData: Partial<User>) => Promise<User>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    // @ts-ignore - 'getCurrentUser' is specific to mockBackend, for real API we use tokens
    if (backend.getCurrentUser) {
       // @ts-ignore
       const currentUser = backend.getCurrentUser();
       if (currentUser) setUser(currentUser);
    } else {
       // For real API, you might validate token here
       const token = localStorage.getItem('token');
       if(token) {
         // Optionally fetch user profile from API if using real backend
       }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, role?: UserRole): Promise<User> => {
    setLoading(true);
    try {
      const user = await backend.login(email, password, role);
      setUser(user);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: Partial<User>): Promise<User> => {
    setLoading(true);
    try {
      const user = await backend.register(userData);
      setUser(user);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    backend.logout();
    setUser(null);
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    setLoading(true);
    try {
      // @ts-ignore - Handle difference between mock and real api signature if any
      const updatedUser = await backend.updateUser ? backend.updateUser(user.id, data) : backend.register({...user, ...data}); 
      // Note: Real API would have a specific update endpoint
      
      setUser(prev => prev ? { ...prev, ...data } : null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};