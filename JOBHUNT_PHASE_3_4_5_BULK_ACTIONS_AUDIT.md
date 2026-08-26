# JOBHUNT PHASE 3.4.5 — BULK ACTIONS AUDIT & ARCHITECTURE PLAN

**Status**: READ-ONLY AUDIT & ARCHITECTURAL SPECIFICATION  
**Branch**: `feat/analytics-dashboard`  
**Date**: 2026-08-26  
**Scope**: Batch application mutations (Bulk Delete, Bulk Change Status, Bulk Move to Custom Column)

---

## 1. Current Architecture

The JobHunt application currently operates as a client-side Kanban pipeline (`src/app/applications/page.tsx`) powered by Next.js App Router and Supabase Postgres/Storage.

- **Pipeline Data Flow**: Authenticated user session -> `getApplicationsAction()` & `getCustomColumnsAction()` -> local React state (`applications`, `customColumns`).
- **Processing Layer**: `processedApplications` is derived via `filterApplications(applications, filters)` (`filter-utils.ts`), applying active search queries, core status filters, custom column filters, date ranges, and sorting preferences.
- **Kanban Board**: `KanbanBoardV3.tsx` renders default columns (`wishlist`, `applied`, `interview` with sub-stages, `offers`, `closed`) and dynamic user-created custom columns.
- **Modals & Cards**: Individual card interactions open `ApplicationDetail` for editing, deleting, managing private documents, and linking private company profiles.

---

## 2. Existing Mutation Architecture

Existing single-record mutations are routed through Server Actions in `src/app/dashboard/actions.ts` calling underlying API helpers in `src/lib/api/applications.ts`:

1. `createApplicationAction(formData)`: Validates via Zod, calculates highest position, inserts into `applications`, revalidates paths.
2. `updateApplicationAction(id, formData)`: Verifies user ownership, checks previous status to nullify `custom_column_id` if status changes (Phase 3.1 invariant), updates row, revalidates paths.
3. `deleteApplicationAction(id)`: Verifies user ownership, deletes row from `applications`, revalidates paths.
4. `updateApplicationPositionAction(id, position, status, customColumnId)`: Updates position and optional column placement during drag-and-drop.
5. `reorderApplicationsAction(updates)`: Bulk reorders application position indices in parallel via `Promise.all` using `.eq('id', id).eq('user_id', userId)`.

All mutations use `@/lib/supabase/server` client and enforce row-level security and explicit user scoping.

---

## 3. Authentication & Ownership Analysis

- **Authentication Context**: Every Server Action begins by invoking `supabase.auth.getUser()`. Unauthenticated requests throw `Unauthorized` immediately.
- **Multi-Tenant Isolation**: Every database query and mutation explicitly matches `user_id = user.id` in addition to Postgres RLS policies:
  ```sql
  CREATE POLICY "Users can manage their own applications"
    ON applications FOR ALL
    USING (auth.uid() = user_id);
  ```
- **Trust Boundary**: Client-provided application IDs are treated as strictly untrusted inputs. Bulk operations must query/mutate strictly with `.eq('user_id', user.id).in('id', applicationIds)` to prevent any cross-user mutation or access.

---

## 4. Selection Architecture

### State Location & Structure

- **Location**: `src/app/applications/page.tsx` (top-level application state).
- **Structure**: `selectedIds: Set<string>` (represented as a React state `Set` for $O(1)$ membership checks during rendering):
  ```tsx
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  ```
- **Rationale**:
  - `ApplicationsToolbar.tsx` requires selection count and bulk action triggers.
  - `KanbanBoardV3.tsx` and `ApplicationCard.tsx` require selection state to render checkboxes and handle card selection toggles.
  - Page-level handlers execute bulk actions and reconcile `applications` state on completion.

### Card Interaction

- Checkbox added to `ApplicationCard.tsx` top-left or adjacent to the drag handle.
- Clicking the checkbox triggers `onToggleSelect(application.id)` with `e.stopPropagation()` to prevent opening `ApplicationDetail` or initiating drag-and-drop.

---

## 5. Select-All Semantics

### Recommended Semantics: Select All Matching Current Filters

