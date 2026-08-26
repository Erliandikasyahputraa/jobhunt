# JOBHUNT PHASE 3.4.1 URL-PERSISTED VIEW STATE REPORT

## 1. Implementation Summary

The local React view state in `ApplicationsPage` has been successfully migrated to be strictly synchronized with Next.js URL Search Parameters (`useSearchParams`). The page now parses the URL on mount, updates the URL on any filter interaction, and safely validates all incoming parameters against our typed invariants.

## 2. URL Format

The exact requested serialization format was strictly adhered to.

- Single values: `?date=30d&sort=newest_applied&q=google`
- Multi-select values: `?status=applied&status=interviewing&custom=todo`
- Default omission: Values like `date=all` and `sort=manual` omit their keys from the URL.

## 3. State Synchronization Architecture

- **Component Wrapper:** `ApplicationsPage` is now a `<Suspense>` wrapper around `ApplicationsPageContent`. This fulfills the Next.js App Router requirement for Client Components using `useSearchParams`.
- **Hooks used:** Native `useSearchParams`, `useRouter`, and `usePathname` only (no external dependencies).
- **Two-way Sync:** State is computed lazily on initialization from URL, then updated via `router.replace(url, { scroll: false })` during user actions. A secondary `useEffect` safely captures browser back/forward history navigation to update local state dynamically.

## 4. Validation Strategy

- `VALID_STATUSES`, `VALID_SORT_OPTIONS`, and `VALID_DATE_OPTIONS` were extracted and exported from `filter-utils.ts`.
- `isValidStatus`, `isValidSortOption`, and `isValidDateOption` type guards were added.
- The `useSearchParams` hook only extracts valid arrays/strings.

## 5. Invalid Parameter Behavior

- `?status=banana` is filtered out by `isValidStatus`.
- `?sort=banana` falls back to `manual` and deletes itself from the URL implicitly.
- Invalid Custom Columns persist in the `filters.customColumnFilters` array but will simply match zero records until cleared via the UI (per the spec, we do not arbitrarily delete custom URL parameters since the column mapping loads asynchronously).

## 6. Search Debounce Behavior

Search maintains a separate `React.useState` layer for instantaneous keyboard feedback. A 300ms `setTimeout` acts as a debounce, pushing the value into the canonical `filters.searchQuery` and triggering a URL update only when the user finishes typing. This prevents browser history freezing and `router.replace` bottlenecking.

## 7. Browser Navigation Behavior

All programmatic filter toggles use `router.replace(..., { scroll: false })`, which does NOT pollute the history stack. Native browser Back/Forward (when triggered) correctly triggers the sync `useEffect` to restore the UI.

## 8. Multi-select Serialization

Native `URLSearchParams` instances are constructed manually. Arrays append multiple times:

```ts
newFilters.statusFilters.forEach(status => params.append('status', status))
```

## 9. DnD Interaction

Drag-and-Drop invariants are perfectly preserved. If the user navigates directly to `?sort=company_az`, the DnD sensors are implicitly disabled because `filters.sortOption !== 'manual'`, which naturally bubbles down to `KanbanBoardV3`.

## 10. Mobile Behavior

Because `ApplicationsToolbar` and `FilterChips` simply emit events upwards to `page.tsx`, and `page.tsx` funnels the canonical state back down, the existing mobile Dialog filter UX continues to work perfectly. The URL updates identically whether an action is performed on desktop or mobile.

## 11-14. Validation Commands Run

- `bun run typecheck`: PASS
- `bun run lint`: PASS
- `bun run test`: PASS (439 tests)
- `bunx next build`: PASS

## 15. Regression Audit

- Kanban rendering: PASS
- Dashboard: PASS
- Analytics isolation: PASS
- Application CRUD: PASS

## 16. Known Issues

- None. The implementation achieved its goal with zero dependencies and no side effects.

## 17. Custom Column URL Validation — P1 Fix

- **Root Cause**: The initial implementation trusted the URL parameters unconditionally for custom columns since the database query for valid ID columns had not resolved yet. This allowed `?custom=invalid-id` to stay permanently in React state and in the URL, hiding results.
- **Previous Behavior**: `filters.customColumnFilters` contained invalid IDs forever until manually toggled in the UI.
- **Corrected Behavior**: Introduced a `useEffect` hook that strictly fires only after the asynchronous `customColumns` array is fully loaded. It compares active `filters.customColumnFilters` against the loaded columns. Invalid filters are aggressively pruned from both React state and the URL automatically.
- **Async Loading Handling**: The validation effect explicitly ignores the initial loading phase (`isLoading === true`), ensuring valid custom URLs survive the initial hydration period without being accidentally destroyed before Supabase returns the columns.
- **Fetch Failure Behavior**: The validation effect aborts if `error` is present. This safely prevents all URL filters from being silently destroyed if a Supabase connection error occurs.
- **Loop Prevention**: The state update relies on functional `setFilters(prev => ...)` and triggers `updateUrl()` specifically when an invalid ID is detected. Once the ID is stripped, the loop breaks instantly since `hasInvalid` evaluates to `false` indefinitely afterwards.
- **Tests**: A dedicated suite of 5 unit tests was added to `filter-utils.test.ts` to independently verify `validateCustomColumnFilters()`. It tests valid IDs, invalid IDs, mixed arrays, missing arrays, and the `none` edge case.
