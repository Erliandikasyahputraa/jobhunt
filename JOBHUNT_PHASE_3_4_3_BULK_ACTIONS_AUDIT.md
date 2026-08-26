# JOBHUNT PHASE 3.4.3 BULK ACTIONS AUDIT

## 1. Current Architecture

The `Applications` workspace is orchestrated primarily in `page.tsx`. State (`applications`, `customColumns`, `filters`) is managed here and propagated downward. Sorting, filtering, and URL synchronization (Phase 3.4.1) operate on the client side, yielding a `processedApplications` array fed into `KanbanBoardV3.tsx` and the CSV exporter.

## 2. Existing Mutation Architecture

Mutations currently rely on Next.js Server Actions (e.g., `updateApplicationStatusAction`, `deleteApplicationAction`) which validate authentication, perform Supabase queries, and call `revalidatePath`. The client (`page.tsx`) optimistically or synchronously updates React state to match the result, using Sonner for success/error feedback.

## 3. Selection Architecture Recommendation

Selection state should live as a `Set<string>` (or `string[]`) in `page.tsx`, named `selectedIds`.

- **Filter/Sort changes**: Selection should be cleared when filters change to prevent users from performing actions on hidden/filtered applications they cannot see.
- **URL changes**: Navigation should clear selection.
- **Deletion**: If a selected application is deleted individually, its ID should be removed from `selectedIds`.

## 4. Select-All Recommendation

Implement **"Select All Visible"**. A "Select All" checkbox in the toolbar should exclusively select the IDs currently present in `processedApplications`. This avoids unexpected bulk mutations on hidden records and keeps the payload deterministic.

## 5. Bulk Delete Architecture

- Add `bulkDeleteApplicationsAction(ids: string[])` to server actions.
- Use Supabase `delete().in('id', ids).eq('user_id', user.id)`.
- The query is intrinsically transactional in Postgres. It deletes all matching IDs belonging to the authenticated user.

## 6. Bulk Status Architecture

- Add `bulkUpdateApplicationStatusAction(ids: string[], status: ApplicationStatus)`.
- **Invariant preservation (Phase 3.1)**: Updating the core `status` MUST set `custom_column_id` to `null` to preserve pipeline consistency.
- The SQL query should be `update({ status, custom_column_id: null }).in('id', ids).eq('user_id', user.id)`.

## 7. Bulk Custom-Column Architecture

- Add `bulkUpdateCustomColumnAction(ids: string[], customColumnId: string | null)`.
- Explicitly verify the `customColumnId` belongs to the authenticated user (unless it is `null`/"none").
- Update query: `update({ custom_column_id: customColumnId }).in('id', ids).eq('user_id', user.id)`.

## 8. Ownership/Security Analysis

Supabase Row Level Security (RLS) protects the records automatically. However, as an added defense-in-depth measure, all bulk server actions must append `.eq('user_id', user.id)` to their update/delete statements to prevent any possibility of cross-user ID tampering. Client-provided custom column IDs must be verified against the user's actual custom columns before assignment.

## 9. Optimistic Update Strategy

When a bulk action is triggered:

1. Snapshot current `applications` state.
2. Optimistically update `applications` in `page.tsx` (e.g. mapping over `selectedIds` to change status).
3. Call Server Action.
4. If successful, clear `selectedIds`.
5. If failed, rollback state to snapshot, leave `selectedIds` intact, and display an error toast.

## 10. Partial Failure Strategy

Bulk operations utilizing Supabase's `.in()` operator are executed as a single Postgres statement, meaning they are natively **all-or-nothing** (transactional). This is the safest approach, ensuring no partial states require complex reconciliation.

## 11. Position Preservation

During bulk status or column changes, `application.position` should remain unchanged on the database level for the updated records (or assigned a trailing max position). Given the complexity of re-calculating dense positions for bulk cross-column moves, the safest initial approach is to not overwrite `position` explicitly, allowing the client-side sorting logic to group them safely at the bottom of the destination column.

