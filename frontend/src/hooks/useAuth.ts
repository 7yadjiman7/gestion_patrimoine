import { useState } from 'react';
import { loginWithOdoo } from '../services/authService';
import type { User } from '../services/authService';

type UserRole = 'admin' | 'director' | 'agent';

interface AuthUser extends User {
  role: UserRole;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const savedUser = sessionStorage.getItem('odoo_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = async (username: string, password: string, onSuccess: () => void) => {
    setIsLoading(true);
    try {
      const userData = await loginWithOdoo(username, password);
      // Déterminer le rôle en fonction des groupes Odoo
      const role = userData.groups.includes('gestion_patrimoine.group_admin') ? 'admin' :
                   userData.groups.includes('gestion_patrimoine.group_director') ? 'director' : 'agent';
      
      const userWithRole: AuthUser = { ...userData, role };
      setUser(userWithRole);
      sessionStorage.setItem('odoo_user', JSON.stringify(userWithRole));
      onSuccess();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (onSuccess: () => void) => {
    setUser(null);
    sessionStorage.removeItem('odoo_user');
    onSuccess();
  };

  const hasRole = (role: UserRole) => {
    return user?.role === role;
  };

  return { user, isLoading, login, logout, hasRole };
};
