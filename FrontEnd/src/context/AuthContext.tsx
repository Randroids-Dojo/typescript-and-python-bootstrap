import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authClient, User, Session } from '@/lib/auth';

interface AuthContextProps {
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
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

  const checkSession = async () => {
    try {
      setIsLoading(true);
      const { session, status } = authClient.useSession();
      
      if (status === 'authenticated' && session) {
        // In a real implementation, you would make an API call to get the user profile
        setUser({
          id: session.userId,
          email: 'user@example.com', // This would come from the API
          name: 'Test User', // This would come from the API
          role: 'user' // This would come from the API
        });
        
        // Load sessions
        await refreshSessions();
      } else {
        setUser(null);
        setSessions([]);
      }
    } catch (err) {
      console.error('Error checking session:', err);
      setError('Failed to authenticate');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await authClient.signIn.email({
        email,
        password,
        callbackURL: '/dashboard'
      });
      
      if (result.error) {
        setError(result.error);
        return false;
      }
      
      if (result.data) {
        setUser(result.data.user);
        await refreshSessions();
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to log in');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await authClient.signUp.email({
        email,
        password,
        name,
        callbackURL: '/dashboard'
      });
      
      if (result.error) {
        setError(result.error);
        return false;
      }
      
      if (result.data) {
        setUser(result.data.user);
        await refreshSessions();
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Registration error:', err);
      setError('Failed to register');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await authClient.signOut();
      setUser(null);
      setSessions([]);
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to log out');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSessions = async (): Promise<void> => {
    try {
      const sessionList = await authClient.getSessions();
      setSessions(sessionList);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    }
  };

  const revokeSession = async (sessionId: string): Promise<boolean> => {
    try {
      const success = await authClient.revokeSession(sessionId);
      if (success) {
        await refreshSessions();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error revoking session:', err);
      return false;
    }
  };

  const contextValue: AuthContextProps = {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login,
    register,
    logout,
    sessions,
    revokeSession,
    refreshSessions
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};