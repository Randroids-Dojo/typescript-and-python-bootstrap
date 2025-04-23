import { toast } from 'sonner';

// Error types for categorization
export enum ErrorType {
  AUTH = 'authentication',
  VALIDATION = 'validation',
  SERVER = 'server',
  NETWORK = 'network',
  UNKNOWN = 'unknown',
}

// Interface for structured error handling
export interface AppError {
  type: ErrorType;
  message: string;
  details?: unknown;
  statusCode?: number;
}

/**
 * Categorize errors by status code or error message
 */
export function categorizeError(error: unknown): AppError {
  // Already structured error
  if (typeof error === 'object' && error !== null && 'type' in error && 'message' in error) {
    return error as AppError;
  }

  // API error with status code
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number'
  ) {
    const statusCode = error.status as number;
    const message = 'message' in error ? String(error.message) : 'An error occurred';
    
    // Authentication errors
    if (statusCode === 401 || statusCode === 403) {
      return {
        type: ErrorType.AUTH,
        message: statusCode === 401 ? 'Authentication required' : 'Insufficient permissions',
        details: error,
        statusCode,
      };
    }
    
    // Validation errors
    if (statusCode === 400 || statusCode === 422) {
      return {
        type: ErrorType.VALIDATION,
        message: 'Invalid data provided',
        details: error,
        statusCode,
      };
    }
    
    // Server errors
    if (statusCode >= 500) {
      return {
        type: ErrorType.SERVER,
        message: 'Server error, please try again later',
        details: error,
        statusCode,
      };
    }
    
    // Other HTTP errors
    return {
      type: ErrorType.UNKNOWN,
      message,
      details: error,
      statusCode,
    };
  }

  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      type: ErrorType.NETWORK,
      message: 'Network error, please check your connection',
      details: error,
    };
  }

  // Default unknown error
  return {
    type: ErrorType.UNKNOWN,
    message: error instanceof Error ? error.message : 'An unexpected error occurred',
    details: error,
  };
}

/**
 * Display appropriate toast notification for an error
 */
export function notifyError(error: unknown): void {
  const appError = categorizeError(error);
  
  // Different toast types based on error category
  switch (appError.type) {
    case ErrorType.AUTH:
      toast.error(appError.message, {
        description: 'Please sign in to continue',
        id: 'auth-error',
      });
      break;
      
    case ErrorType.VALIDATION:
      toast.error(appError.message, {
        description: 'Please check your input and try again',
        id: 'validation-error',
      });
      break;
      
    case ErrorType.SERVER:
      toast.error(appError.message, {
        description: 'Our team has been notified',
        id: 'server-error',
      });
      break;
      
    case ErrorType.NETWORK:
      toast.error(appError.message, {
        description: 'Please check your internet connection',
        id: 'network-error',
      });
      break;
      
    default:
      toast.error(appError.message, {
        id: 'unknown-error',
      });
  }
  
  // Log error details to console in development
  if (import.meta.env.DEV) {
    console.error('Error details:', appError.details);
  }
}

/**
 * Display success notification
 */
export function notifySuccess(message: string, description?: string): void {
  toast.success(message, {
    description,
  });
}

/**
 * Safe error handler that won't expose sensitive information
 */
export function handleError(error: unknown, fallbackMessage = 'An error occurred'): string {
  const appError = categorizeError(error);
  notifyError(appError);
  
  // Show generic message for server errors in production
  if (appError.type === ErrorType.SERVER && !import.meta.env.DEV) {
    return fallbackMessage;
  }
  
  return appError.message;
}