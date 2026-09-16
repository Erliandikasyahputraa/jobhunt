/**
 * Normalized Error Handling Utility
 * Translates technical Supabase, network, and runtime errors into
 * clean, user-friendly messages without exposing raw internal details.
 */

export type ErrorCategory = 'auth' | 'timeout' | 'network' | 'rate_limit' | 'unknown'

interface StructuredErrorLike {
  name?: string
  code?: string | number
  status?: number
  statusCode?: number
  message?: string
}

function toErrorLike(error: unknown): StructuredErrorLike {
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>
    return {
      name: typeof err.name === 'string' ? err.name : undefined,
      code: typeof err.code === 'string' || typeof err.code === 'number' ? err.code : undefined,
      status: typeof err.status === 'number' ? err.status : undefined,
      statusCode: typeof err.statusCode === 'number' ? err.statusCode : undefined,
      message: typeof err.message === 'string' ? err.message : undefined,
    }
  }
  if (typeof error === 'string') {
    return { message: error }
  }
  return {}
}

/**
 * Categorizes an error based on its structured properties (name, code, status, message).
 */
export function categorizeError(error: unknown): ErrorCategory {
  if (!error) return 'unknown'

  const { name, code, status, statusCode, message = '' } = toErrorLike(error)
  const httpStatus = status ?? statusCode

  // 1. Timeout detection
  if (
    name === 'TimeoutError' ||
    name === 'SupabaseTimeoutError' ||
    code === 'TIMEOUT' ||
    code === 'ETIMEDOUT' ||
    message.toLowerCase().includes('timed out') ||
    message.toLowerCase().includes('timeout')
  ) {
    return 'timeout'
  }

  // 2. Network & DNS connectivity failure
  if (
    code === 'ENOTFOUND' ||
    code === 'ECONNRESET' ||
    code === 'ECONNREFUSED' ||
    httpStatus === 502 ||
    httpStatus === 503 ||
    httpStatus === 504 ||
    message.includes('ENOTFOUND') ||
    message.includes('ECONNRESET') ||
    message.includes('ECONNREFUSED') ||
    message.includes('Failed to fetch') ||
    message.includes('fetch failed') ||
    message.includes('NetworkError')
  ) {
    return 'network'
  }

  // 3. Rate limiting
  if (
    httpStatus === 429 ||
    code === 'rate_limit' ||
    code === '429' ||
    message.toLowerCase().includes('rate limit') ||
    message.toLowerCase().includes('too many requests')
  ) {
    return 'rate_limit'
  }

  // 4. Auth & Session invalidation
  if (
    name === 'AuthApiError' ||
    name === 'AuthSessionMissingError' ||
    code === 'invalid_grant' ||
    code === 'invalid_token' ||
    code === 'session_not_found' ||
    httpStatus === 401 ||
    message.includes('Invalid Refresh Token') ||
    message.includes('Refresh Token Not Found') ||
    message.includes('session corrupted') ||
    message.includes('session_not_found') ||
    message.includes('JWT expired') ||
    message.includes('token is expired') ||
    message.includes('User from sub claim in JWT does not exist') ||
    message.includes('Unauthorized')
  ) {
    return 'auth'
  }

  return 'unknown'
}

export function isAuthError(error: unknown): boolean {
  return categorizeError(error) === 'auth'
}

export function isTimeoutError(error: unknown): boolean {
  return categorizeError(error) === 'timeout'
}

export function isNetworkError(error: unknown): boolean {
  return categorizeError(error) === 'network'
}

/**
 * Returns a user-friendly Indonesian error message based on the categorized error.
 * Prevents raw technical error details, tokens, and stack traces from leaking to users.
 */
export function getNormalizedErrorMessage(
  error: unknown,
  fallbackMessage = 'Terjadi kesalahan pada sistem. Silakan coba beberapa saat lagi.'
): string {
  const category = categorizeError(error)

  switch (category) {
    case 'timeout':
      return 'Koneksi ke server sedang lambat. Silakan coba lagi.'
    case 'network':
      return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.'
    case 'rate_limit':
      return 'Terlalu banyak permintaan. Silakan tunggu beberapa saat.'
    case 'auth':
      return 'Sesi Anda telah berakhir. Silakan masuk kembali.'
    default:
      return fallbackMessage
  }
}
