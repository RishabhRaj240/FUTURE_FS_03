/**
 * Utility functions for Supabase operations with consistent error handling
 */

import { PostgrestError } from '@supabase/supabase-js';

export interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

/**
 * Parse Supabase errors into user-friendly messages
 */
export const parseSupabaseError = (error: unknown): SupabaseError => {
  if (error instanceof Error) {
    // Network errors
    if (
      error.message.includes('fetch') ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('NetworkError') ||
      error.message.includes('network')
    ) {
      return {
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        code: 'NETWORK_ERROR',
      };
    }

    // Check if it's a PostgrestError
    const postgresError = error as PostgrestError;
    if (postgresError.code) {
      return parsePostgresError(postgresError);
    }

    return {
      message: error.message,
    };
  }

  return {
    message: 'An unexpected error occurred',
  };
};

/**
 * Parse Postgres-specific errors
 */
const parsePostgresError = (error: PostgrestError): SupabaseError => {
  const code = error.code;
  const message = error.message;

  // Common Postgres error codes
  switch (code) {
    case 'PGRST116':
      // Not found - this is often expected
      return {
        message: 'Resource not found',
        code,
      };

    case '23505':
      // Unique violation
      if (message.includes('username')) {
        return {
          message: 'Username already exists. Please choose a different username.',
          code,
        };
      }
      if (message.includes('email')) {
        return {
          message: 'Email already exists. Please use a different email.',
          code,
        };
      }
      return {
        message: 'This record already exists.',
        code,
      };

    case '23503':
      // Foreign key violation
      return {
        message: 'Invalid reference. The related record does not exist.',
        code,
      };

    case '23502':
      // Not null violation
      return {
        message: 'Required field is missing.',
        code,
      };

    case '42501':
      // Insufficient privilege
      return {
        message: 'You do not have permission to perform this action.',
        code,
      };

    case '42P01':
      // Undefined table
      return {
        message: 'Database table does not exist. Please contact support.',
        code,
      };

    case '42703':
      // Undefined column
      return {
        message: 'Database column does not exist. Please contact support.',
        code,
      };

    default:
      return {
        message: message || 'A database error occurred',
        code,
        details: error.details,
        hint: error.hint,
      };
  }
};

/**
 * Handle Supabase query errors consistently
 */
export const handleSupabaseError = (
  error: unknown,
  defaultMessage = 'An error occurred'
): string => {
  const parsed = parseSupabaseError(error);
  return parsed.message || defaultMessage;
};

/**
 * Check if error is a "not found" error (which is often expected)
 */
export const isNotFoundError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const postgresError = error as PostgrestError;
    return postgresError.code === 'PGRST116';
  }
  return false;
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return (
      error.message.includes('fetch') ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('NetworkError') ||
      error.message.includes('network')
    );
  }
  return false;
};

/**
 * Safe async wrapper for Supabase operations
 */
export const safeSupabaseOperation = async <T>(
  operation: () => Promise<T>,
  errorMessage = 'Operation failed'
): Promise<{ data: T | null; error: string | null }> => {
  try {
    const data = await operation();
    return { data, error: null };
  } catch (error) {
    const message = handleSupabaseError(error, errorMessage);
    console.error('Supabase operation error:', error);
    return { data: null, error: message };
  }
};

