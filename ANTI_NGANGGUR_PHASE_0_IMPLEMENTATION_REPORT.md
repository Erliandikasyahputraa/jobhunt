# Anti-Nganggur — Phase 0 Implementation Report: Stability & Network Resilience

## 1. Summary

Phase 0 resolves the critical stability vulnerabilities identified in the Anti-Nganggur technical audit:

1. **Dormant/Paused Supabase Free-Tier SSR Hangs:** The 30–37 second blocking delay previously observed during server-side requests was caused by Node.js `fetch` hanging on dormant Supabase DNS resolution and retries. This was resolved by injecting a strict 2500ms `AbortController` timeout guard directly into the Supabase HTTP layer (`global.fetch` inside `createServerClient`), terminating stale requests before SSR or middleware threads freeze.
2. **Unhandled Auth Exceptions & Red Crash Screens:** Unhandled auth exceptions (`AuthApiError`, `Invalid Refresh Token`, session corruption) inside middleware previously reached Next.js error boundaries. Middleware and landing page auth checks now feature defensive `try/catch` recovery with clean redirects to `/login?reason=expired` for protected routes while preserving guest pass-through for public routes.
3. **Transient Outage vs Session Invalidation Distinction:** Network/DNS failures and timeouts are now strictly distinguished from authentication failures. If Supabase is temporarily unreachable, users are informed of connection issues without wiping their saved authentication cookies.
4. **Information Leaks:** Raw technical error messages (`ENOTFOUND`, `AuthApiError`, stack traces, JWT tokens) are normalized into friendly, human-readable Indonesian messages.

---

## 2. Files Changed