- **Behavior**: Clicking "Select All" selects all items currently in `processedApplications` (visible matching items), NOT hidden/filtered-out applications.
- **Rationale**: In a Kanban application with active search or status filters (e.g. searching "Google"), users expect bulk operations to target the subset they are currently viewing. Selecting off-screen filtered-out items is a major data safety hazard ("Hidden Selection Risk").

### Interaction with View Changes

- **When Search / Filter / Sort Changes**: Clear `selectedIds` (or prune IDs no longer in `processedApplications`). Clearing `selectedIds` on filter change is the safest and most predictable pattern to prevent accidental batch mutations on invisible cards.
- **When All Cards Deselected**: Bulk action bar automatically dismisses and returns to the standard `ApplicationsToolbar`.

---

## 6. Bulk Status Design

### Invariant Preservation (Phase 3.1)

- **Core Rule**: `application.status` represents core lifecycle analytics.
- **Invariant**: When moving an application to a core status (e.g., `applied`, `interviewing`, `rejected`), `custom_column_id` MUST be reset to `null`.
- **Implementation**:
  ```ts
  await supabase
    .from('applications')
    .update({
      status: targetStatus,
      custom_column_id: null,
      updated_at: new Date().toISOString(),
    })
    .in('id', targetIds)
    .eq('user_id', user.id)
  ```
- **Analytics Integrity**: Directly updates dashboard conversion metrics and stage counts accurately.

---

## 7. Bulk Custom Column Design

### Custom Column Placement

- **Behavior**: When bulk moving applications to a custom column, `custom_column_id` is updated to the destination `customColumnId`, while `status` is preserved.
- **Special Case ("none")**: Moving to "No Custom Column" sets `custom_column_id = null` while preserving `status`.
- **Security Check**: The destination `customColumnId` must be verified against `custom_columns` for the authenticated `user_id` before execution to prevent foreign ID injection:
  ```ts
  if (customColumnId && customColumnId !== 'none') {
    const { data: validCol } = await supabase
      .from('custom_columns')
      .select('id')
      .eq('id', customColumnId)
      .eq('user_id', user.id)
      .single()
    if (!validCol) throw new Error('Invalid custom column')
  }
  ```

---

## 8. Bulk Delete Design

### Deletion Flow

1. User selects multiple applications.
2. User clicks "Delete Selected" on the bulk toolbar.
3. System opens an `AlertDialog` confirmation showing the exact count: _"Are you sure you want to delete X applications? This action cannot be undone."_
4. On confirmation, server action is invoked.
5. Server action cleans up associated documents from Supabase Storage, then deletes the application rows from Postgres.
6. Server action revalidates `/dashboard` and `/applications`.
7. Client removes deleted IDs from `applications`, clears `selectedIds`, and displays Sonner toast: `"X applications deleted"`.

---

## 9. Document & Storage Deletion Analysis (CRITICAL)

### The Storage Orphan Problem

- **Database Behavior**: `application_documents.application_id` has `ON DELETE CASCADE`. When an application row is deleted, Postgres automatically deletes the `application_documents` metadata rows.
- **Storage Reality**: Supabase Storage is an external S3-compatible object store. Postgres `ON DELETE CASCADE` **DOES NOT** delete physical files from the `jobhunt_documents` bucket.
- **Orphan Risk**: If bulk delete only runs `DELETE FROM applications WHERE id IN (...)`, all uploaded resumes and cover letters for those applications remain permanently orphaned in storage.

### Safe Deletion Strategy

The Server Action for bulk delete must execute document cleanup in the proper sequence:

1. **Query Storage Paths**:
   ```ts
   const { data: docs } = await supabase
     .from('application_documents')
     .select('storage_path')
     .in('application_id', applicationIds)
     .eq('user_id', user.id)
   ```
2. **Remove Storage Objects**:
   ```ts
   if (docs && docs.length > 0) {
     const paths = docs.map(d => d.storage_path)
     await supabase.storage.from('jobhunt_documents').remove(paths)
   }
   ```
