# JOBHUNT CUSTOM COLUMN ARCHITECTURE AUDIT

## 1. How columns are currently created, updated, and deleted

Custom columns are currently managed entirely on the client side using the `localStorage` API via a class named `ColumnStorage` (in `src/lib/storage/column-storage.ts`). Creation, updating, and deletion operations simply modify an array of `CustomColumn` objects in the browser's local storage and emit a custom window event (`columnStorageUpdated`) to trigger React re-renders.

## 2. How columns are reordered

Reordering custom columns is also handled purely by updating the `order` property of the objects stored in `localStorage`.

## 3. How columns are currently identified

When a custom column is created via `ColumnManageModal.tsx`, it generates a unique local ID (typically in the format `custom_${timestamp}` or using a local UUID generator). This ID exists only in the user's browser.

## 4. How applications are mapped to columns

Currently, applications in Supabase only have a `status` field (e.g., `'applied'`, `'interviewing'`). They DO NOT have any reference to custom columns.
When `KanbanBoardV3.tsx` renders, it maps applications to columns based on the `statuses` array defined for each column. Standard columns map to multiple statuses (e.g., the "Interview" column maps to `phone_screen`, `assessment`, etc.).

## 5. What happens when an application is dragged into a custom column

It currently **fails silently / returns early**. Because custom columns are not mapped to any valid database `status` (their `statuses` array is empty or undefined), the drag-and-drop handler in `KanbanBoardV3.tsx` sees `targetStatuses.length === 0` and aborts the move. The application snaps back to its original column.

## 6. Which parts are LocalStorage-only vs Supabase

- **LocalStorage-only:** Everything related to custom columns (names, icons, descriptions, order, IDs, creation/deletion).
- **Supabase:** The actual Applications, their `status` (fixed enum), `position` within their status, and all core CRUD operations.

## 7. Whether any existing application data would be affected by introducing persistence

No existing application data will be negatively affected if we design the database relationship correctly. By making the relationship _nullable_ (`custom_column_id UUID NULL`), existing applications will simply continue to function using their `status` field.

## 8. Current RLS & Security Posture

The initial migration (`001_create_core_tables.sql`) explicitly left Row Level Security (RLS) disabled for MVP simplicity. The user separation is currently enforced at the application layer via `eq('user_id', user.id)` in queries.
When creating the new `custom_columns` table, we will implement strict RLS for it immediately.

## MINIMUM CHANGES REQUIRED FOR PERSISTENCE:

1. **Database:** Create a `custom_columns` table (with RLS) and add a nullable `custom_column_id` to the `applications` table.
2. **API:** Create server actions in `actions.ts` for CustomColumn CRUD. Update `updateApplicationPositionAction` to accept and update `custom_column_id`.
3. **UI:** Refactor `KanbanBoardV3.tsx` and `ColumnManageModal.tsx` to read from the API instead of `localStorage`. Map applications to custom columns based on `app.custom_column_id` instead of checking the `status` enum when rendering custom columns.
