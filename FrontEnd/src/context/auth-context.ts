import { createContext } from 'react';
import { User, Session } from '@/lib/auth';

export interface AuthContextProps {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  sessions: Session[];
  revokeSession: (sessionId: string) => Promise<boolean>;
  refreshSessions: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  updateUser: (userData: Partial<User>) => Promise<boolean>;
  validateToken: (token: string) => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);