## 12. Filter/Sort/URL Interaction

- Selection operates solely on `processedApplications`.
- Changing any filter (status, date, custom, search) or sort option should immediately trigger `setSelectedIds([])`.
- URL navigation should clear selection.

## 13. Dashboard Analytics Interaction

Analytics strictly aggregate by `application.status`. By ensuring bulk status updates mutate `application.status`, dashboard analytics will automatically stay synchronized. Bulk custom column changes do not affect analytics.

## 14. UX Recommendation

- **Selection UI**: Introduce a checkbox in the top-left corner of `ApplicationCard.tsx`.
- **Bulk Toolbar**: When `selectedIds.length > 0`, display a contextual action bar (either floating at the bottom center or replacing the primary toolbar controls).
- **Actions**: `[Change Status]`, `[Move to Column]`, `[Delete]`, and a `[x]` clear selection button.

## 15. Mobile UX

- Checkboxes in cards must have an adequately sized touch target.
- The contextual Bulk Toolbar should be fixed at the bottom of the screen (`fixed bottom-0 left-0 right-0 z-50`) on mobile viewports to prevent layout shifting and remain accessible during scrolling.

## 16. Performance Analysis

Updating or deleting 10-500 records via `.in('id', ids)` is highly performant in Postgres. The server action payload size for an array of 500 UUIDs is negligible (~18KB). No pagination or virtualization is strictly required to implement bulk actions safely.

## 17. Database Impact

- NO schema changes required.
- NO migrations required.
- Existing tables and RLS are fully compatible.

## 18. Dependency Impact

- NO new packages required.
- Radix primitives (DropdownMenu, Dialog) and standard checkboxes are sufficient.

## 19. Test Strategy

- Unit tests for `bulk*` server actions verifying RLS/ownership isolation.
- Integration tests in `page.bulk.test.tsx` simulating "Select All", verifying `selectedIds` state.
- UI tests simulating filter changes clearing the selection state.
- Rollback verification upon mock API failure.

## 20. P0 Findings

None.

## 21. P1 Findings

None.

## 22. P2/P3 Findings

- Hidden State Risk (P2): If `selectedIds` isn't aggressively cleared when filters change, a user might bulk delete applications they cannot currently see on screen. Mitigation: tie selection clearance to filter state changes.

## 23. Exact Implementation Plan

1. **API & Server Actions**: Implement `bulkDelete`, `bulkUpdateStatus`, `bulkUpdateCustomColumn` with `.in()` and user validation.
2. **State Management**: Add `selectedIds` and toggle logic to `page.tsx`. Bind clearance to `setFilters`.
3. **Card UI**: Integrate `Checkbox` into `ApplicationCard`.
4. **Toolbar UI**: Build `BulkActionsToolbar` component that renders when selection exists.
5. **Integration**: Connect bulk actions to state with optimistic rollbacks and Sonner toasts.
6. **Testing**: Write comprehensive unit and integration tests.

## 24. Recommended File Changes

- `src/lib/api/applications.ts`
- `src/app/dashboard/actions.ts`
- `src/app/applications/page.tsx`
- `src/components/applications/ApplicationCard.tsx`
- `src/components/applications/KanbanBoardV3.tsx`
- `src/components/applications/BulkActionsToolbar.tsx` (NEW)

## 25. Explicitly Out-of-Scope Features

- Multi-card drag and drop.
- Bulk import/export.
- Kanban virtualization.

## 26. Risks

- Edge case where rapid drag-and-drop operations interleave with bulk network requests, potentially causing state desynchronization. Optimistic locking or blocking DnD while a bulk request is in flight (`isBulkUpdating`) mitigates this.

## 27. Recommended Implementation Order

1. Database API methods.
2. Server Actions.
3. Client State & ApplicationCard selection UI.
4. Bulk Actions Toolbar & API integration.
5. Automated Testing & Validation.
