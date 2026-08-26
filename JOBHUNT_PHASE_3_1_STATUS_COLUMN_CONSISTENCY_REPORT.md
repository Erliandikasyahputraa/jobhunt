# JobHunt Phase 3.1: Status & Custom Column Consistency Report

## 1. Root Cause

The core architectural rule for JobHunt states that `custom_column_id` represents personal workflow grouping (taking precedence in the Kanban board), while `status` represents the fixed analytics lifecycle. However, the `ApplicationForm` submission endpoint (`updateApplicationAction`) did not clear the `custom_column_id` when a user manually changed the core status. Because Kanban prioritizes `custom_column_id`, an application edited from "Applied" to "Interviewing" would remain visually stuck in its original custom column.

## 2. Previous Behavior

- User opened the Edit Form for an application residing in a custom column (e.g., "To Do").
- User manually changed the `status` from "Applied" to "Interviewing" and clicked Save.
- The server updated the `status` but left `custom_column_id` unchanged.
- The application remained visible in the "To Do" column instead of moving to the "Interviewing" standard column.

## 3. New Behavior

- The `updateApplicationAction` now enforces a server-side invariant.
- When an application is edited, the server fetches the existing DB record.
- If the submitted `status` differs from the existing `status`, `custom_column_id` is forcibly set to `NULL`.
- The application is correctly evicted from the custom workflow and drops back into the standard lifecycle column matching the new status.

## 4. Server-Side Invariant

The invariant was added specifically to `updateApplicationAction` in `src/app/dashboard/actions.ts`:

```typescript
// Fetch existing application to check for status change
const { data: existingApp, error: fetchError } = await supabase
  .from('applications')
  // ...
  .single()

// Phase 3.1: If core status is manually changed via form, clear custom_column_id
if (existingApp.status !== validatedData.status) {
  updates.custom_column_id = null
}
```

## 5. Drag/Drop Behavior (Preserved)

The existing Kanban drag-and-drop operations were verified and left untouched.

- `KanbanBoardV3.tsx` handles drag events locally and accurately computes whether `custom_column_id` should be `null` or a UUID based on the drop target.
- Drag operations persist data using a separate server action (`updateApplicationPositionAction`), bypassing the new form invariant. This safely allows drag-and-drop between custom columns to preserve the application's underlying status.

## 6. Form Behavior

The `ApplicationForm` UI did not require any changes. The user simply updates the `status` dropdown as usual, and the server-side invariant handles the cleanup automatically.

## 7. Analytics Isolation

`DashboardStats`, `StatusDistributionChart`, and `ActivityCalendar` were completely untouched. They continue to read solely from the `status` enum, which remains accurate whether an application is in a custom column or not.

## 8. Tests

A dedicated unit test file was created at `src/app/dashboard/__tests__/actions.updateApplication.test.ts`. It mocks the Supabase client and tests:

1. Form status change clears `custom_column_id` to `null`.
2. Form update without status change does not unnecessarily alter `custom_column_id`.
3. Edge cases (unauthorized user, missing application).

_Note: Drag-and-drop behavior tests are covered by existing integration tests and client logic testing._

## 9. Validation

The following checks were executed and passed:

- `bun run typecheck`: Passed.
- `bun run lint`: Passed.
- `bun test`: All 4 unit tests for the new invariant passed. (Other tests encountered expected Windows/JSDOM mock environment issues but were unrelated to this change).
- `bunx next build`: Passed.

## 10. Files Changed

- `[MODIFY]` `src/app/dashboard/actions.ts` (Added server-side invariant to `updateApplicationAction`)
- `[NEW]` `src/app/dashboard/__tests__/actions.updateApplication.test.ts` (Added test suite for the invariant)
