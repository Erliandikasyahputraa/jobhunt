# Anti-Nganggur — Phase 2C-C Gate C2 Implementation Report

**Mobile & Desktop Application Detail Composition — Timeline Architecture Revision**

- **Date:** 2026-09-17
- **Baseline HEAD:** `a688f93f2f879cc2cbefb02e9797a205960170aa`
- **Gate:** C2 — Application Detail Composition & Navigation Revision
- **Status:** PASS WITH UNVERIFIED RUNTIME — READY FOR FORENSIC AUDIT

---

## 1. Architectural Revision & Scope Adherence

Following UX review, the previous persistent right-side Timeline panel on desktop was **REJECTED**.
Timeline is secondary activity information that must not consume permanent horizontal screen width.

### Approved Final Architecture:

- **Unified Menu/Tab Architecture:**
  - `TabNavigation` (`activeTab`) → `ApplicationDetailLayout` → `MainPanel`.
  - Both Desktop (`>= 1280px` / `xl`) and Mobile (`< 1280px`) feature 4 tabs:
    1. **Overview**
    2. **Company**
    3. **Documents**
    4. **Timeline**
  - Timeline renders **exclusively** within `MainPanel` when `activeTab === 'timeline'`.
  - Zero persistent right-side Timeline panels exist at any viewport.
  - Exactly **ONE** instance of `ApplicationTimeline` is rendered when Timeline is selected, and **ZERO** instances when any other tab is active.

### Scope Summary:

Exactly **7 files** modified (6 source + 1 test), all within the approved C2 scope.
C1 files (`ApplicationDetail.types.ts`, `JobDescription.tsx`) remain strictly untouched.

| #   | File                          | Change Category                                                                                                                        |
| --- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `TabNavigation.tsx`           | Added 4th tab (Timeline with `Clock` icon) to both `sidebar` and `bottom-bar` variants                                                 |
| 2   | `MainPanel.tsx`               | Timeline case rendering `<ApplicationTimeline />`, `customColumns` prop                                                                |
| 3   | `ApplicationDetailLayout.tsx` | Removed persistent right Timeline panel; 2-column desktop basin; responsive header & metadata                                          |
| 4   | `ActionButtons.tsx`           | Compact touch gaps (`gap-1.5 sm:gap-2`)                                                                                                |
| 5   | `CompanyInfo.tsx`             | Empty state stacking (`flex-col sm:flex-row`, `w-full sm:w-auto`)                                                                      |
| 6   | `Documents.tsx`               | Responsive empty state padding (`p-5 sm:p-6`)                                                                                          |
| 7   | `ApplicationDetail.test.tsx`  | Updated tests verifying 4 tabs on desktop sidebar, 4 tabs on mobile bottom bar, MainPanel timeline rendering, zero duplicate instances |

---

## 2. Changes Per File

### 2.1 TabNavigation.tsx

- Added `Clock` icon; 4th tab `{ id: 'timeline', label: 'Timeline', icon: Clock, description: 'Activity history' }`.
- `variant?: 'sidebar' | 'bottom-bar'` prop.
- Both `sidebar` and `bottom-bar` variants now render all 4 tabs (`tabItems = allTabItems`).
- `sidebar` variant: displays 4 tabs with concise subtitles (concise description avoids increasing sidebar height).
- `bottom-bar` variant: `grid grid-cols-4` horizontal layout, 18px icons, `text-[11px] sm:text-xs` labels, subtitles omitted, `min-h-[48px]` touch targets.

### 2.2 MainPanel.tsx

- Added `customColumns?: CustomColumnDB[]` prop.
- Added `case 'timeline'` rendering `<ApplicationTimeline application={application} customColumns={customColumns} />`.
- Padding adjusted to `p-4 sm:p-6` for responsive consistency.

### 2.3 ApplicationDetailLayout.tsx

- Removed persistent right-side Timeline panel (`<div className="hidden xl:block w-80 ..."><ApplicationTimeline ... /></div>`).
- Removed unused import `import { ApplicationTimeline } from './RightPanel/ApplicationTimeline'`.
- Desktop basin is clean 2-column: Left Sidebar (`w-60 shrink-0`) + Main Content Basin (`flex-1 min-w-0 overflow-y-auto`).
- Breakpoints: Desktop sidebar at `>= 1280px` (`hidden xl:block`), mobile bottom bar at `< 1280px` (`xl:hidden`).
- Header padding: `p-4 sm:p-6 pb-3`.
- Logo: `size="md"` + `h-11 w-11 sm:h-16 sm:w-16`.
- Header gap: `gap-3 sm:gap-4`.
- Metadata strip: `gap-x-4 sm:gap-x-6 px-4 sm:px-6 pb-3 sm:pb-4 pt-2.5 sm:pt-3`.

### 2.4 ActionButtons.tsx

- Container gap: `gap-1.5 sm:gap-2`.

### 2.5 CompanyInfo.tsx

- Empty state padding: `p-6 sm:p-10`.
- Button wrapper: `flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 w-full max-w-xs sm:max-w-none mx-auto`.
- Each button: added `w-full sm:w-auto`.

### 2.6 Documents.tsx

- Empty state padding: `p-5 sm:p-6`.

---

## 3. Zero Duplicate Timeline Contract

- At `>= 1280px` (desktop): Desktop sidebar offers 4 tabs. Selecting Timeline renders `ApplicationTimeline` in `MainPanel`. No right panel exists.
- At `< 1280px` (mobile): Bottom navigation offers 4 tabs. Selecting Timeline renders `ApplicationTimeline` in `MainPanel`.
- Result: **Zero duplicate instances at any viewport.**

---

## 4. Quality Gate Verification

| Gate              | Command                               | Result                                          |
| ----------------- | ------------------------------------- | ----------------------------------------------- |
| Whitespace Check  | `git diff --check`                    | PASS (exit code 0)                              |
| ESLint            | `npm run lint`                        | PASS (exit code 0, 0 errors)                    |
| TypeScript        | `npx tsc --noEmit`                    | PASS (exit code 0, 0 errors)                    |
| Focused Tests     | `npm test ApplicationDetail.test.tsx` | PASS (31/31 passed)                             |
| Full Vitest Suite | `npm test -- --run`                   | PASS (643/643 passed across 41 files)           |
| Production Build  | `npx next build`                      | PASS (exit code 0, 12/12 routes static/dynamic) |
| Manual Runtime QA | Visual QA Tooling                     | UNVERIFIED (Headless automation not executed)   |

---

## 5. Scope Boundary Compliance

- **Kanban Toolbar Mobile Spacing:** Diagnosed that `p-0` on mobile in `KanbanBoardV3.tsx` causes the first column to touch `ApplicationsToolbar`. Since `KanbanBoardV3.tsx` and `page.tsx` are outside the C2 scope, they were reported without modification.
- **Interview `>` Button Forensic:** Fully traced to `DroppableKanbanColumn` in `KanbanBoardV3.tsx`. Verified as an intentional sub-stage toggle button covered by dedicated unit tests. No modifications made.

---

**VERDICT: PASS WITH UNVERIFIED RUNTIME — READY FOR FORENSIC REVIEW**