3. **Delete Application Rows**:
   ```ts
   await supabase.from('applications').delete().in('id', applicationIds).eq('user_id', user.id)
   ```
   This completely eliminates orphaned storage files safely without requiring Postgres extensions or background workers.

---

## 10. Company Relationship Analysis

- **Relationship**: `applications.company_id` references `companies.id` with `ON DELETE SET NULL`.
- **Bulk Delete Impact**: Deleting applications sets the reference to null without deleting any `companies` rows. Company Research profiles are retained.
- **Bulk Status / Custom Column Impact**: Batch updates to status or custom columns do not touch `company_id`.

---

## 11. Analytics Interaction

- **Dashboard Analytics**: Derived from `applications.status` and `date_applied`.
- **Bulk Status Change**: Directly shifts applications across status buckets on the Dashboard.
- **Bulk Custom Column Change**: Custom columns are presentational only; core analytics remain anchored to `application.status`.
- **Bulk Delete**: Removes applications from totals and stage distributions upon revalidation.

---

## 12. Kanban & DnD Interaction

- **Selection while Dragging**: Checkbox clicks must use `e.stopPropagation()` and `e.preventDefault()` to ensure drag-and-drop sensors (`@dnd-kit/core`) do not interpret a checkbox toggle as a drag start.
- **DnD during In-Flight Bulk Operations**: While a bulk mutation is executing (`isPending = true`), drag-and-drop should be temporarily disabled to prevent race conditions and conflicting position calculations.
- **Card Order after Bulk Move**: When applications are moved to a new column in bulk, they are appended to the end of the destination column with sequential `position` indices.

---

## 13. Optimistic Update Recommendation

### Recommendation: Server-First with In-Flight Toolbar Loading

- **Evaluation**:
  - Optimistic bulk updates across 20+ cards risk complex desynchronization and difficult rollbacks if the network fails or partial storage deletion occurs.
  - Server-first execution provides atomic verification: the bulk action toolbar displays a loading spinner and disables buttons (`isMutating = true`), executes the Server Action, and updates local state upon verified success.
- **Rollback / Error Handling**: If the server action rejects, local state remains untouched, `selectedIds` is preserved, and Sonner displays `"Failed to update applications. Please try again."`.

---

## 14. Partial Failure Strategy

- **Postgres Batch Operations**: `UPDATE applications SET ... WHERE id IN (...) AND user_id = ...` and `DELETE FROM applications WHERE id IN (...) AND user_id = ...` execute as single atomic SQL statements in Postgres.
- **Storage Cleanup Failure**: If storage deletion encounters a network error, the action can log the error and proceed to delete database rows, or reject before DB deletion. Storage deletion via `supabase.storage.remove(paths)` accepts an array and deletes in a single batch API call.

---

## 15. Filter & URL State Interaction

- **URL Persistence**: Phase 3.4.1 stores filters in URL search params (`status`, `custom`, `date`, `sort`, `q`).
- **Selection Isolation**: `selectedIds` must **NOT** be placed in the URL query string.
  - Selection is ephemeral user interaction state.
  - Serializing dozens of UUIDs into URL parameters exceeds standard length limits, bloats history, and degrades bookmarking/sharing semantics.
- **Filter Changes**: When URL filters update, selection is automatically reset to empty.

---

## 16. CSV Export Interaction

- **Current Behavior**: `handleExport` exports all `processedApplications` (filtered view).
- **Bulk Selection Enhancement (Optional)**:
  - If applications are selected, the export button can optionally offer "Export Selected (X)" or continue exporting the current view.
  - Default recommendation for Phase 3.4.5: Keep existing CSV export intact to avoid scope creep and preserve established Phase 3.4.2 tests.

---

## 17. Mobile UX

- **Responsive Contextual Toolbar**:
  - When `selectedIds.size > 0`, the toolbar shifts to a dedicated Bulk Action Bar:
    - Display: `"[X] selected"`
    - Action buttons: "Status", "Column", "Delete", "Cancel" (or icon buttons on mobile).
  - Uses existing Radix `DropdownMenu` for status/column selection and `AlertDialog` / `Dialog` for deletion confirmation.
