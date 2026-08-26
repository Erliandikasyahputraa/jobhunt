# Phase 3.3 — Search, Filter & Sort Audit

## 1. Current Search Architecture

Presently, search is handled through a straightforward client-side implementation. The `ApplicationsPage` component holds `searchQuery` in state and derives a `filteredApplications` array by comparing the lowercase query against the `company_name` and `job_title` fields. The search input itself is deeply embedded inside `KanbanBoardV3.tsx` and only conditionally renders when `onSearchChange` is provided. This splits the search UX (input inside the Kanban board) from the search logic (state inside `page.tsx`).

## 2. Current State Architecture

All primary application data and the custom columns are fetched on mount inside `ApplicationsPage` (`page.tsx`). It retains `applications`, `customColumns`, and `searchQuery` via `useState`. Derived state (`filteredApplications`) is then cascaded downward to `KanbanBoardV3`, which is completely agnostic to how the data was filtered. `KanbanBoardV3` additionally houses a local search input field and manage buttons.

## 3. Filter Requirements

We will expand the single `filteredApplications` array computation inside `page.tsx` to handle four combined conditions (AND logic):

1. **Search**: Match `company_name` or `job_title` against the query string.
2. **Core Status**: A multiselect or single select filter matching `application.status` against the 12 fixed Enums defined in `database.types.ts` (e.g., `wishlist`, `applied`, `interviewing`, `rejected`, etc.).
3. **Custom Column**: A multiselect or single select matching `application.custom_column_id` against the dynamic Supabase rows loaded into `customColumns`.
4. **Date Range**: Matching `date_applied` to one of:
   - All time (no filter)
   - Last 7 days
   - Last 30 days
   - This year (Current year boundary)

## 4. Sort Requirements

Once the filtered subset is computed, it will be sorted before being passed to `KanbanBoardV3`.

- **Newest applied**: Descending `date_applied`
- **Oldest applied**: Ascending `date_applied`
- **Recently updated**: Descending `updated_at`
- **Company A-Z**: Ascending alphabetical `company_name`
  _(Note: Sorting the array at the page level may conflict with Kanban's explicit `position` sorting. We must ensure that sorting does not permanently destruct manual drag-and-drop orders inside columns unless specifically intended for view-only, OR we sort the applications within each column using these rules. Since the Kanban board inherently groups by columns and sorts by `position`, we must update `KanbanBoardV3.tsx`'s internal grouping logic to override the `position` sort with our external `sortOption` when it is active)._

## 5. Status / Custom Column Separation Invariant

The architecture maintains a strict line:

- `status` belongs to the underlying analytics and lifecycle model.
- `custom_column_id` belongs to personal Kanban organization.
- When an application has `status: 'interviewing'` and `custom_column_id: 'todo'`, applying a filter for `Status = Interviewing` OR `Custom Column = Todo` will display it.
- The filter options for Status will purely list `ApplicationStatus` constants. The filter options for Custom Columns will dynamically iterate the `customColumns` array. They will never merge visually into one combined "Stage" list in the UX.

## 6. Desktop UX Recommendation

Extract the header section entirely out of `KanbanBoardV3.tsx` and place it in `page.tsx`. Create a new `ApplicationsToolbar` component.
**Layout Structure:**

```text
[ Search Input ] [ Filter Dropdown ] [ Sort Dropdown ] [ Manage Columns ] [ + New ]
```

- The **Filter Dropdown** will utilize the existing `DropdownMenu` (with `DropdownMenuSub` and `DropdownMenuCheckboxItem` from Radix).
- Active filters can be displayed as subtle dismissable badged chips below the toolbar.
- The kanban columns retain maximum vertical real estate.

## 7. Mobile UX Recommendation

A massive popover on mobile is frustrating. I recommend using the existing `Dialog` primitive styled as a full-screen or bottom-anchored modal specifically for the Filter controls on smaller viewports (`sm:hidden`).
**Layout Structure:**

```text
[ Search Input ] [ Filter Icon ] [ Sort Icon ]
```

Clicking "Filter" opens a `Dialog` (or we can use shadcn `Sheet` if you approve its installation, though `Dialog` can accomplish the same). The mobile dialog will present accordion-style toggles for Status, Custom Column, and Date, plus a large "[ Apply ]" and "[ Clear All ]" button.

## 8. Empty-State Behavior

Presently, an empty state triggers the global "Start Your Job Hunt Journey" splash.
We must distinguish between `applications.length === 0` (True Empty) and `filteredApplications.length === 0` (Filter Empty).
For Filter Empty, the board will render a new component:

> "No applications match your filters."
> [ Clear Filters ] (Button)

## 9. Performance Recommendation

Given hundreds of items, native array `.filter()` and `.sort()` operations inside a `useMemo` block are highly performant (averaging <1ms).

- Extract the filtering into `const processedApplications = useMemo(() => { ... }, [applications, searchQuery, filters, sortOption])`.
- There is no need for virtualization, debounce (beyond standard React rendering), or database-level queries for filtering, which completely avoids N+1 problems.

## 10. Testing Strategy

- **Search**: Case-insensitivity and substring matching on company/title.
- **Status/Column Separation**: Ensure an application respects mutual exclusivity in filtering logic (e.g. `status=applied`, `custom_column=null`).
- **Dates**: Mock system time and verify Date boundary thresholds for 7d/30d/year.
- **Combined Logic**: Assert that multiple active filters stack via AND logic.
- **Empty States**: Verify the UI distinguishes between a zero-record database vs zero-record filter result.
- **Component**: Create `ApplicationsToolbar.test.tsx` for state changes. Update `KanbanBoardV3.test.tsx` to reflect the extracted search prop removals.

## 11. Files That Need Modification

- `src/app/applications/page.tsx` (Add unified state, extract toolbar, add empty states)
- `src/components/applications/KanbanBoardV3.tsx` (Remove internal search bar, handle manual sort overriding `position`)
- `src/components/applications/ApplicationsToolbar.tsx` (NEW)
- `src/components/applications/FilterChips.tsx` (NEW)

## 12. Potential Risks

- **Sorting Conflict**: The Kanban board currently hardcodes `a.position - b.position` inside `useMemo`. If a user selects "Newest Applied", we must pass `sortOption` down to `KanbanBoardV3` and override the `position` sort logic, otherwise it will visually ignore the sort directive.
- **Drag-and-Drop under Sort**: If a user drags a card while a "Sort by Newest" is active, what happens to its `position`? We should ideally disable Drag-and-Drop (or warn the user) when a custom Sort is active, as dropping a card logically modifies `position`, which clashes with a Date-based sorting axis.

## 13. Recommended Implementation Order

1. Build `ApplicationsToolbar.tsx` and integrate it into `page.tsx`, removing the old search from `KanbanBoardV3.tsx`.
2. Introduce Filter and Sort state into `page.tsx` and implement the `useMemo` computation.
3. Update `KanbanBoardV3.tsx` to accept the `sortOption` and conditionally disable drag-and-drop or override the internal position sorting.
4. Add the "Filtered Empty State" to `page.tsx`.
5. Implement unit tests for the filtering logic hook/utility.

**READY FOR IMPLEMENTATION**: YES