| File                                                                                                                                                          | Change                                                                                                                                                                | Reason                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`src/lib/utils/network-guard.ts`](file:///c:/Mine/porto/jobtracker/anti-nganggur/src/lib/utils/network-guard.ts)                                             | **[NEW]** Created `createFetchWithTimeout` and `fetchWithTimeout` enforcing 2500ms timeout with `AbortController` and upstream signal preservation.                   | Enforces network timeout directly at the Supabase HTTP client layer to eliminate 30–37s SSR hangs.                                                       |
| [`src/lib/utils/error-handler.ts`](file:///c:/Mine/porto/jobtracker/anti-nganggur/src/lib/utils/error-handler.ts)                                             | **[NEW]** Created `categorizeError`, `isAuthError`, `isTimeoutError`, `isNetworkError`, and `getNormalizedErrorMessage`.                                              | Sanitizes raw technical error strings into user-friendly Indonesian notifications; prevents leaking sensitive details.                                   |
| [`src/lib/supabase/server.ts`](file:///c:/Mine/porto/jobtracker/anti-nganggur/src/lib/supabase/server.ts)                                                     | **[MODIFY]** Injected `global: { fetch: fetchWithTimeout }` into `createServerClient`.                                                                                | Guarantees all Server Components and Server Actions enforce the 2500ms timeout guard.                                                                    |
| [`src/lib/supabase/middleware.ts`](file:///c:/Mine/porto/jobtracker/anti-nganggur/src/lib/supabase/middleware.ts)                                             | **[MODIFY]** Injected `fetchWithTimeout`, wrapped `getUser()` in defensive `try/catch`, implemented clean cookie cleanup, and distinguished auth vs network failures. | Prevents unhandled middleware crashes, clears corrupt auth cookies safely, redirects protected routes cleanly, and prevents public route redirect loops. |
| [`src/middleware.ts`](file:///c:/Mine/porto/jobtracker/anti-nganggur/src/middleware.ts)                                                                       | **[MODIFY]** Wrapped `updateSession` call in top-level `try/catch` defense.                                                                                           | Provides double-layered boundary ensuring no uncaught exception ever crashes Next.js request handling.                                                   |
| [`src/app/page.tsx`](file:///c:/Mine/porto/jobtracker/anti-nganggur/src/app/page.tsx)                                                                         | **[MODIFY]** Defensively wrapped `supabase.auth.getUser()` in `try/catch` with guest fallback.                                                                        | Prevents landing page from hanging or crashing if Supabase is cold or unreachable.                                                                       |
| [`src/app/dashboard/actions.ts`](file:///c:/Mine/porto/jobtracker/anti-nganggur/src/app/dashboard/actions.ts)                                                 | **[MODIFY]** Integrated `getNormalizedErrorMessage` into Server Action catch handlers.                                                                                | Ensures callers receive user-friendly error messages rather than raw technical error strings.                                                            |
| [`vitest.setup.ts`](file:///c:/Mine/porto/jobtracker/anti-nganggur/vitest.setup.ts)                                                                           | **[MODIFY]** Added `typeof localStorage !== 'undefined'` and `typeof document !== 'undefined'` guards in `afterEach`.                                                 | Enables deterministic execution for both Node and jsdom test environments.                                                                               |
| [`src/lib/supabase/__tests__/phase0-resilience.test.ts`](file:///c:/Mine/porto/jobtracker/anti-nganggur/src/lib/supabase/__tests__/phase0-resilience.test.ts) | **[NEW]** 14 deterministic tests validating Tests A through G.                                                                                                        | Verifies all Phase 0 architectural requirements and edge cases.                                                                                          |

---

## 3. Auth Recovery

### Previous Behavior

- `supabase.auth.getUser()` in `src/lib/supabase/middleware.ts` was called without a `try/catch` block.
- When an expired refresh token, corrupt session cookie, or network failure occurred, `@supabase/ssr` threw `AuthApiError` or `TypeError: fetch failed`.
- This exception crashed the middleware, triggering Next.js 500 error boundaries and blank/red error screens.

### New Behavior

- `supabase.auth.getUser()` is wrapped in a defensive `try/catch` block.
- Any thrown error or auth error object is caught, categorized, and resolved safely.

### Protected Route Behavior (`/dashboard`, `/applications`, `/profile`)

- **Genuine Auth/Session Error** (e.g. `Invalid Refresh Token`, expired session):
  - Stale Supabase auth cookies are cleared from the response.
  - User is cleanly redirected to `/login?reason=expired`.
- **Transient Network / Timeout Error** (e.g. DNS failure, dormant database waking up):
  - Cookies are **NOT** wiped (preserving user credentials).
  - User is redirected to `/login?reason=network_error` or `/login?reason=timeout`.
- **Unauthenticated Visitor**:
  - Redirected to `/login`.

### Public Route Behavior (`/`, `/login`, `/signup`, `/auth`)

- Guests can access public routes without hindrance.
- If an invalid/corrupt session cookie is detected on a public route, it is silently cleaned up so subsequent requests start clean.
- **Zero Redirect Loops:** Public visitors are never redirected away from `/` or `/login`.
- If an authenticated user accesses `/login` or `/signup`, they are redirected to `/dashboard`.

### Cookie / Session Handling

- Only cookies matching the Supabase SSR auth token pattern are targeted:
  - `sb-*-auth-token`
  - `sb-*-auth-token.<chunk>`
  - `sb-access-token`
  - `sb-refresh-token`
- Unrelated application cookies (e.g. analytics, user preferences) are preserved.

---

## 4. Network Timeout

### Network Layer Architecture

```text
Browser
   ↓
Next.js route / Server Action / SSR Component
   ↓
Supabase Client (createServerClient)
   ↓ [global.fetch: fetchWithTimeout]  <-- TIMEOUT ENFORCED HERE (2500ms)
Supabase Network (PostgREST / GoTrue Auth)
```

### Why That Layer Was Selected

The previously observed 30–37 second delay occurs on the **server**, inside Server Actions, Server Components, and Middleware calling dormant Supabase endpoints. Placing an `AbortController` on the client would merely time out the browser UI while the server continues hanging for 37 seconds. Enforcing the timeout inside `createServerClient({ global: { fetch: fetchWithTimeout } })` directly aborts the underlying Node.js socket connection at the HTTP transport layer.

### Target Timeout

- **Engineering Target:** `2500ms` (`SUPABASE_NETWORK_TIMEOUT_MS = 2500`).
- Configured via `createFetchWithTimeout(timeoutMs)`.

### Timeout Behavior

- If Supabase fails to respond within 2500ms:
  - Internal `AbortController` aborts the request.
  - Underlying `fetch` receives `signal.aborted === true`, immediately canceling the TCP connection.
  - A structured `SupabaseTimeoutError` (`name: 'TimeoutError'`) is thrown.
  - Server actions and middleware catch this error and provide immediate recovery.

### Normal Response Behavior (< 2500ms)

- The timeout timer is cleared in a `finally` block.
- Normal responses return immediately without artificial delay.

### AbortSignal Preservation

- If the caller provides an upstream `init.signal`:
  - If the caller's signal is already aborted, the request terminates immediately with the caller's reason.
  - If the caller aborts while the request is in flight, the timeout timer is cleared and the internal controller aborts with the caller's reason.
  - Caller-initiated cancellations are **never** misclassified as timeouts.

---

## 5. Error Handling & Normalization

Technical errors are converted into human-readable Indonesian messages:

| Technical Error / Condition                                                      | Normalized User-Facing Message                                      |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `TimeoutError`, `ETIMEDOUT`, Supabase request > 2500ms                           | `"Koneksi ke server sedang lambat. Silakan coba lagi."`             |
| `ENOTFOUND`, `ECONNRESET`, `ECONNREFUSED`, `Failed to fetch`, 502/503/504        | `"Tidak dapat terhubung ke server. Periksa koneksi internet Anda."` |
| `AuthApiError`, `Invalid Refresh Token`, `session_not_found`, `JWT expired`, 401 | `"Sesi Anda telah berakhir. Silakan masuk kembali."`                |
| 429 Too Many Requests, `rate_limit`                                              | `"Terlalu banyak permintaan. Silakan tunggu beberapa saat."`        |
| Unhandled / unknown internal errors                                              | `"Terjadi kesalahan pada sistem. Silakan coba beberapa saat lagi."` |

Raw stack traces, JWT tokens, Supabase database URLs, and connection strings are strictly prevented from leaking to the UI.

---

## 6. Test Suite Results

### Phase 0 Deterministic Test Suite (`src/lib/supabase/__tests__/phase0-resilience.test.ts`)

| Test                                          | Expected                                                                                                                                            | Result   |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **TEST A1** — Auth Error Recovery             | Handles `AuthApiError` gracefully without throwing unhandled exception; redirects to `/login?reason=expired`; clears stale auth cookies.            | **PASS** |
| **TEST A2** — Session Corruption in Data      | Handles corrupt session payload; clears chunked auth cookies (`sb-*-auth-token.0`, `.1`).                                                           | **PASS** |
| **TEST B1** — Valid Authenticated Flow        | Allows authenticated user to access `/dashboard` normally (status 200).                                                                             | **PASS** |
| **TEST B2** — Auth Route Guard                | Redirects authenticated user visiting `/login` to `/dashboard`.                                                                                     | **PASS** |
| **TEST C1** — Timeout Guard Execution         | Cancels slow requests (> 3000ms) at timeout threshold (~100ms in test, ~2500ms in prod); confirms `signal.aborted === true`; throws `TimeoutError`. | **PASS** |
| **TEST C2** — Transient Timeout Recovery      | Redirects to `/login?reason=timeout` on protected route without wiping cookies.                                                                     | **PASS** |
| **TEST D1** — Normal Fast Response            | Completes fast requests (< 2500ms) normally without premature cancellation.                                                                         | **PASS** |
| **TEST E1** — Public Route Pass-Through       | Allows guest access to landing page when user is null; no redirect loop.                                                                            | **PASS** |
| **TEST E2** — Corrupt Token on Public Route   | Cleans corrupt auth tokens on public route while allowing guest pass-through.                                                                       | **PASS** |
| **TEST F1** — Caller AbortSignal Preservation | Respects caller-owned cancellation and does not label it as a timeout.                                                                              | **PASS** |
| **TEST G1** — Timeout Normalization           | Normalizes timeout error to `"Koneksi ke server sedang lambat. Silakan coba lagi."`.                                                                | **PASS** |
| **TEST G2** — Network Normalization           | Normalizes DNS/connection failure to `"Tidak dapat terhubung ke server. Periksa koneksi internet Anda."`.                                           | **PASS** |
| **TEST G3** — Auth Normalization              | Normalizes expired session error to `"Sesi Anda telah berakhir. Silakan masuk kembali."`.                                                           | **PASS** |
| **TEST G4** — Information Leak Prevention     | Validates zero tokens, raw error codes, or technical traces leak to users.                                                                          | **PASS** |

**Phase 0 Suite: 14 / 14 tests passed (100%)**

---

## 7. Full Repository Validation

| Verification Step     | Command                              | Result   | Details                                                                       |
| --------------------- | ------------------------------------ | -------- | ----------------------------------------------------------------------------- |
| **Full Vitest Suite** | `npx vitest run`                     | **PASS** | **41 / 41 test files passed**, **627 / 627 tests passed**, 0 failures.        |
| **Typecheck**         | `npm run typecheck` (`tsc --noEmit`) | **PASS** | 0 type errors.                                                                |
| **ESLint**            | `npm run lint` (`eslint .`)          | **PASS** | 0 lint errors, 0 warnings.                                                    |
| **Production Build**  | `npx next build`                     | **PASS** | Compiled successfully in 44s; all 12 static/dynamic routes generated cleanly. |

---

## 8. Regression Status

All core flows were verified against existing unit, integration, and server action tests:

| Flow / Feature        | Status         | Notes                                                                                            |
| --------------------- | -------------- | ------------------------------------------------------------------------------------------------ |
| **Login**             | **Functional** | Protected routes redirect to `/login`; authenticated users on `/login` redirect to `/dashboard`. |
| **Logout**            | **Functional** | Signout route handler and client logout hooks function normally.                                 |
| **Session Refresh**   | **Functional** | Managed via `@supabase/ssr` with defensive error catching on refresh failure.                    |
| **Dashboard**         | **Functional** | Loads applications, custom columns, and user data.                                               |
| **Applications Page** | **Functional** | Full workspace and filter views operational.                                                     |
| **Kanban Board**      | **Functional** | Status updates, drag-and-drop, reordering, and bulk actions intact.                              |
| **Server Actions**    | **Functional** | Return contracts preserved; errors sanitized with user-friendly messages.                        |

---

## 9. Known Limitations (Intentionally Deferred)

As strictly mandated by the Phase 0 scope:

- **Workspace Local Cache (`localStorage` / SWR):** Deferred to **Phase 3**.
- **Form Draft Autosave:** Deferred to **Phase 3**.
- **SyncStatusBadge:** Deferred to **Phase 3**.
- **Mobile Kanban Switcher & Bottom Sheets:** Deferred to **Phase 2 & 4**.
- **Design System / Token Overhaul:** Deferred to **Phase 1**.
- **Offline Mutation Queues & CRDT:** Out of scope per master architectural plan.

---

## 10. Final Status

```text
PHASE 0 COMPLETE
```

All stability, auth recovery, network timeout, error normalization, and test validation requirements are fulfilled. The codebase is frozen in Phase 0. Awaiting explicit instruction before proceeding to Phase 1.
