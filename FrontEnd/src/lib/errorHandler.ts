import { toast } from 'sonner';

// Error types for categorization
export enum ErrorType {
  AUTH = 'authentication',
  AUTH_SERVICE = 'auth_service', // New type for auth service failures
  VALIDATION = 'validation',
  SERVER = 'server',
  NETWORK = 'network',
  RETRYABLE = 'retryable', // New type for retryable errors
  UNKNOWN = 'unknown',
}

// Interface for structured error handling
export interface AppError {
  type: ErrorType;
  message: string;
  details?: unknown;
  statusCode?: number;
  isRetryable?: boolean;
}

/**
 * Categorize errors by status code or error message
 */
export function categorizeError(error: unknown): AppError {
  // Already structured error
  if (typeof error === 'object' && error !== null && 'type' in error && 'message' in error) {
    return error as AppError;
  }

  // Check for auth service errors (from BetterAuth client)
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string' &&
    'message' in error
  ) {
    const errorCode = error.code as string;
    const message = String(error.message);
    
    // Auth service unavailable errors
    if (errorCode === 'AUTH_SERVICE_UNAVAILABLE') {
      return {
        type: ErrorType.AUTH_SERVICE,
        message: 'Authentication service unavailable',
        details: error,
        isRetryable: 'isRetryable' in error && Boolean(error.isRetryable),
      };
    }
    
    // Auth-related errors
    if (errorCode.includes('AUTH_') || errorCode.includes('TOKEN_')) {
      return {
        type: ErrorType.AUTH,
        message,
        details: error,
      };
    }
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
    
    // Retryable server errors
    if (statusCode === 429 || statusCode === 503 || statusCode === 504) {
      return {
        type: ErrorType.RETRYABLE,
        message: statusCode === 429 
          ? 'Too many requests, please try again later' 
          : 'Service temporarily unavailable',
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
      isRetryable: true,
    };
  }
  
  // Specific error messages that suggest auth service issues
  if (error instanceof Error && (
    error.message.includes('auth service') || 
    error.message.includes('authentication service')
  )) {
    return {
      type: ErrorType.AUTH_SERVICE,
      message: 'Authentication service unavailable',
      details: error,
      isRetryable: true,
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
      
    case ErrorType.AUTH_SERVICE:
      toast.error(appError.message, {
        description: 'Please try again later or contact support if the problem persists',
        id: 'auth-service-error',
        duration: 5000,
      });
      break;
      
    case ErrorType.VALIDATION:
      toast.error(appError.message, {
        description: 'Please check your input and try again',
        id: 'validation-error',
      });
      break;
      
    case ErrorType.RETRYABLE:
      toast.error(appError.message, {
        description: 'This operation will be retried automatically',
        id: 'retryable-error',
        duration: 3000,
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