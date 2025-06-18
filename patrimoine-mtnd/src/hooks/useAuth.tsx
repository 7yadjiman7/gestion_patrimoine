import React, { createContext, useContext, useState } from 'react';
import { login as apiLogin, logout as apiLogout } from '../auth/authService';

interface User {
  id: number;
  sessionId: string;
  username: string;
  is_admin?: boolean;
  role?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { uid, session_id, username, is_admin } = await apiLogin(email, password);
      setIsAuthenticated(true);
      setUser({ 
        id: uid, 
        sessionId: session_id, 
        username,
        is_admin,
        role: is_admin ? 'admin' : 'user' // Ajout d'un champ role déduit
      });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
      setIsAuthenticated(false);
      setUser(null);
      return true;
    } catch {
      return false;
    }
  };

  const contextValue = {
    isAuthenticated,
    user,
    login,
    logout,
    isLoading,
    error
  };

  return (
    <AuthContext.Provider value={contextValue}>
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
