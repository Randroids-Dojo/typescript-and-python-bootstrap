import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sleep utility function for async operations
 */
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    retryDelay?: number;
    onRetry?: (error: unknown, attempt: number) => void;
    shouldRetry?: (error: unknown) => boolean;
  } = {}
): Promise<T> {
  const {
    retries = 3,
    retryDelay = 1000,
    onRetry = () => {},
    shouldRetry = () => true,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry this error
      if (!shouldRetry(error)) {
        throw error;
      }

      // Skip retrying if this was the last attempt
      if (attempt >= retries - 1) {
        break;
      }

      // Notify about retry
      onRetry(error, attempt + 1);

      // Wait with exponential backoff before retrying
      // e.g., 1000ms, 2000ms, 4000ms
      const delay = retryDelay * Math.pow(2, attempt);
      await sleep(delay);
    }
  }

  throw lastError;
}