- **Touch Targets**: Minimum 44x44px touch targets on checkboxes and bulk action buttons.
- **Dependencies**: ZERO new UI dependencies (no external sheet or drawer libraries required).

---

## 18. Performance Strategy

- **Scale Profile**: Personal job tracker ($< 1,000$ applications per user).
- **Operations Complexity**:
  - Selection checks: $O(1)$ using `Set<string>`.
  - Filter / Select All: $O(N)$ with $N \le 500$ ($< 1$ms in JavaScript).
  - Database `.in('id', ids)`: Single indexed query on `PRIMARY KEY (id)`.
- **Max Batch Limit**: Sensible cap of 100 applications per single batch operation for defensive safety.
- **Virtualization**: Not required at this scale; remains deferred to Phase 4.0+.

---

## 19. Dependency Analysis

No new dependencies required. The implementation uses:

- `@radix-ui/react-checkbox` (Already installed in `package.json`)
- `@radix-ui/react-dropdown-menu` (Already installed)
- `@radix-ui/react-dialog` / `alert-dialog` (Already installed)
- `sonner` (Already installed)
- `lucide-react` (Already installed)

---

## 20. Database Impact

- **Schema Changes**: ZERO.
- **New Tables**: NONE.
- **New Migrations**: NONE.
- **Existing Triggers & FKs**: Fully preserved and compatible.

---

## 21. Security Analysis

| Surface                | Threat                                          | Mitigation                                                                                    |
| ---------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Bulk Mutation**      | Modifying other users' applications             | All actions enforce `eq('user_id', user.id)` on `.in('id', ids)`                              |
| **Custom Column Move** | Assigning non-existent or foreign custom column | Destination `custom_column_id` is queried against user's custom columns                       |
| **Bulk Delete**        | Orphaned storage files                          | Server Action queries `application_documents` and removes storage objects before row deletion |
| **Input Injection**    | Invalid UUIDs or status values                  | Validated via Zod / enum types before executing DB operations                                 |

---

## 22. Test Strategy

1. **Selection Unit Tests**:
   - Single item toggle on/off.
   - Multi-item selection.
   - Select All visible / matching filter.
   - Clear selection button.
   - Filter change resets selection.
2. **Server Action Tests**:
   - `bulkDeleteApplicationsAction`: Unauthenticated rejection, cross-user ID rejection, storage object cleanup, DB deletion.
   - `bulkUpdateApplicationStatusAction`: Status update, `custom_column_id` nullification (Phase 3.1 invariant), ownership enforcement.
   - `bulkUpdateApplicationColumnAction`: Custom column update, cross-user column rejection, status preservation.
3. **UI Integration Tests**:
   - Checkbox rendering on `ApplicationCard`.
   - Contextual bulk toolbar appears on selection.
   - Bulk status change triggers action and updates cards.
   - Bulk custom column move triggers action and updates cards.
   - Bulk delete opens confirmation dialog and removes cards on confirm.
   - Sonner toast notifications for success/error.
   - Drag-and-drop disabled while bulk mutation is in progress.

---

## 23. Risk Classification

- **P0 (Catastrophic)**: 0 (Mitigated: Document storage orphan risk solved via batch storage cleanup in server action).
- **P1 (Correctness/Security)**: 0 (Mitigated: Strict user ownership and Phase 3.1 invariant enforced).
- **P2 (Maintainability/UX)**: 1 (Ensuring checkbox click does not conflict with DnD touch gestures on mobile).
- **P3 (Polish)**: 1 (Keyboard accessibility for card checkboxes).

---

## 24. Exact Implementation Plan

### Step 1: Server Actions & API Layer

1. Add `bulkDeleteApplications(supabase, applicationIds)` in `src/lib/api/applications.ts` (with storage cleanup).
2. Add `bulkUpdateApplicationStatus(supabase, applicationIds, status)` in `src/lib/api/applications.ts`.
3. Add `bulkUpdateApplicationCustomColumn(supabase, applicationIds, customColumnId)` in `src/lib/api/applications.ts`.
4. Expose Server Actions in `src/app/dashboard/actions.ts`:
   - `bulkDeleteApplicationsAction(ids: string[])`
   - `bulkUpdateApplicationStatusAction(ids: string[], status: ApplicationStatus)`
   - `bulkUpdateApplicationColumnAction(ids: string[], customColumnId: string | null)`
