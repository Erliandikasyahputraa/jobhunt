# JOBHUNT PHASE 3.4.1 CUSTOM URL VALIDATION AUDIT

## Finding Classification

**P1 (Existing Correctness Issue)**

## Read-Only Inspection Findings

### 1. Where `customColumnFilters` are parsed

They are parsed immediately during the initial `useState` lazy initialization from `searchParams.getAll('custom')`. There is no validation here because the custom columns have not yet loaded.

### 2. Where custom columns are loaded

Custom columns are loaded asynchronously via `getCustomColumnsAction()` within the `loadData` `useEffect` on mount.

### 3. Validation against loaded custom columns

**Validation does not occur.** The implementation blindly trusts the URL string and never cross-references the loaded `customColumns` array against `filters.customColumnFilters`.

### 4. Behavior with `?custom=nonexistent-id`

The nonexistent ID is injected into `filters.customColumnFilters`. The Kanban board attempts to filter by this ID. Because no application has this ID, 0 applications are shown. The invalid ID remains in the URL and local state until the user clears it.

### 5. Behavior with `?custom=valid-id`

The valid ID is injected into `filters.customColumnFilters`. When the custom columns and applications load, it filters correctly.

### 6. Loading Timing

The URL parameters are parsed instantly on the server/initial client hydration. The actual column metadata resolves a few hundred milliseconds later via Supabase.

### 7. Risk of discarding valid URLs prematurely

There is **no risk** of discarding valid URLs prematurely, because the implementation never discards anything at all.

### 8. Invalid IDs in React State

Invalid IDs **remain permanently** in `filters.customColumnFilters` React state.

### 9. Invalid IDs in URL

Invalid IDs **remain permanently** in the browser URL.

### 10. Requirement Violation

This **violates** the original Phase 3.4.1 requirement which explicitly stated:

> "Invalid custom column IDs must be ignored if they do not correspond to currently loaded custom columns... Design the initialization so asynchronously loaded custom columns can validate the URL correctly."

---

## Smallest Safe Correction

We need a targeted `useEffect` that fires only after the initial data fetch completes (`isLoading` goes from `true` to `false`). It will check if any active custom filters are invalid against the newly loaded `customColumns`. If invalid filters exist, it strips them from local state and silently rewrites the URL.

```tsx
React.useEffect(() => {
  // Only validate after initial data load is complete
  if (isLoading) return

  const validIds = new Set(customColumns.map(c => c.id))
  validIds.add('none') // 'none' is a valid hardcoded filter

  const hasInvalid = filters.customColumnFilters.some(id => !validIds.has(id))

  if (hasInvalid) {
    const validFilters = filters.customColumnFilters.filter(id => validIds.has(id))
    const nextFilters = { ...filters, customColumnFilters: validFilters }
    setFilters(nextFilters)
    updateUrl(nextFilters)
  }
}, [isLoading, customColumns, filters.customColumnFilters, filters, updateUrl])
```

This perfectly satisfies the requirement without accidentally deleting valid IDs before the Supabase fetch resolves.
