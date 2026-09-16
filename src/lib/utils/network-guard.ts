/**
 * Network Timeout Guard for Supabase requests
 * Enforces a strict 2500ms timeout using AbortController to prevent long blocking SSR hangs
 * while safely preserving and respecting caller-provided AbortSignals.
 */

export const SUPABASE_NETWORK_TIMEOUT_MS = 2500

export class SupabaseTimeoutError extends Error {
  readonly code = 'TIMEOUT'
  readonly timeoutMs: number

  constructor(timeoutMs: number = SUPABASE_NETWORK_TIMEOUT_MS) {
    super(`Supabase request timed out after ${timeoutMs}ms`)
    this.name = 'TimeoutError'
    this.timeoutMs = timeoutMs
  }
}

/**
 * Creates a fetch wrapper with a deterministic timeout guard.
 *
 * @param timeoutMs Maximum duration in milliseconds before aborting (default: 2500ms)
 * @returns Custom fetch function compatible with standard fetch API
 */
export function createFetchWithTimeout(
  timeoutMs: number = SUPABASE_NETWORK_TIMEOUT_MS
): typeof fetch {
  return async (
    input: Parameters<typeof fetch>[0],
    init?: Parameters<typeof fetch>[1]
  ): Promise<Response> => {
    // If caller-provided signal is already aborted, abort immediately with caller reason
    if (init?.signal?.aborted) {
      const abortError = new Error('Request was aborted by caller')
      abortError.name = 'AbortError'
      throw init.signal.reason || abortError
    }

    const controller = new AbortController()
    let isTimedOut = false

    const timer = setTimeout(() => {
      isTimedOut = true
      controller.abort(new SupabaseTimeoutError(timeoutMs))
    }, timeoutMs)

    // Listen to caller signal if provided to support upstream cancellation
    let onCallerAbort: (() => void) | undefined
    if (init?.signal) {
      onCallerAbort = () => {
        clearTimeout(timer)
        controller.abort(init.signal?.reason)
      }
      init.signal.addEventListener('abort', onCallerAbort, { once: true })
    }

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      })
      return response
    } catch (error: unknown) {
      // If abortion was triggered by our timeout guard, throw structured SupabaseTimeoutError
      if (isTimedOut) {
        throw new SupabaseTimeoutError(timeoutMs)
      }
      // Otherwise preserve original error (caller abort or network failure)
      throw error
    } finally {
      clearTimeout(timer)
      if (init?.signal && onCallerAbort) {
        init.signal.removeEventListener('abort', onCallerAbort)
      }
    }
  }
}

export const fetchWithTimeout = createFetchWithTimeout(SUPABASE_NETWORK_TIMEOUT_MS)