5. Write unit tests in `src/app/dashboard/__tests__/actions.bulk.test.ts`.

### Step 2: UI & Selection Integration

1. Add `selectedIds`, `onToggleSelect`, and `onSelectAll` state handlers in `src/app/applications/page.tsx`.
2. Add selection checkbox to `src/components/applications/ApplicationCard.tsx`.
3. Create `src/components/applications/BulkActionsToolbar.tsx` (or integrate directly into `ApplicationsToolbar.tsx`).
4. Connect bulk delete confirmation dialog using existing Dialog primitives.
5. Connect Sonner toast feedback for all batch operations.
6. Write UI integration tests in `src/components/applications/__tests__/BulkActions.test.tsx`.
7. Validate full suite (`typecheck`, `lint`, `test`, `next build`).

---

## 25. Recommended File Changes

- `src/lib/api/applications.ts` (New bulk API helpers)
- `src/app/dashboard/actions.ts` (New bulk Server Actions)
- `src/app/applications/page.tsx` (Selection state & bulk handlers)
- `src/components/applications/ApplicationCard.tsx` (Checkbox integration)
- `src/components/applications/ApplicationsToolbar.tsx` (or new `BulkActionsToolbar.tsx`)
- `src/components/applications/KanbanBoardV3.tsx` (Pass selection props to cards)
- `src/app/dashboard/__tests__/actions.bulk.test.ts` (New Server Action tests)
- `src/components/applications/__tests__/BulkActions.test.tsx` (New UI tests)

---

## 26. Explicit Out-of-Scope Features

- Virtualized lists / windowing (Deferred to Phase 4.0+)
- Background job queues / async worker queues
- Real-time multi-user synchronization
- Cross-application document cloning
- Bulk inline editing of salary/job titles
- Undo/redo history stacks
- Multi-page pagination

---

## Implementation Step 1 — Bulk API & Server Actions

**Status**: COMPLETED & VERIFIED  
**Date**: 2026-08-26

### 1. API Functions Added (`src/lib/api/applications.ts`)

- `bulkDeleteApplications(supabase, applicationIds)`: Securely fetches storage paths for attached documents owned by the user, removes objects from `jobhunt_documents` private bucket, then deletes database application rows (which cascades `application_documents` metadata).
- `bulkUpdateApplicationStatus(supabase, applicationIds, status)`: Batch updates `status`, enforces Phase 3.1 invariant by resetting `custom_column_id: null`, and scopes updates to `user_id = auth.uid()`.
- `bulkUpdateApplicationCustomColumn(supabase, applicationIds, customColumnId)`: Verifies ownership of `customColumnId` if non-null, batch updates `custom_column_id` while preserving `status` and other application fields, scoped to `user_id = auth.uid()`.

### 2. Server Actions Added (`src/app/dashboard/actions.ts`)

- `bulkDeleteApplicationsAction(ids: string[])`: Authenticates request, executes `bulkDeleteApplications`, and revalidates `/dashboard` and `/applications`.
- `bulkUpdateApplicationStatusAction(ids: string[], status: ApplicationStatus)`: Authenticates request, executes `bulkUpdateApplicationStatus`, and revalidates `/dashboard` and `/applications`.
- `bulkUpdateApplicationColumnAction(ids: string[], customColumnId: string | null)`: Authenticates request, executes `bulkUpdateApplicationCustomColumn`, and revalidates `/dashboard` and `/applications`.

### 3. Authentication & Ownership Enforcement

- Every action verifies user session via `supabase.auth.getUser()`. Unauthenticated requests throw `Unauthorized` immediately.
- Database queries and updates explicitly append `.eq('user_id', userId)` and `.in('id', applicationIds)` to prevent cross-user leakage or foreign modification.

### 4. Storage Cleanup & Deletion Flow

