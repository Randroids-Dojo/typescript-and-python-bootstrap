import { betterAuth } from 'better-auth/client';

// Initialize the real BetterAuth client
const authInstance = betterAuth({
  baseUrl: import.meta.env.VITE_AUTH_URL || 'http://localhost:4000/api'
});

export const authClient = authInstance.createClient();
export default authClient;

// The interface definitions below are kept for reference and type checking
// The actual implementation is now using the real BetterAuth client

interface AuthClient {
  signIn: {
    email: (params: { email: string; password: string; callbackURL?: string }) => Promise<{
      data?: { user: User; token: string };
      error?: string;
    }>;
  };
  signUp: {
    email: (params: {
      email: string;
      password: string;
      name: string;
      callbackURL?: string;
    }) => Promise<{
      data?: { user: User; token: string };
      error?: string;
    }>;
  };
  signOut: (options?: { redirectTo?: string }) => Promise<void>;
  useSession: () => {
    session: Session | null;
    status: 'loading' | 'authenticated' | 'unauthenticated';
  };
  refreshToken: () => Promise<{ token: string } | null>;
  revokeSession: (sessionId: string) => Promise<boolean>;
  getSessions: () => Promise<Session[]>;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
  device: string;
  lastActive: string;
  ip: string;
}

export function createAuthClient(config: { baseURL: string }): AuthClient {
  // In a real implementation, this would connect to your auth server
  console.log('Auth client initialized with config:', config);
  
  let currentUser: User | null = null;
  let token: string | null = null;
  
  // Mock sessions
  const mockSessions: Session[] = [];
  
  const authClient: AuthClient = {
    signIn: {
      email: async ({ email, password }) => {
        console.log('Signing in with:', { email, password });
        
        // This is just a mock - in real implementation, this would call your auth API
        if (email === 'user@example.com' && password === 'password') {
          currentUser = {
            id: '1',
            email,
            name: 'Test User',
            role: 'user'
          };
          
          token = 'mock-jwt-token';
          
          // Create a mock session
          const session: Session = {
            id: Date.now().toString(),
            userId: currentUser.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
            device: navigator.userAgent,
            lastActive: new Date().toISOString(),
            ip: '127.0.0.1'
          };
          
          mockSessions.push(session);
          
          return {
            data: {
              user: currentUser,
              token
            }
          };
        }
        
        return {
          error: 'Invalid credentials'
        };
      }
    },
    
    signUp: {
      email: async ({ email, password, name }) => {
        console.log('Signing up with:', { email, password, name });
        
        // This is just a mock - in real implementation, this would call your auth API
        currentUser = {
          id: Date.now().toString(),
          email,
          name,
          role: 'user'
        };
        
        token = 'mock-jwt-token';
        
        // Create a mock session
        const session: Session = {
          id: Date.now().toString(),
          userId: currentUser.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          device: navigator.userAgent,
          lastActive: new Date().toISOString(),
          ip: '127.0.0.1'
        };
        
        mockSessions.push(session);
        
        return {
          data: {
            user: currentUser,
            token
          }
        };
      }
    },
    
    signOut: async () => {
      console.log('Signing out');
      currentUser = null;
      token = null;
    },
    
    useSession: () => {
      if (currentUser && token) {
        return {
          session: {
            id: mockSessions[0]?.id || '1',
            userId: currentUser.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
            device: navigator.userAgent,
            lastActive: new Date().toISOString(),
            ip: '127.0.0.1'
          },
          status: 'authenticated' as const
        };
      }
      
      return {
        session: null,
        status: 'unauthenticated' as const
      };
    },
    
    refreshToken: async () => {
      if (token) {
        token = 'new-mock-jwt-token';
        return { token };
      }
      return null;
    },
    
    revokeSession: async (sessionId: string) => {
      const sessionIndex = mockSessions.findIndex(s => s.id === sessionId);
      if (sessionIndex >= 0) {
        mockSessions.splice(sessionIndex, 1);
        return true;
      }
      return false;
    },
    
    getSessions: async () => {
      return [...mockSessions];
    }
  };
  
  return authClient;
}

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_AUTH_URL || 'http://localhost:4000/api/auth'
});