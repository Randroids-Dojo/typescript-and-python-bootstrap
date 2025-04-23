import { authClient } from '@/lib/auth';

// Get the base API URL from environment variables or use default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Common options for fetch calls
const defaultOptions: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
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
    } catch (e) {
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
  } catch (e) {
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
  const session = authClient.useSession();
  
  if (session.status !== 'authenticated') {
    return options;
  }
  
  const token = await authClient.refreshToken();
  
  if (!token) {
    return options;
  }
  
  return {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token.token}`,
    },
  };
};

// Basic API client with CRUD methods
export const apiClient = {
  // GET request
  async get<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const authOptions = await withAuth(options);
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...defaultOptions,
        ...authOptions,
        method: 'GET',
      });
      return handleResponse<T>(response);
    } catch (e) {
      return {
        error: {
          status: 500,
          message: 'Failed to make request',
          details: e instanceof Error ? e.message : String(e),
        },
      };
    }
  },

  // POST request
  async post<T>(endpoint: string, data: unknown, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const authOptions = await withAuth(options);
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...defaultOptions,
        ...authOptions,
        method: 'POST',
        body: JSON.stringify(data),
      });
      return handleResponse<T>(response);
    } catch (e) {
      return {
        error: {
          status: 500,
          message: 'Failed to make request',
          details: e instanceof Error ? e.message : String(e),
        },
      };
    }
  },

  // PUT request
  async put<T>(endpoint: string, data: unknown, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const authOptions = await withAuth(options);
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...defaultOptions,
        ...authOptions,
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return handleResponse<T>(response);
    } catch (e) {
      return {
        error: {
          status: 500,
          message: 'Failed to make request',
          details: e instanceof Error ? e.message : String(e),
        },
      };
    }
  },

  // PATCH request
  async patch<T>(endpoint: string, data: unknown, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const authOptions = await withAuth(options);
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...defaultOptions,
        ...authOptions,
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return handleResponse<T>(response);
    } catch (e) {
      return {
        error: {
          status: 500,
          message: 'Failed to make request',
          details: e instanceof Error ? e.message : String(e),
        },
      };
    }
  },

  // DELETE request
  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const authOptions = await withAuth(options);
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...defaultOptions,
        ...authOptions,
        method: 'DELETE',
      });
      return handleResponse<T>(response);
    } catch (e) {
      return {
        error: {
          status: 500,
          message: 'Failed to make request',
          details: e instanceof Error ? e.message : String(e),
        },
      };
    }
  },
};