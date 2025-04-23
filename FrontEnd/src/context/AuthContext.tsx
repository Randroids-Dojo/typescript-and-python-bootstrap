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
        try {
          // Fetch user profile with BetterAuth client
          const userProfile = await authClient.getUser();
          if (userProfile) {
            setUser({
              id: session.userId,
              email: userProfile.email,
              name: userProfile.name || 'Unknown User',
              role: userProfile.role || 'user'
            });
            
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
      
      const result = await authClient.signIn.email({
        email,
        password,
        callbackURL: '/dashboard'
      });
      
      if (result.error) {
        // Enhanced error handling with more specific messages
        let errorMessage = 'Authentication failed';
        
        // Map common error types to user-friendly messages
        if (result.error.includes('credentials')) {
          errorMessage = 'Invalid email or password';
        } else if (result.error.includes('rate limit')) {
          errorMessage = 'Too many login attempts. Please try again later.';
        } else if (result.error.includes('verify')) {
          errorMessage = 'Please verify your email address before logging in.';
        }
        
        setError(errorMessage);
        return false;
      }
      
      if (result.data) {
        // Successfully logged in
        try {
          // Get full user profile
          const userProfile = await authClient.getUser();
          setUser({
            ...result.data.user,
            ...userProfile
          });
          await refreshSessions();
          return true;
        } catch (profileErr) {
          console.error('Error loading user profile after login:', profileErr);
          // We're still logged in, but couldn't get the full profile
          setUser(result.data.user);
          return true;
        }
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
      
      const result = await authClient.signUp.email({
        email,
        password,
        name,
        callbackURL: '/dashboard'
      });
      
      if (result.error) {
        // Enhanced error handling with more specific messages
        let errorMessage = 'Registration failed';
        
        // Map common error types to user-friendly messages
        if (result.error.includes('email') && result.error.includes('exist')) {
          errorMessage = 'This email is already registered. Please login or use a different email.';
        } else if (result.error.includes('password')) {
          errorMessage = 'Password does not meet security requirements. Use at least 8 characters including uppercase, lowercase, numbers and special characters.';
        } else if (result.error.includes('email') && result.error.includes('valid')) {
          errorMessage = 'Please enter a valid email address.';
        }
        
        setError(errorMessage);
        return false;
      }
      
      if (result.data) {
        // Successfully registered
        try {
          // Get full user profile
          const userProfile = await authClient.getUser();
          setUser({
            ...result.data.user,
            ...userProfile
          });
          await refreshSessions();
          return true;
        } catch (profileErr) {
          console.error('Error loading user profile after registration:', profileErr);
          // We're still registered and logged in, but couldn't get the full profile
          setUser(result.data.user);
          return true;
        }
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
      // Sign out from BetterAuth with optional redirect
      await authClient.signOut({
        // You can specify a redirect URL here if needed
        // redirectTo: '/login'
      });
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
      // Fetch all sessions from BetterAuth
      const sessionList = await authClient.getSessions();
      setSessions(sessionList);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      // If we can't fetch sessions, at least ensure the array is empty
      setSessions([]);
    }
  };

  const revokeSession = async (sessionId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      // Revoke specific session with BetterAuth
      const success = await authClient.revokeSession(sessionId);
      if (success) {
        // If successful, refresh the sessions list
        await refreshSessions();
        return true;
      } else {
        setError('Failed to revoke session');
        return false;
      }
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};