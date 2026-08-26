# JOBHUNT PHASE 3.4.1 URL-PERSISTED VIEW STATE AUDIT

## 1. Current Filter State Architecture

Currently, the `ApplicationsPage` component (`src/app/applications/page.tsx`) maintains filter and sort state entirely in local React state via `useState<FilterState>`.

- **Volatile:** The state resets on page reload.
- **Client-Side Only:** Changes instantly derive a `processedApplications` list via a `useMemo` block.

## 2. Current Applications Page Architecture

The page is a Client Component (`'use client'`). It fetches initial data (applications, columns, auth) in a `useEffect` using Server Actions. It does not currently interact with the URL, routing, or search parameters.

## 3. SearchParams Usage

The page is **not** currently using `searchParams` or `useSearchParams`.

## 4. Next.js 15 Synchronization Approach

To safely synchronize state in the App Router:

- **Read:** Use `useSearchParams()` from `next/navigation` to compute the initial `filters` object.
- **Write:** Use `useRouter().replace` (or `push`) with `{ scroll: false }` to update the URL without scrolling to the top.
- **Suspense Boundary:** Because `useSearchParams` de-opts static generation, Next.js requires any Client Component using it to be wrapped in a `<Suspense>` boundary. We will refactor `ApplicationsPage` to wrap an inner `ApplicationsPageContent` component with `<Suspense>`.

## 5. Hydration Risks

If we don't wrap the component in `<Suspense>`, Next.js may attempt to statically generate the page without knowledge of the URL parameters, leading to a hydration mismatch when the client tries to render the parameterized view. The `<Suspense>` wrap forces the client to handle the search params properly.

## 6. Browser Back/Forward Behavior

- If we use `router.push`, every single checkbox toggle adds a history entry. This breaks the back button UX.
- **Strategy:** We will use `router.replace()` for all filter and search updates. This updates the URL in place so the user can copy/bookmark it, but the back button will take them back to the _previous page_ (e.g., the dashboard), not the previous filter tick.

## 7. Multi-select Serialization

Arrays (`statusFilters`, `customColumnFilters`) will be serialized using multiple keys.

- **URL Format:** `?status=applied&status=interviewing`
- **Parsing:** `searchParams.getAll('status')` automatically returns `['applied', 'interviewing']`.

## 8. Date and Sort Serialization

Single string values will use standard key-value pairs.

- **URL Format:** `?date=30d&sort=company_az`
- **Parsing:** `searchParams.get('date')`
- **Cleanup:** If the value matches the default (e.g., `sort=manual`, `date=all`), we will omit it from the URL to keep the link clean.

## 9. Search Query Persistence

The search query will be persisted (`?q=google`), but updating `router.replace` on every keystroke can cause input lag.

- **Strategy:** We will maintain the search input in local state for instantaneous typing, and apply a 300ms debounce before pushing the change to the URL. When initializing, we read the URL query into the local state.

## 10. Invalid Parameter Handling

Users might manually alter the URL to `?status=invalid_status`.

- **Validation:** When parsing `useSearchParams()`, we will check if the strings exist within our typed enums/arrays (`ApplicationStatus`, `SortOption`). Invalid values will be ignored and gracefully fall back to the defaults.

## 11. Preserving Existing Behavior

The existing UI components (`ApplicationsToolbar`, `FilterChips`, `KanbanBoardV3`) expect a `filters` object and emit change events. We do not need to refactor these components. We only need to intercept their change handlers in `page.tsx` to update the URL instead of (or alongside) a local `setFilters` call.

==================================================
PHASE 3.4.1 URL STATE AUDIT COMPLETE