- Document storage cleanup strictly precedes database deletion:
  1. Query `application_documents` for `storage_path` values where `application_id IN (uniqueIds)` AND `user_id = userId`.
  2. Batch-remove storage objects via `supabase.storage.from('jobhunt_documents').remove(storagePaths)`.
  3. If storage cleanup reports an error, database deletion is halted and an error is returned.
  4. Only on storage success are `applications` rows deleted, triggering Postgres `ON DELETE CASCADE` on `application_documents`.

### 5. Status Invariant & Custom Column Verification

- **Phase 3.1 Invariant**: Core status changes automatically set `custom_column_id = null`.
- **Custom Column Validation**: Non-null `customColumnId` values are queried against `custom_columns` where `user_id = userId`. Foreign IDs reject with `"Unauthorized or custom column not found"`. Normalizes `"none"` to `null`.

### 6. Batch Limits & Validation Schemas (`src/lib/schemas/bulk.schema.ts`)

- `MAX_BULK_BATCH_SIZE = 100`: Rejects batches exceeding 100 applications.
- Validates non-empty arrays and strict RFC 4122 UUID v4 formatting.
- Validates `status` against standard `applicationStatusSchema`.

### 7. Automated Tests Added

- `src/lib/schemas/__tests__/bulk.schema.test.ts` (11 tests passed)
- `src/lib/api/__tests__/applications.bulk.test.ts` (8 tests passed)
- `src/app/dashboard/__tests__/actions.bulk.test.ts` (9 tests passed)
- Total: 28 new tests covering empty IDs, UUID validation, batch limits, ownership checks, storage cleanup before DB deletion, storage cleanup failure prevention, status invariant, custom column ownership validation, and path revalidation.

### 8. Validation Results

- `bun run typecheck`: PASSED (0 errors)
- `bun run lint`: PASSED (0 warnings, 0 errors)
- `bun run test`: PASSED (38 test files, 572 tests passed)
- `bunx next build`: PASSED (Clean build, all routes static/dynamic compiled)

### 9. Security Findings & Known Limitations

- Storage deletion and PostgreSQL deletion are separate network operations. While storage failure safely aborts PostgreSQL deletion, PostgreSQL deletion failure after successful storage deletion would result in metadata pointing to missing files. However, this is strictly preferable to permanent private storage file leaks.
- Zero migrations or database schema alterations introduced.

### 10. Exact Files Changed

- `src/lib/schemas/bulk.schema.ts` (NEW)
- `src/lib/schemas/__tests__/bulk.schema.test.ts` (NEW)
- `src/lib/api/applications.ts` (MODIFIED)
- `src/lib/api/__tests__/applications.bulk.test.ts` (NEW)
- `src/app/dashboard/actions.ts` (MODIFIED)
- `src/app/dashboard/__tests__/actions.bulk.test.ts` (NEW)
- `JOBHUNT_PHASE_3_4_5_BULK_ACTIONS_AUDIT.md` (MODIFIED)

---

## Implementation Step 2 — Selection & UI Integration

**Status**: COMPLETED & VERIFIED  
**Date**: 2026-08-26

### 1. Selection Architecture

- Top-level client state `selectedIds: Set<string>` implemented in `src/app/applications/page.tsx`.
- Transient interactive state only — not persisted in URL search parameters, database, or localStorage.
- Membership lookup is $O(1)$ during rendering.

### 2. Select All Semantics

- Select All targets `processedApplications` (visible applications matching current active search and filters).
- If all visible items are selected, clicking toggles to Deselect All.
- If subset or none are selected, clicking selects all visible items.

### 3. Filter-Change Behavior

- Whenever search queries, status filters, custom column filters, date ranges, or sort options change, `selectedIds` is automatically reset to empty (`setSelectedIds(new Set())`) to prevent "Hidden Selection Risk" (mutating items that became invisible).

### 4. ApplicationCard Selection Checkbox

- Integrated into `src/components/applications/ApplicationCard.tsx` using existing `@/components/ui/checkbox`.
- Positioned in card header.
- StopPropagation applied to both `onClick` and `onPointerDown` to prevent triggering card modal click or `@dnd-kit` drag sensors.
- Fully accessible with dynamic ARIA label (`Select {job_title} at {company_name}`).

