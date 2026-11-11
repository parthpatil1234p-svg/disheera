import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getStoredToken, getStoredUser } from '../services/api';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role?: string;
  phone?: string;
  college?: string;
  branch?: string;
  graduationYear?: string;
  company?: string;
  designation?: string;
  verified?: boolean;
  avatarUrl?: string;
  enrolledTrack?: string;
  targetRole?: string;
  meritScore?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (emailOrToken: string, passwordOrUser?: any) => Promise<void> | void;
  register: (payload: any) => Promise<any>;
  verifyOtp: (email: string, otp: string) => Promise<any>;
  resendOtp: (email: string, viaWhatsApp?: boolean) => Promise<any>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = getStoredToken();
      const storedUser = getStoredUser();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
      }
    } catch (e) {
      console.error('Failed to parse stored auth user', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (emailOrToken: string, passwordOrUser?: any) => {
    if (passwordOrUser && typeof passwordOrUser === 'string') {
      const res = await api.post('/auth/login', {
        email: emailOrToken,
        password: passwordOrUser,
      });

      const authToken = res.data?.token || res.token;
      const authUser = res.data?.user || res.user;

      if (authToken) {
        localStorage.setItem('careerpath_token', authToken);
        localStorage.setItem('token', authToken);
      }
      if (authUser) {
        localStorage.setItem('careerpath_user', JSON.stringify(authUser));
        localStorage.setItem('user', JSON.stringify(authUser));
      }

      setToken(authToken || null);
      setUser(authUser || null);
    } else {
      const authToken = emailOrToken;
      const authUser = passwordOrUser || { id: 'user-1', name: 'User', email: 'user@example.com' };
      if (authToken) {
        localStorage.setItem('careerpath_token', authToken);
        localStorage.setItem('token', authToken);
      }
      if (authUser) {
        localStorage.setItem('careerpath_user', JSON.stringify(authUser));
        localStorage.setItem('user', JSON.stringify(authUser));
      }
      setToken(authToken);
      setUser(authUser);
    }
  };

  const register = async (payload: any) => {
    return await api.post('/auth/register', payload);
  };

  const verifyOtp = async (email: string, otp: string) => {
    const res = await api.post('/auth/verify-otp', { email, otp });
    const authToken = res.data?.token || res.token;
    const authUser = res.data?.user || res.user;
    if (authToken && authUser) {
      localStorage.setItem('careerpath_token', authToken);
      localStorage.setItem('token', authToken);
      localStorage.setItem('careerpath_user', JSON.stringify(authUser));
      localStorage.setItem('user', JSON.stringify(authUser));
      setToken(authToken);
      setUser(authUser);
    }
    return res;
  };

  const resendOtp = async (email: string, viaWhatsApp: boolean = false) => {
    return await api.post('/auth/resend-otp', { email, viaWhatsApp });
  };

  const logout = () => {
    localStorage.removeItem('careerpath_token');
    localStorage.removeItem('careerpath_user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('careerpath_token');
    sessionStorage.removeItem('careerpath_user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    localStorage.setItem('careerpath_user', JSON.stringify(updated));
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        verifyOtp,
        resendOtp,
        logout,
        updateUser,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
