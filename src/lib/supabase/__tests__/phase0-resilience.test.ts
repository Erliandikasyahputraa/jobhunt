// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { updateSession } from '../middleware'
import {
  createFetchWithTimeout,
  SUPABASE_NETWORK_TIMEOUT_MS,
  SupabaseTimeoutError,
} from '@/lib/utils/network-guard'
import {
  categorizeError,
  getNormalizedErrorMessage,
  isAuthError,
  isNetworkError,
  isTimeoutError,
} from '@/lib/utils/error-handler'

// Mock createServerClient from @supabase/ssr
const mockGetUser = vi.fn()
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}))

describe('Phase 0 — Stability & Network Resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  })

  // =========================================================================
  // TEST A — AUTH ERROR (Defensive recovery, cookie cleanup, protected route)
  // =========================================================================
  describe('TEST A — Auth Error Recovery', () => {
    it('handles AuthApiError gracefully without throwing unhandled exception', async () => {
      const authError = new Error('Invalid Refresh Token: Refresh Token Not Found')
      authError.name = 'AuthApiError'
      mockGetUser.mockRejectedValue(authError)

      const request = new NextRequest('http://localhost:3000/dashboard', {
        headers: {
          cookie: 'sb-test-project-auth-token=stale-corrupt-token; other-cookie=keep-me',
        },
      })

      // Must not throw an unhandled exception
      const response = await updateSession(request)

      // Must redirect to /login?reason=expired
      expect(response.status).toBe(307)
      const location = response.headers.get('location')
      expect(location).toContain('/login')
      expect(location).toContain('reason=expired')

      // Must delete the stale auth token cookie
      const setCookie = response.headers.get('set-cookie') || ''
      expect(setCookie).toContain('sb-test-project-auth-token=;')
      // Must not delete unrelated cookies
      expect(setCookie).not.toContain('other-cookie=;')
    })

    it('handles session corruption returned in data error object', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: {
          name: 'AuthApiError',
          message: 'User from sub claim in JWT does not exist',
          status: 401,
        },
      })

      const request = new NextRequest('http://localhost:3000/applications', {
        headers: {
          cookie: 'sb-test-project-auth-token.0=chunk0; sb-test-project-auth-token.1=chunk1',
        },
      })

      const response = await updateSession(request)
      expect(response.status).toBe(307)
      const location = response.headers.get('location')
      expect(location).toContain('/login')
      expect(location).toContain('reason=expired')

      // Chunked cookies must also be cleared
      const setCookie = response.headers.get('set-cookie') || ''
      expect(setCookie).toContain('sb-test-project-auth-token.0=;')
      expect(setCookie).toContain('sb-test-project-auth-token.1=;')
    })
  })

  // =========================================================================
  // TEST B — VALID SESSION (Normal authenticated flow)
  // =========================================================================
  describe('TEST B — Valid Session', () => {
    it('allows authenticated user to access protected routes normally', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'user@example.com' } },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/dashboard')
      const response = await updateSession(request)

      // Not redirected to /login, proceeds normally (status 200)
      expect(response.status).toBe(200)
      expect(response.headers.get('location')).toBeNull()
    })

    it('redirects authenticated user away from login to /dashboard', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'user@example.com' } },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/login')
      const response = await updateSession(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/dashboard')
    })
  })

  // =========================================================================
  // TEST C — NETWORK TIMEOUT (2500ms AbortController guard)
  // =========================================================================
  describe('TEST C — Network Timeout Guard', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('cancels requests that exceed the timeout and verifies AbortSignal is aborted', async () => {
      let capturedSignal: AbortSignal | null | undefined

      // Mock fetch to capture the signal and simulate slow connection (> 3000ms)
      const slowFetch = vi.fn(
        (_url: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
          capturedSignal = init?.signal
          return new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
              const err = new Error('The operation was aborted.')
              err.name = 'AbortError'
              reject(err)
            })
          })
        }
      )

      vi.stubGlobal('fetch', slowFetch)

      const timeoutMs = 100 // Test with 100ms for fast deterministic execution
      const fetchGuard = createFetchWithTimeout(timeoutMs)

      const startTime = Date.now()
      let thrownError: unknown

      try {
        await fetchGuard('https://test-project.supabase.co/rest/v1/applications')
      } catch (err) {
        thrownError = err
      }

      const elapsed = Date.now() - startTime

      // Assert timeout occurred around the intended threshold (~100ms, definitely < 1000ms)
      expect(elapsed).toBeGreaterThanOrEqual(90)
      expect(elapsed).toBeLessThan(1000)

      // Assert controlled TimeoutError was thrown
      expect(thrownError).toBeInstanceOf(SupabaseTimeoutError)
      expect((thrownError as Error).name).toBe('TimeoutError')
      expect((thrownError as Error).message).toContain(`timed out after ${timeoutMs}ms`)

      // Assert the underlying fetch observed AbortSignal.aborted === true
      expect(capturedSignal?.aborted).toBe(true)
    })

    it('redirects to /login?reason=timeout on protected route without wiping cookies', async () => {
      const timeoutError = new SupabaseTimeoutError(SUPABASE_NETWORK_TIMEOUT_MS)
      mockGetUser.mockRejectedValue(timeoutError)

      const request = new NextRequest('http://localhost:3000/dashboard', {
        headers: {
          cookie: 'sb-test-project-auth-token=saved-session',
        },
      })

      const response = await updateSession(request)

      expect(response.status).toBe(307)
      const location = response.headers.get('location')
      expect(location).toContain('/login')
      expect(location).toContain('reason=timeout')

      // Transient timeout must NOT wipe auth cookies
      const setCookie = response.headers.get('set-cookie') || ''
      expect(setCookie).not.toContain('sb-test-project-auth-token=;')
    })
  })

  // =========================================================================
  // TEST D — NORMAL NETWORK RESPONSE (< 2500ms)
  // =========================================================================
  describe('TEST D — Normal Network Response', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('completes fast requests normally without aborting', async () => {
      const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 })
      const fastFetch = vi.fn(async () => {
        // Simulate small network delay
        await new Promise(r => setTimeout(r, 20))
        return mockResponse
      })
      vi.stubGlobal('fetch', fastFetch)

      const fetchGuard = createFetchWithTimeout(2500)
      const response = await fetchGuard('https://test-project.supabase.co/rest/v1/health')

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual({ ok: true })
    })
  })

  // =========================================================================
  // TEST E — PUBLIC ROUTE (No redirect loop, guest pass-through)
  // =========================================================================
  describe('TEST E — Public Route Resilience', () => {
    it('allows guest access to landing page when user is null', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/')
      const response = await updateSession(request)

      // Public route returns 200 pass-through, no redirect loop
      expect(response.status).toBe(200)
      expect(response.headers.get('location')).toBeNull()
    })

    it('cleans corrupt auth tokens on public route but does not redirect away', async () => {
      mockGetUser.mockRejectedValue(new Error('Invalid Refresh Token'))

      const request = new NextRequest('http://localhost:3000/', {
        headers: {
          cookie: 'sb-test-auth-token=corrupt',
        },
      })

      const response = await updateSession(request)

      // Stays on public page
      expect(response.status).toBe(200)
      expect(response.headers.get('location')).toBeNull()

      // But clears the corrupt cookie so it doesn't break future requests
      const setCookie = response.headers.get('set-cookie') || ''
      expect(setCookie).toContain('sb-test-auth-token=;')
    })
  })

  // =========================================================================
  // TEST F — ABORT SIGNAL PRESERVATION & DISTINCTION
  // =========================================================================
  describe('TEST F — Caller AbortSignal Preservation', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('respects caller-owned cancellation and does not label it as a timeout', async () => {
      const callerController = new AbortController()

      const hangingFetch = vi.fn(
        (_url: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
          return new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
              const err = new Error('Caller cancelled operation')
              err.name = 'AbortError'
              reject(err)
            })
          })
        }
      )

      vi.stubGlobal('fetch', hangingFetch)

      const fetchGuard = createFetchWithTimeout(2500)

      // Start request with caller signal
      const requestPromise = fetchGuard('https://test-project.supabase.co/rest/v1/data', {
        signal: callerController.signal,
      })

      // Caller aborts after 30ms (well before the 2500ms timeout)
      setTimeout(() => {
        callerController.abort(new Error('User closed tab'))
      }, 30)

      let caughtError: unknown
      try {
        await requestPromise
      } catch (err) {
        caughtError = err
      }

      // Must preserve caller error, NOT convert to SupabaseTimeoutError
      expect(caughtError).not.toBeInstanceOf(SupabaseTimeoutError)
      expect(isTimeoutError(caughtError)).toBe(false)
    })
  })

  // =========================================================================
  // TEST G — ERROR NORMALIZATION
  // =========================================================================
  describe('TEST G — Error Normalization', () => {
    it('normalizes timeout errors to friendly Indonesian message', () => {
      const timeoutErr = new SupabaseTimeoutError(2500)
      expect(categorizeError(timeoutErr)).toBe('timeout')
      expect(isTimeoutError(timeoutErr)).toBe(true)
      expect(getNormalizedErrorMessage(timeoutErr)).toBe(
        'Koneksi ke server sedang lambat. Silakan coba lagi.'
      )
    })

    it('normalizes DNS / network disconnects to friendly Indonesian message', () => {
      const dnsError = new Error('getaddrinfo ENOTFOUND abc.supabase.co')
      expect(isNetworkError(dnsError)).toBe(true)
      expect(getNormalizedErrorMessage(dnsError)).toBe(
        'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.'
      )
    })

    it('normalizes expired session errors to friendly Indonesian message', () => {
      const authErr = new Error('Invalid Refresh Token: Refresh Token Not Found')
      expect(isAuthError(authErr)).toBe(true)
      expect(getNormalizedErrorMessage(authErr)).toBe(
        'Sesi Anda telah berakhir. Silakan masuk kembali.'
      )
    })

    it('never exposes raw stack traces, tokens, or technical codes to user', () => {
      const rawError = {
        name: 'AuthApiError',
        message: 'invalid_grant: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0',
        status: 401,
      }
      const message = getNormalizedErrorMessage(rawError)
      expect(message).toBe('Sesi Anda telah berakhir. Silakan masuk kembali.')
      expect(message).not.toContain('eyJ')
      expect(message).not.toContain('invalid_grant')
      expect(message).not.toContain('401')
    })
  })
})