### 5. Contextual Bulk Toolbar (`BulkActionsToolbar.tsx`)

- When `selectedIds.size > 0`, the regular `ApplicationsToolbar` is replaced with `BulkActionsToolbar`.
- Displays `[X] selected` count badge, `Select All (Y)` / `Deselect All` toggle button, `Status` dropdown, `Column` dropdown, `Delete` destructive action, and `X` (clear selection) button.
- Responsive for mobile and desktop with touch-friendly targets.

### 6. Status Action & Phase 3.1 Invariant

- Uses `DropdownMenu` with all 12 core `ApplicationStatus` options.
- Calls `bulkUpdateApplicationStatusAction(ids, status)`.
- Updates local state, sets `custom_column_id: null` to enforce Phase 3.1 invariant, clears `selectedIds`, and displays Sonner success toast: `"{X} applications updated"`.

### 7. Custom Column Action

- Uses `DropdownMenu` listing user's custom columns and "No Custom Column" (`null`).
- Calls `bulkUpdateApplicationColumnAction(ids, customColumnId)`.
- Updates local state, preserves underlying `application.status`, clears `selectedIds`, and displays Sonner success toast: `"{X} applications moved"`.

### 8. Delete Confirmation Flow

- Clicking "Delete" opens a confirmation `AlertDialog` displaying the exact selected count: `"Delete {X} applications?"` and warning that attached documents will be permanently removed.
- On confirmation, calls `bulkDeleteApplicationsAction(ids)`.
- Updates local state by removing deleted applications, clears `selectedIds`, and displays Sonner success toast: `"{X} applications deleted"`.

### 9. Loading & Disabled States

- `isBulkMutating: boolean` disables all bulk toolbar controls, dialog confirm/cancel buttons, and individual card drag interactions while mutations are in flight to prevent duplicate submissions or race conditions.

### 10. Drag & Drop Protection

- `isDragDisabled = sortOption !== 'manual' || Boolean(isMutating)` passed to `KanbanBoardV3`, `DroppableKanbanColumn`, and `SortableApplication`.

### 11. Automated Tests Added (`src/components/applications/__tests__/BulkActions.test.tsx`)

- 14 comprehensive UI and integration tests covering:
  - Checkbox rendering and ARIA labels
  - Single and multi-selection
  - Checkbox click isolation from card click / DnD
  - Select All / Deselect All semantics
  - Filtered Select All scoping
  - Status update Server Action invocation & local state update
  - Custom column move Server Action invocation & status preservation
  - Delete dialog count verification and deletion execution
  - Loading disabled states
  - Server action failure handling and error toast display

### 12. Validation Results

- `bun run typecheck`: PASSED (0 errors)
- `bun run lint`: PASSED (0 warnings, 0 errors)
- `bun run test`: PASSED (39 test files, 586 tests passed)
- `bunx next build`: PASSED (Clean build, all routes compiled)

### 13. Regression Safety

- Application creation, editing, deletion, DnD, filter chips, URL filter sync, CSV export, Company Research, and Document management remain fully intact and verified.

### 14. Exact Files Changed in Step 2

- `src/components/applications/BulkActionsToolbar.tsx` (NEW)
- `src/components/applications/ApplicationCard.tsx` (MODIFIED)
- `src/components/applications/KanbanBoardV3.tsx` (MODIFIED)
- `src/app/applications/page.tsx` (MODIFIED)
- `src/components/applications/__tests__/BulkActions.test.tsx` (NEW)
- `JOBHUNT_PHASE_3_4_5_BULK_ACTIONS_AUDIT.md` (MODIFIED)

### 15. Runtime Investigation & Blocker Resolution

- **Investigation Finding**: Development runtime failure was caused by stale/corrupted generated Next.js artifacts resulting from running production builds concurrently with an active background development server.
- **Resolution**: Cleaned untracked `.next` build cache directory and performed full clean validation from scratch.
- **Verification Summary**:
  - `bun run typecheck`: Exit Code 0 (0 errors)
  - `bun run lint`: Exit Code 0 (0 errors, 0 warnings)
  - `bunx vitest run src/components/applications/__tests__/BulkActions.test.tsx`: Exit Code 0 (14 passed)
  - `bun run test`: Exit Code 0 (39 test files passed, 586 tests passed, 0 failures, 0 skipped)
  - `bunx next build`: Exit Code 0 (Clean production build, all 12 static/dynamic routes compiled)

