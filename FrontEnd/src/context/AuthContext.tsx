import { useEffect, useState, ReactNode } from 'react';
import { authClient, User, Session } from '@/lib/auth';
import { AuthContext, AuthContextProps } from './auth-context';

// Authentication functionality can be imported from auth-actions if needed

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

  const checkSession = async () => {
    try {
      setIsLoading(true);
      // Mock session check for now
      try {
        // Fetch user profile 
        const userProfile = await authClient.getUser();
        if (userProfile) {
          setUser(userProfile);
          
          // Load sessions
          await refreshSessions();
        } else {
          throw new Error('Failed to get user profile');
        }
      } catch (profileErr) {
        console.error('Error fetching user profile:', profileErr);
        setError('Failed to load user profile');
        setUser(null);
      }
    } catch (err) {
      console.error('Error checking session:', err);
      setError('Failed to authenticate');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Using an empty dependency array is acceptable here as checkSession doesn't have dependencies
  // that need to trigger a re-run and we only want to run this effect once on mount
  useEffect(() => {
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await authClient.login(email, password);
        if (result && result.user) {
          setUser(result.user);
          await refreshSessions();
          return true;
        }
      } catch (authErr) {
        console.error('Auth client login error:', authErr);
        setError('Invalid email or password');
        return false;
      }
      
      setError('Login failed');
      return false;
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Failed to log in');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      try {
        const userData = {
          email,
          password,
          name
        };
        
        const user = await authClient.register(userData);
        if (user) {
          setUser(user);
          await refreshSessions();
          return true;
        }
      } catch (authErr) {
        console.error('Auth client registration error:', authErr);
        setError('Registration failed. This email may already be registered.');
        return false;
      }
      
      setError('Registration failed');
      return false;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Failed to register');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      // Sign out from BetterAuth
      await authClient.logout();
      // Clear local state
      setUser(null);
      setSessions([]);
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to log out');
      // Even if the server logout fails, clear local state
      setUser(null);
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSessions = async (): Promise<void> => {
    try {
      // For now, mock a list of sessions since the client doesn't have this method
      // In a real app, you would fetch this from the auth service
      setSessions([
        {
          id: '1',
          userId: user?.id || '1',
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
          createdAt: new Date().toISOString(),
          device: 'Current Device',
          lastActive: new Date().toISOString(),
          ip: '127.0.0.1'
        }
      ]);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      // If we can't fetch sessions, at least ensure the array is empty
      setSessions([]);
    }
  };

  const revokeSession = async (sessionId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      // Mock revoking a session for now
      console.log(`Mock revoking session ${sessionId}`);
      
      // In a real app, you would call the auth service
      // For now, just remove it from the local state
      setSessions(sessions.filter(session => session.id !== sessionId));
      return true;
    } catch (err) {
      console.error('Error revoking session:', err);
      setError(err instanceof Error ? err.message : 'Failed to revoke session');
      return false;
    } finally {
      setIsLoading(false);
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