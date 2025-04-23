// Configuration type for better auth client
interface BetterAuthConfig {
  baseUrl: string;
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
    retryStatusCodes: number[];
  };
  onError?: (error: unknown) => void;
}

// User registration data type
interface UserRegistrationData {
  email: string;
  password: string;
  name: string;
  [key: string]: unknown;
}

// Mock betterAuth client for development until the real client is available
const betterAuth = (config: BetterAuthConfig) => {
  console.log('Initializing betterAuth with config:', config);
  return {
    createClient: () => ({
      login: async (email: string, password: string) => {
        console.log(`Mock login for ${email} with password length: ${password.length}`);
        return { user: { id: '1', email, name: 'Test User', role: 'user' }, token: 'mock-token' };
      },
      register: async (userData: UserRegistrationData) => {
        console.log(`Mock register for ${userData.email}`);
        return { id: '1', ...userData, role: 'user' };
      },
      logout: async () => {
        console.log('Mock logout');
        return true;
      },
      getUser: async () => {
        console.log('Mock getUser');
        return { id: '1', email: 'user@example.com', name: 'Test User', role: 'user' };
      },
      refreshToken: async () => {
        console.log('Mock refreshToken');
        return { token: 'mock-refreshed-token' };
      },
      validateToken: async (token: string) => {
        console.log(`Mock validateToken: ${token}`);
        return true;
      },
      resetPassword: async (email: string) => {
        console.log(`Mock resetPassword for ${email}`);
        return;
      },
      updateUser: async (userData: Partial<User>) => {
        console.log(`Mock updateUser: ${JSON.stringify(userData)}`);
        return { id: '1', ...userData, role: 'user' };
      },
      useSession: () => ({
        status: 'authenticated'
      })
    })
  };
};

// Interface definitions for BetterAuth client
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

export interface AuthError {
  code: string;
  message: string;
  isRetryable: boolean;
}

// Initialize the real BetterAuth client with proper error handling
const createAuthClient = () => {
  const baseUrl = import.meta.env.VITE_AUTH_URL || 'http://localhost:4000/api/auth';
  
  try {
    const authInstance = betterAuth({
      baseUrl,
      retryConfig: {
        maxRetries: 3,
        retryDelay: 1000,
        retryStatusCodes: [408, 429, 500, 502, 503, 504]
      },
      onError: (error: unknown) => {
        console.error('[Auth Service Error]', error);
        // Log detailed information for troubleshooting
        if (error && typeof error === 'object' && 'response' in error && error.response) {
          const responseError = error.response as Record<string, unknown>;
          console.error('Response data:', responseError.data);
          console.error('Status code:', responseError.status);
        } else if (error && typeof error === 'object' && 'request' in error) {
          console.error('No response received:', error.request);
        } else if (error instanceof Error) {
          console.error('Error setting up request:', error.message);
        } else {
          console.error('Unknown error format:', error);
        }
      }
    });
    
    return authInstance.createClient();
  } catch (error) {
    console.error('[Auth Service Initialization Error]', error);
    // Return fallback client with dummy methods that will show appropriate UI messages
    return createFallbackClient();
  }
};

// Fallback client implementation for when auth service is unavailable
const createFallbackClient = () => {
  const createError = (message: string): AuthError => ({
    code: 'AUTH_SERVICE_UNAVAILABLE',
    message,
    isRetryable: true
  });

  const handleOperation = async <T>(operation: string): Promise<T> => {
    console.warn(`[Auth Service Fallback] ${operation} called while auth service is unavailable`);
    throw createError('Authentication service is currently unavailable. Please try again later.');
  };

  return {
    // Using function declarations to avoid unused parameter warnings
    login: async (email: string, password: string) => {
      console.log(`Fallback login attempt for ${email} with password length: ${password.length}`);
      return handleOperation<{user: User, token: string}>('login');
    },
    register: async (userData: UserRegistrationData) => {
      console.log(`Fallback register attempt for user ${userData.email}`);
      return handleOperation<User>('register');
    },
    logout: () => 
      handleOperation<boolean>('logout'),
    getUser: () => 
      handleOperation<User>('getUser'),
    refreshToken: () => 
      handleOperation<{token: string}>('refreshToken'),
    validateToken: async (token: string) => {
      console.log(`Fallback token validation for token length: ${token.length}`);
      return handleOperation<boolean>('validateToken');
    },
    resetPassword: async (email: string) => {
      console.log(`Fallback password reset for ${email}`);
      return handleOperation<void>('resetPassword');
    },
    updateUser: async (userData: Partial<User>) => {
      console.log(`Fallback user update with data: ${JSON.stringify(userData)}`);
      return handleOperation<User>('updateUser');
    },
    useSession: () => ({
      status: 'unauthenticated'
    })
  };
};

export const authClient = createAuthClient();
export default authClient;