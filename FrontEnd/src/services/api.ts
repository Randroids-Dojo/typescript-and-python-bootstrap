import { authClient } from '@/lib/auth';

// Get the base API URL from environment variables or use default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Common options for fetch calls
const defaultOptions: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
};

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 300,
  backoffFactor: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableNetworkErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'Failed to fetch']
};

// Interface for API error responses
interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}

// Generic type for API responses
type ApiResponse<T> = {
  data?: T;
  error?: ApiError;
};

// Function to handle API responses
const handleResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  // If the response is not ok (status code outside the range 200-299)
  if (!response.ok) {
    // Try to parse the error response as JSON
    try {
      const errorData = await response.json();
      return {
        error: {
          status: response.status,
          message: errorData.message || 'An error occurred',
          details: errorData.details || errorData,
        },
      };
    } catch {
      // If the error response is not valid JSON
      return {
        error: {
          status: response.status,
          message: 'An error occurred',
        },
      };
    }
  }

  // If the response status is 204 (No Content), return empty data
  if (response.status === 204) {
    return { data: {} as T };
  }

  // Try to parse the response as JSON
  try {
    const data = await response.json();
    return { data };
  } catch {
    // If the response is not valid JSON
    return {
      error: {
        status: 500,
        message: 'Failed to parse response',
      },
    };
  }
};

// Function to add authentication headers to requests
const withAuth = async (options: RequestInit = {}): Promise<RequestInit> => {
  try {
    const session = authClient.useSession();
    
    if (session.status !== 'authenticated') {
      return options;
    }
    
    try {
      const token = await authClient.refreshToken();
      
      if (!token) {
        console.warn('Auth token refresh failed - proceeding without auth header');
        return options;
      }
      
      return {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token.token}`,
        },
      };
    } catch (tokenError) {
      console.error('[Auth Token Error]', tokenError);
      // Still return options without auth headers to allow non-authenticated requests
      return options;
    }
  } catch (error) {
    console.error('[Auth Session Error]', error);
    return options;
  }
};

// Function to implement retry logic with exponential backoff
const fetchWithRetry = async <T>(
  url: string, 
  options: RequestInit, 
  retryCount = 0
): Promise<ApiResponse<T>> => {
  try {
    const response = await fetch(url, options);
    
    // Check if we should retry based on status code
    if (
      RETRY_CONFIG.retryableStatusCodes.includes(response.status) && 
      retryCount < RETRY_CONFIG.maxRetries
    ) {
      const delay = RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffFactor, retryCount);
      console.warn(`Retrying failed request to ${url} (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry<T>(url, options, retryCount + 1);
    }
    
    return handleResponse<T>(response);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    
    // Check if we should retry based on network error type
    const shouldRetry = RETRY_CONFIG.retryableNetworkErrors.some(netErr => 
      errorMessage.includes(netErr)
    );
    
    if (shouldRetry && retryCount < RETRY_CONFIG.maxRetries) {
      const delay = RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffFactor, retryCount);
      console.warn(`Retrying failed request to ${url} due to network error (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry<T>(url, options, retryCount + 1);
    }
    
    return {
      error: {
        status: 500,
        message: 'Failed to make request after all retry attempts',
        details: errorMessage,
      },
    };
  }
};

// Basic API client with CRUD methods
export const apiClient = {
  // GET request
  async get<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const authOptions = await withAuth(options);
      return fetchWithRetry<T>(`${API_URL}${endpoint}`, {
        ...defaultOptions,
        ...authOptions,
        method: 'GET',
      });
    } catch (err) {
      return {
        error: {
          status: 500,
          message: 'Failed to make request',
          details: err instanceof Error ? err.message : String(err),
        },
      };
    }
  },

  // POST request
  async post<T>(endpoint: string, data: unknown, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const authOptions = await withAuth(options);
      return fetchWithRetry<T>(`${API_URL}${endpoint}`, {
        ...defaultOptions,
        ...authOptions,
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err) {
      return {
        error: {
          status: 500,
          message: 'Failed to make request',
          details: err instanceof Error ? err.message : String(err),
        },
      };
    }
  },

  // PUT request
  async put<T>(endpoint: string, data: unknown, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const authOptions = await withAuth(options);
      return fetchWithRetry<T>(`${API_URL}${endpoint}`, {
        ...defaultOptions,
        ...authOptions,
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (err) {
      return {
        error: {
          status: 500,
          message: 'Failed to make request',
          details: err instanceof Error ? err.message : String(err),
        },
      };
    }
  },

  // PATCH request
  async patch<T>(endpoint: string, data: unknown, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const authOptions = await withAuth(options);
      return fetchWithRetry<T>(`${API_URL}${endpoint}`, {
        ...defaultOptions,
        ...authOptions,
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    } catch (err) {
      return {
        error: {
          status: 500,
          message: 'Failed to make request',
          details: err instanceof Error ? err.message : String(err),
        },
      };
    }
  },

  // DELETE request
  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const authOptions = await withAuth(options);
      return fetchWithRetry<T>(`${API_URL}${endpoint}`, {
        ...defaultOptions,
        ...authOptions,
        method: 'DELETE',
      });
    } catch (err) {
      return {
        error: {
          status: 500,
          message: 'Failed to make request',
          details: err instanceof Error ? err.message : String(err),
        },
      };
    }
  },
};