---

## Manual QA Bugfix — Bulk Drag & Runtime

### 1. Multi-Select Drag Root Cause & Fix

- **Root Cause**: `KanbanBoardV3.tsx`'s `handleDragEnd` previously extracted only `applicationId = active.id as string` and moved only that single card, ignoring `selectedIds`. When multiple cards were selected, dragging a selected card moved only the dragged card rather than the complete selected set.
- **Fix Applied**:
  - Implemented the exact semantic rule in `KanbanBoardV3.tsx`:
    ```ts
    const isSelectedDrag = Boolean(
      selectedIds && selectedIds.has(applicationId) && selectedIds.size > 1
    )
    ```
  - **Case 1 (Multi-select drag)**: If dragged card ID is in `selectedIds` and `selectedIds.size > 1`, all `selectedIds` move together to `targetColumn`.
    - If target column is custom: updates `custom_column_id` for all selected cards while preserving their existing `status`.
    - If target column is standard: updates `status` to `targetColumn.statuses[0]` and resets `custom_column_id = null`.
    - Optimistic local state updates all selected items simultaneously with automatic rollback on error.
    - Notifies via `onBulkMoveApplications` handler in `src/app/applications/page.tsx` and falls back to bulk Server Actions (`bulkUpdateApplicationColumnAction` / `bulkUpdateApplicationStatusAction`).
  - **Case 2 (Single-card drag)**: If dragged card is unselected or no other cards are selected, only the dragged card moves, preserving standard single-card drag and same-column reordering behavior.

### 2. "[object Event]" Runtime Error Root Cause & Fix

- **Root Cause**: Next.js 15.5.7 / Webpack development error overlay intercepts unhandled promise rejections and script error events. When webpack chunks or stylesheets failed to load due to stale/corrupted `.next` artifacts from concurrent dev/build execution, `<script onerror>` and `<link onerror>` rejected with DOM `Event` objects, rendering as `Runtime Error: [object Event]`.
- **Fix Applied**:
  - Stopped conflicting background Next.js processes.
  - Removed corrupted `.next` build cache directory.
  - Enforced strict process isolation (never running `next dev` and `next build` concurrently).

### 3. CSS / Unstyled UI Root Cause & Fix

- **Root Cause**: Stale compilation artifacts in `.next` caused Webpack to serve HTML without the corresponding compiled CSS chunks (`app/layout.css` / Tailwind stylesheet), resulting in raw browser HTML rendering.
- **Fix Applied**: Clean rebuild generated fresh stylesheet chunks and verified full Tailwind typography, glassmorphism, buttons, and card styling.

### 4. Tests Added

- Added `Multi-Select Drag & Drop Semantics` test suite to `src/components/applications/__tests__/BulkActions.test.tsx`:
  - `single-card drag moves only the dragged card when no selection exists`
  - `multiple cards selected + dragged selected card: triggers bulk move for all selected cards`
  - `multiple cards selected + dragged UNSELECTED card: only dragged card is moved`

### 5. Validation Results

- `bun run typecheck`: **PASSED (0 errors)**
- `bun run lint`: **PASSED (0 errors)**
- `bunx vitest run src/components/applications/__tests__/BulkActions.test.tsx`: **PASSED (17/17 tests)**
- `bun run test`: **PASSED (39 test files / 589 tests)**
- `bunx next build`: **PASSED (Clean production build, all routes compiled)**

### 6. Exact Files Changed

- `src/components/applications/KanbanBoardV3.tsx`
- `src/app/applications/page.tsx`
- `src/components/applications/__tests__/BulkActions.test.tsx`
- `JOBHUNT_PHASE_3_4_5_BULK_ACTIONS_AUDIT.md`

### 7. Remaining Limitations

- None. Multi-select drag & drop, bulk status updates, bulk custom column updates, bulk deletion, single-card drag, and all status invariants are fully verified and operational.
