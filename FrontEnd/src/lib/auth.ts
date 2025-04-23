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

// BetterAuth client implementation
const betterAuth = (config: BetterAuthConfig) => {
  const { baseUrl, retryConfig, onError } = config;
  
  // Helper function to handle API requests with retries
  const apiRequest = async <T>(
    url: string, 
    options: RequestInit, 
    retries = retryConfig?.maxRetries || 3
  ): Promise<T> => {
    try {
      const response = await fetch(`${baseUrl}${url}`, options);
      
      // Handle non-successful responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `Request failed with status ${response.status}`);
        
        // Add response properties to error object
        Object.assign(error, {
          response: {
            status: response.status,
            data: errorData,
            headers: Object.fromEntries(response.headers.entries())
          }
        });
        
        // Check if the error is retryable
        if (
          retries > 0 && 
          retryConfig?.retryStatusCodes?.includes(response.status)
        ) {
          // Wait before retry using the configured delay
          await new Promise(resolve => 
            setTimeout(resolve, retryConfig?.retryDelay || 1000)
          );
          return apiRequest<T>(url, options, retries - 1);
        }
        
        throw error;
      }
      
      // Return parsed JSON or empty object if no content
      return response.status === 204 ? {} as T : await response.json() as T;
    } catch (error) {
      // Log errors with the provided onError handler
      if (onError && error instanceof Error) {
        onError(error);
      }
      
      // Retry network errors if retries available
      if (
        retries > 0 && 
        error instanceof TypeError && 
        error.message.includes('fetch')
      ) {
        // Wait before retry
        await new Promise(resolve => 
          setTimeout(resolve, retryConfig?.retryDelay || 1000)
        );
        return apiRequest<T>(url, options, retries - 1);
      }
      
      throw error;
    }
  };
  
  return {
    createClient: () => ({
      login: async (email: string, password: string) => {
        return apiRequest<{ user: User; token: string }>(
          '/login', 
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
          }
        );
      },
      
      register: async (userData: UserRegistrationData) => {
        return apiRequest<User>(
          '/register', 
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
            credentials: 'include'
          }
        );
      },
      
      logout: async () => {
        return apiRequest<boolean>(
          '/logout', 
          {
            method: 'POST',
            credentials: 'include'
          }
        );
      },
      
      getUser: async () => {
        return apiRequest<User>(
          '/me', 
          {
            method: 'GET',
            credentials: 'include'
          }
        );
      },
      
      refreshToken: async () => {
        return apiRequest<{ token: string }>(
          '/refresh', 
          {
            method: 'POST',
            credentials: 'include'
          }
        );
      },
      
      validateToken: async (token: string) => {
        return apiRequest<boolean>(
          '/validate', 
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );
      },
      
      resetPassword: async (email: string) => {
        return apiRequest<void>(
          '/reset-password', 
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          }
        );
      },
      
      updateUser: async (userData: Partial<User>) => {
        return apiRequest<User>(
          '/user', 
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
            credentials: 'include'
          }
        );
      },
      
      useSession: () => {
        // This is a client-side stub for the useSession hook
        // The real implementation would be in a React context
        return {
          status: 'authenticated'
        };
      }
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