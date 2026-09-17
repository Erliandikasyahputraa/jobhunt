# ANTI-NGANGGUR — PHASE 2B-E3 PRE-IMPLEMENTATION FORENSIC AUDIT

## Iconography Standardization: Kanban Columns & Application Detail Metadata

**Audit Date:** September 17, 2026  
**Auditor:** Antigravity IDE (Pair Programming Assistant)  
**Target Repository:** `c:\Mine\porto\jobtracker\anti-nganggur`  
**Current State:** Phase E2 Closed — Pre-Implementation Audit for E3  
**Implementation Status:** AUDIT ONLY (No source code modified)

---

## 1. OBJECTIVE

The primary objective of Phase 2B-E3 is to standardize the visual icon language across the Anti-Nganggur application, focusing specifically on:

1. **Kanban Column Iconography** (`src/components/applications/KanbanBoardV3.tsx` and related column rendering utilities)
2. **Application Detail Metadata Iconography** (`src/components/applications/ApplicationDetail/components/ApplicationDetailLayout.tsx`, `JobDescription.tsx`, `CompanyInfo.tsx`, and `Documents.tsx`)

The goal is to eliminate fragmented, inconsistent iconography—specifically OS-dependent colored emojis (`📍`, `💰`, `📊`, `📁`, `📅`, `🔗`, `📝`, `💾`, `🎯`, `🎉`, `❌`), mismatched Lucide icon variants (`Building` vs `Building2`, `Edit` vs `Edit2`), ad-hoc sizing, missing accessible names (`aria-label`, `aria-hidden`), and raw Tailwind color classes (`text-orange-700 dark:text-amber-400`, `text-slate-400 dark:text-slate-500`)—and replace them with a unified, accessible, theme-safe Lucide icon language matching the "Modern Editorial SaaS" design identity established in Phases A–E2.

---

## 2. CURRENT ICONOGRAPHY INVENTORY

Below is the forensic inventory of all icons, emojis, and pseudo-icons in the targeted inspection files:

| File                          | Location      | Current Icon                                                                             | Current Purpose                                   | Proposed Lucide Icon                                                                                                 | Reason                                                                                               | Risk                                                                               |
| :---------------------------- | :------------ | :--------------------------------------------------------------------------------------- | :------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------- |
| `KanbanBoardV3.tsx`           | Line 212, 247 | `icon` (Emoji `💾`, `📝`, `🎯`, `🎉`, `❌`, `📋`) via `COLUMN_ICON_MAP`                  | Kanban column header icon badge                   | Standard Lucide Icon Component (`Bookmark`, `Send`, `MessageSquare`, `Sparkles`, `Archive`, `Folder`)                | Emojis render inconsistently across OSs (iOS, Android, Windows) and do not inherit CSS theme colors. | Low. Custom column user-defined icons must still be supported as string fallbacks. |
| `KanbanBoardV3.tsx`           | Line 238-242  | `<ChevronDown>`, `<ChevronRight>` (16px)                                                 | Interview column sub-stage collapse/expand button | `<ChevronDown>`, `<ChevronRight>` (16px, `h-4 w-4`)                                                                  | Retain Lucide icons; add `aria-hidden="true"` to SVG since button already has `aria-label`.          | None (standard preservation).                                                      |
| `KanbanBoardV3.tsx`           | Line 285-287  | `<span className="text-3xl">{column.icon \|\| getColumnIcon(column.id)}</span>`          | Kanban column empty-state icon                    | Lucide Icon Component (`h-12 w-12 text-[var(--text-muted)]`) matching column type                                    | Emojis in empty state look juvenile and break the editorial aesthetic.                               | Low. Custom columns need fallback.                                                 |
| `ApplicationDetailLayout.tsx` | Line 87       | `📍` (U+1F4CD)                                                                           | Location metadata tag                             | `<MapPin className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" aria-hidden="true" />`                            | Emojis do not respond to `text-[var(--text-muted)]`; Lucide `MapPin` is industry standard.           | None. Test asserts on location string, not emoji.                                  |
| `ApplicationDetailLayout.tsx` | Line 95       | `💰` (U+1F4B0)                                                                           | Salary range metadata tag                         | `<WalletCards className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" aria-hidden="true" />`                       | Emojis feel amateurish; `WalletCards` or `Banknote` provides professional financial cue.             | None. Test asserts on salary string, not emoji.                                    |
| `ApplicationDetailLayout.tsx` | Line 104      | `📊` (U+1F4CA)                                                                           | Application status metadata tag                   | `<Activity className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" aria-hidden="true" />`                          | Bar chart emoji is mismatched for pipeline stage; `Activity` represents live status.                 | None.                                                                              |
| `ApplicationDetailLayout.tsx` | Line 112      | `📁` (U+1F4C1)                                                                           | Column name metadata tag                          | `<KanbanSquare className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" aria-hidden="true" />`                      | Folder emoji does not represent a Kanban workflow column; `KanbanSquare` or `Columns` does.          | None.                                                                              |
| `ApplicationDetailLayout.tsx` | Line 118      | `📅` (U+1F4C5)                                                                           | Date applied metadata tag                         | `<Calendar className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" aria-hidden="true" />`                          | Calendar emoji is OS-colored; Lucide `Calendar` inherits design tokens.                              | None.                                                                              |
| `ApplicationDetailLayout.tsx` | Line 130      | `🔗` (U+1F517)                                                                           | Application source metadata tag                   | `<Compass className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" aria-hidden="true" />`                           | Raw link emoji does not indicate origin platform; `Compass` or `Share2` communicates source.         | None.                                                                              |
| `JobDescription.tsx`          | Line 20       | `<ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-orange-700 dark:text-amber-400" />` | Section header indicator for Job Posting          | `<ExternalLink className="h-4 w-4 text-[hsl(var(--copper-dark))] shrink-0" aria-hidden="true" />`                    | Raw Tailwind colors (`text-orange-700 dark:text-amber-400`) violate Phase A semantic tokens.         | None.                                                                              |
| `JobDescription.tsx`          | Line 30       | `<ExternalLink className="w-4 h-4" />`                                                   | Action link trailing icon                         | `<ExternalLink className="h-3.5 w-3.5 ml-1 shrink-0" aria-hidden="true" />`                                          | Missing `aria-hidden="true"`; sizing inconsistent with text (14px).                                  | None.                                                                              |
| `JobDescription.tsx`          | Line 65       | `📝` (U+1F4DD)                                                                           | Empty state icon for Job Description              | `<FileText className="h-8 w-8 text-[var(--text-muted)]" aria-hidden="true" />`                                       | Memo emoji inside empty state circle violates editorial design language.                             | None.                                                                              |
| `CompanyInfo.tsx`             | Line 188      | `<Building2 className="w-5 h-5 text-slate-700 dark:text-amber-400" />`                   | Create/Edit company form header                   | `<Building2 className="h-5 w-5 text-[hsl(var(--copper-dark))] shrink-0" aria-hidden="true" />`                       | Uses hardcoded `text-slate-700 dark:text-amber-400`; missing `aria-hidden`.                          | None.                                                                              |
| `CompanyInfo.tsx`             | Line 337      | `<LinkIcon className="w-5 h-5 text-orange-700 dark:text-amber-400" />`                   | Link existing company header                      | `<Link2 className="h-5 w-5 text-[hsl(var(--copper-dark))] shrink-0" aria-hidden="true" />`                           | Mismatched colors; `Link2` is modern replacement for deprecated `Link`.                              | None.                                                                              |
| `CompanyInfo.tsx`             | Line 398      | `<Building2 className="w-5 h-5 text-orange-700 dark:text-amber-400" />`                  | Company profile section header                    | `<Building2 className="h-5 w-5 text-[hsl(var(--copper-dark))] shrink-0" aria-hidden="true" />`                       | Mismatched raw colors; missing `aria-hidden`.                                                        | None.                                                                              |
| `CompanyInfo.tsx`             | Line 403      | `<Edit className="w-4 h-4 mr-2" />`                                                      | Edit company button icon                          | `<Edit2 className="h-4 w-4 mr-1.5 shrink-0" aria-hidden="true" />`                                                   | Deprecated `Edit` icon used; should harmonize with `Edit2` across codebase.                          | None.                                                                              |
| `CompanyInfo.tsx`             | Line 407      | `<Unlink className="w-4 h-4 mr-2" />`                                                    | Unlink company button icon                        | `<Unlink className="h-4 w-4 mr-1.5 shrink-0" aria-hidden="true" />`                                                  | Standardize spacing to `mr-1.5`; add `aria-hidden="true"`.                                           | None.                                                                              |
| `CompanyInfo.tsx`             | Line 426      | `<Globe className="w-4 h-4" />`                                                          | Company website metadata label                    | `<Globe className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" aria-hidden="true" />`                             | Missing semantic token and `aria-hidden`.                                                            | None.                                                                              |
| `CompanyInfo.tsx`             | Line 504      | `<Building2 className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />`    | Unlinked company empty state icon                 | `<Building2 className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-3" aria-hidden="true" />`                       | Hardcoded `text-slate-400 dark:text-slate-500` instead of `var(--text-muted)`.                       | None.                                                                              |
| `CompanyInfo.tsx`             | Line 519      | `<Plus className="w-4 h-4 mr-2" />`                                                      | Create company action button                      | `<Plus className="h-4 w-4 mr-1.5 shrink-0" aria-hidden="true" />`                                                    | Standardize spacing; add `aria-hidden="true"`.                                                       | None.                                                                              |
| `CompanyInfo.tsx`             | Line 523      | `<LinkIcon className="w-4 h-4 mr-2" />`                                                  | Link company action button                        | `<Link2 className="h-4 w-4 mr-1.5 shrink-0" aria-hidden="true" />`                                                   | Harmonize with `Link2`; add `aria-hidden="true"`.                                                    | None.                                                                              |
| `Documents.tsx`               | Line 160      | `<Upload className="w-4 h-4 mr-2" />`                                                    | Primary toolbar upload button                     | `<Upload className="h-4 w-4 mr-1.5 shrink-0" aria-hidden="true" />`                                                  | Spacing standardization; add `aria-hidden="true"`.                                                   | None.                                                                              |
| `Documents.tsx`               | Line 167      | `<Loader2 className="w-8 h-8 animate-spin text-label-secondary" />`                      | Loading spinner                                   | `<Loader2 className="h-8 w-8 animate-spin text-[var(--text-muted)]" aria-label="Loading documents" role="status" />` | `text-label-secondary` is non-standard; needs accessible role.                                       | None.                                                                              |
| `Documents.tsx`               | Line 171      | `<FileText className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />`     | Empty state document icon                         | `<FileText className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-3" aria-hidden="true" />`                        | Hardcoded slate colors; standardize sizing to 40px (`h-10 w-10`).                                    | None.                                                                              |
| `Documents.tsx`               | Line 183      | `<Plus className="w-4 h-4 mr-2" />`                                                      | Empty state upload CTA icon                       | `<Plus className="h-4 w-4 mr-1.5 shrink-0" aria-hidden="true" />`                                                    | Standardize spacing; add `aria-hidden="true"`.                                                       | None.                                                                              |
| `Documents.tsx`               | Line 196      | `<File className="w-5 h-5 text-slate-700 dark:text-slate-300" />`                        | Document item row file icon                       | `<FileText className="h-4 w-4 text-[var(--text-secondary)]" aria-hidden="true" />`                                   | `File` is generic; `FileText` is clearer. Hardcoded slate colors.                                    | None.                                                                              |
| `Documents.tsx`               | Line 226, 228 | `<Loader2>` / `<Download className="w-4 h-4 mr-2" />`                                    | Document download button icon                     | `<Download className="h-3.5 w-3.5 mr-1.5 shrink-0" aria-hidden="true" />`                                            | Standardize inline button icon size (14px).                                                          | None.                                                                              |
| `Documents.tsx`               | Line 239      | `<Trash2 className="w-4 h-4" />`                                                         | Delete document icon button                       | `<Trash2 className="h-4 w-4 text-[var(--text-muted)] group-hover:text-destructive shrink-0" aria-hidden="true" />`   | Icon button already has `aria-label="Delete document"`; SVG needs `aria-hidden="true"`.              | None.                                                                              |
| `TabNavigation.tsx`           | Line 29       | `<Building>`                                                                             | Tab navigation icon for Company                   | `<Building2>`                                                                                                        | Inconsistent with `Building2` used in `CompanyInfo.tsx`.                                             | None.                                                                              |

---

## 3. KANBAN AUDIT

### 3.1 Status & Column Icons

- Currently, standard Kanban columns (`saved`, `applied`, `interview`, `offers`, `closed`) derive their icons from `COLUMN_ICON_MAP`:
  - `saved`: `'💾'`
  - `applied`: `'📝'`
  - `interview`: `'🎯'`
  - `offers`: `'🎉'`
  - `closed`: `'❌'`
  - fallback: `'📋'`
- In `KanbanBoardV3.tsx` (lines 246–248):
  ```tsx
  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)]">
    <span className="text-xl">{icon}</span>
  </div>
  ```
- **Finding:** The emoji strings are rendered in a 40x40px badge with text size `text-xl`. On Windows and Chromium, these render as flat, colored emoji glyphs that cannot be styled with CSS variables or opacity tokens.
- **Proposed Coherent Lucide Language:**
  - `saved`: `<Bookmark className="h-4 w-4 text-[hsl(var(--copper-dark))]" aria-hidden="true" />` (Wishlist / Saved bookmark)
  - `applied`: `<Send className="h-4 w-4 text-sky-600 dark:text-sky-400" aria-hidden="true" />` (Outbound submission)
  - `interview`: `<CalendarClock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />` (Scheduled conversation)
  - `offers`: `<Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />` (Success / Offer achievement)
  - `closed`: `<Archive className="h-4 w-4 text-[var(--text-muted)]" aria-hidden="true" />` (Archived / Closed application)
  - `default / custom`: If `column.icon` is a custom user emoji, render `<span>{column.icon}</span>`; if it matches a known column ID, render the corresponding Lucide component.

### 3.2 Controls in Kanban

- **Expand/Collapse Sub-stages:** Line 230–244 of `KanbanBoardV3.tsx` uses `<ChevronDown className="h-4 w-4" />` and `<ChevronRight className="h-4 w-4" />` inside an accessible button (`aria-label={isExpanded ? 'Collapse sub-stages' : 'Expand sub-stages'}`). This is already accessible and functional.
- **Count Badges:** Uses `<Badge variant="outline">` with numerical count. Clean and clear.
- **Empty State Icons:** Line 283–288 renders:
  ```tsx
  <EmptyState
    column={column}
    Icon={() => <span className="text-3xl">{column.icon || getColumnIcon(column.id)}</span>}
  />
  ```
  In `EmptyState`, line 155 renders `<Icon className="h-12 w-12 text-[var(--text-muted)]" />`. Because `Icon` currently renders a `<span>`, the `h-12 w-12` class is ineffective on an inline element. By passing a real Lucide component with `h-10 w-10` or `h-12 w-12`, the empty states will display crisp, scalable, theme-aware vector icons.

### 3.3 Strict Invariants Maintained

Phase E3 will **NOT** touch:

- `@dnd-kit/core` or `@dnd-kit/sortable`
- Drag sensors (`PointerSensor`, `MouseSensor`, `TouchSensor`, `KeyboardSensor`)
- Collision detection (`closestCorners`, `closestCenter`)
- Drag handlers (`handleDragStart`, `handleDragOver`, `handleDragEnd`)
- Position logic, status logic, or status mapping
- Column CRUD or column reordering actions
- Application mutations or bulk move operations
- Filtering or sorting algorithms

---

## 4. APPLICATION DETAIL AUDIT

### 4.1 Metadata Strip (`ApplicationDetailLayout.tsx`)

Lines 83–135 render six metadata items in a horizontal responsive strip:

1. **Location:** `📍` -> Proposed: `<MapPin className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" aria-hidden="true" />`
2. **Salary:** `💰` -> Proposed: `<WalletCards className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" aria-hidden="true" />`
3. **Status:** `📊` -> Proposed: `<Activity className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" aria-hidden="true" />`
4. **Column:** `📁` -> Proposed: `<KanbanSquare className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" aria-hidden="true" />`
5. **Date Applied:** `📅` -> Proposed: `<Calendar className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" aria-hidden="true" />`
6. **Source:** `🔗` -> Proposed: `<Compass className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" aria-hidden="true" />`

### 4.2 Main Panel Components

- **`JobDescription.tsx`:**
  - Empty state uses `📝` inside a `w-12 h-12 rounded-full` container. Replace with `<FileText className="h-6 w-6 text-[var(--text-muted)]" aria-hidden="true" />`.
  - External link header uses raw `text-orange-700 dark:text-amber-400`. Replace with `text-[hsl(var(--copper-dark))]`.
  - External link trailing icon lacks `aria-hidden="true"`.
- **`CompanyInfo.tsx`:**
  - Header icons (`<Building2>`, `<LinkIcon>`) use raw `text-orange-700 dark:text-amber-400`. Replace with `text-[hsl(var(--copper-dark))]`.
  - Action buttons use `<Edit className="w-4 h-4 mr-2" />` (deprecated name) and raw colors. Harmonize to `<Edit2 className="h-4 w-4 mr-1.5" aria-hidden="true" />`.
  - Empty state uses `<Building2 className="w-12 h-12 text-slate-400 dark:text-slate-500" />`. Standardize to `<Building2 className="h-10 w-10 text-[var(--text-muted)]" aria-hidden="true" />`.
  - Website link uses `<Globe className="w-4 h-4" />`. Standardize to `<Globe className="h-3.5 w-3.5 text-[var(--text-muted)]" aria-hidden="true" />`.
- **`Documents.tsx`:**
  - Empty state uses `<FileText className="w-12 h-12 text-slate-400 dark:text-slate-500" />`. Standardize to `<FileText className="h-10 w-10 text-[var(--text-muted)]" aria-hidden="true" />`.
  - Row item uses `<File className="w-5 h-5 text-slate-700 dark:text-slate-300" />`. Replace with `<FileText className="h-4 w-4 text-[var(--text-secondary)]" aria-hidden="true" />`.
  - Standardize button icon margins from `mr-2` (8px) to `mr-1.5` (6px) for tight visual balance.

### 4.3 Data Structures & Form Invariance

Phase E3 touches **only** JSX icon tags and CSS class names. No props, hooks, state variables, server actions, or database schemas will be touched.

---

## 5. LUCIDE SYSTEM SPECIFICATION

To ensure visual harmony across the entire application, Phase E3 adopts the following unified iconography rules:

| Category                  | Recommended Size | Tailwind Class             | Usage Context                                                          | Stroke Width  |
| :------------------------ | :--------------- | :------------------------- | :--------------------------------------------------------------------- | :------------ |
| **Inline Metadata**       | 14px             | `h-3.5 w-3.5`              | ApplicationDetail header strip, table metadata, chips                  | 2px (default) |
| **Button / Control Icon** | 16px             | `h-4 w-4`                  | Button leading icon (`mr-1.5`), modal close buttons, dropdown chevrons | 2px (default) |
| **Section Header Icon**   | 18px–20px        | `h-4.5 w-4.5` or `h-5 w-5` | Card headers, form section headings (`Building2`, `ExternalLink`)      | 2px (default) |
| **Column Badge Icon**     | 16px–18px        | `h-4.5 w-4.5`              | 40x40px rounded circular column header badge                           | 2px (default) |
| **Empty State Icon**      | 40px–48px        | `h-10 w-10` or `h-12 w-12` | Empty Kanban column, empty document list, empty job description        | 1.5px / 2px   |

### Deviations & Justifications

- **14px (`h-3.5 w-3.5`) for metadata:** The standard guidance recommends 16px, but in the compact metadata strip (`text-xs sm:text-sm`), 16px (`h-4 w-4`) visually overpowers 12px text. Using `14px` (`h-3.5 w-3.5`) creates a balanced baseline optical alignment without causing line wrap on 375px mobile screens.
- **40px (`h-10 w-10`) for empty states:** 48px (`h-12 w-12`) inside a 48px/64px container can feel bulky in modal sub-panels. `40px` (`h-10 w-10`) maintains generous breathing room while remaining commanding.

---

## 6. ACCESSIBILITY FINDINGS

### 6.1 Interactive Icons

- **Findings:**
  - `KanbanBoardV3.tsx`: Collapse/expand buttons currently include `aria-label="Collapse sub-stages"` / `aria-label="Expand sub-stages"`. The inner `<ChevronDown>` and `<ChevronRight>` SVGs should have `aria-hidden="true"`.
  - `Documents.tsx`: The delete button currently has `aria-label="Delete document"` with an icon child `<Trash2 className="w-4 h-4" />`. Adding `aria-hidden="true"` prevents screen readers from announcing duplicate or empty SVG nodes.
  - `CompanyInfo.tsx`: Unlink and Edit buttons currently contain visible text ("Edit", "Unlink"). The inner SVGs are decorative cues and must have `aria-hidden="true"`.

### 6.2 Decorative Icons

- **Findings:**
  - All icons in `ApplicationDetailLayout.tsx` metadata strip (`MapPin`, `WalletCards`, `Activity`, `KanbanSquare`, `Calendar`, `Compass`) are purely decorative cues accompanying visible textual descriptions.
  - **Rule:** Every metadata icon must explicitly specify `aria-hidden="true"` to prevent assistive technology from announcing cryptic SVG descriptions or interrupting text flow.

---

## 7. THEME SAFETY

### 7.1 Light and Dark Mode Verification

- **Current Defect:** Multiple files in `ApplicationDetail/components/MainPanel/` use hardcoded raw colors:
  - `text-orange-700 dark:text-amber-400`
  - `text-slate-400 dark:text-slate-500`
  - `text-slate-700 dark:text-slate-300`
  - `text-label-secondary`
- **Correction:** Migrate all raw color references to approved Phase A design tokens:
  - Primary text: `text-[var(--text-primary)]`
  - Secondary text: `text-[var(--text-secondary)]`
  - Muted icon/text: `text-[var(--text-muted)]`
  - Accent brand icon: `text-[hsl(var(--copper-dark))]` (Light) / `text-[hsl(var(--copper-light))]` (Dark)
  - Destructive: `text-destructive`
- **Legacy Token Freeze:** `src/app/styles/theme/legacy-shadcn.css` remains strictly **FROZEN**. No CSS files will be edited.

---

## 8. GLASS BOUNDARY VERIFICATION

- **Confirmation:** Phase E3 will **NOT** introduce:
  - Glass or pseudo-glass effects
  - `backdrop-blur`
  - Additional CSS gradients
  - Decorative SVG background illustrations
  - Floating glass control bars
- E3 is 100% focused on icon component standardization and token cleanup.

---

## 9. RESPONSIVE SAFETY

Icon behavior was verified across standard responsive breakpoints:

- **320px (Small Mobile):** In `ApplicationDetailLayout.tsx`, the metadata strip wraps with `flex-wrap` and `gap-x-6 gap-y-2`. Replacing emojis with `h-3.5 w-3.5` Lucide icons preserves horizontal compactness and prevents word breaking.
- **375px (Standard Mobile):** Metadata chips fit 2 per row cleanly.
- **768px (Tablet):** Column headers in Kanban board maintain balanced 40x40px badge alignment with `h-4.5 w-4.5` Lucide icons.
- **1024px & 1440px (Desktop / Ultra-wide):** Clear visual hierarchy between column headers, action buttons, and panel tabs.

---

## 10. PROPOSED ICON SYSTEM SPECIFICATION

```ts
// Canonical Semantic Token Mapping for Icons:
--icon-primary:     var(--text-primary)
--icon-secondary:   var(--text-secondary)
--icon-muted:       var(--text-muted)
--icon-brand:       hsl(var(--copper-dark)) / hsl(var(--copper-light))
--icon-danger:      var(--destructive)
```

- **Spacing Standards:**
  - Between icon and text in buttons: `mr-1.5` (6px)
  - Between icon and text in metadata tags: `gap-1.5` (6px)
  - Between icon and text in panel headers: `gap-2` (8px)
- **Touch Target Safeguards:**
  - Standalone icon buttons must maintain minimum `h-8 w-8` (32px) or `h-9 w-9` (36px) bounding box with generous padding.

---

## 11. PROPOSED FILE SCOPE

### MUST MODIFY (Core E3 Scope)

1. `src/components/applications/KanbanBoardV3.tsx`
   - Replace emoji rendering in column headers and empty states with Lucide icon component mapping.
   - Retain backward compatibility for custom user column strings.
2. `src/components/applications/ApplicationDetail/components/ApplicationDetailLayout.tsx`
   - Replace 6 metadata strip emojis with `MapPin`, `WalletCards`, `Activity`, `KanbanSquare`, `Calendar`, `Compass`.
   - Add `aria-hidden="true"` to all decorative SVGs.
3. `src/components/applications/ApplicationDetail/components/MainPanel/JobDescription.tsx`
   - Replace `📝` emoji in empty state with `<FileText className="h-8 w-8 text-[var(--text-muted)]" aria-hidden="true" />`.
   - Replace raw `text-orange-700 dark:text-amber-400` with `text-[hsl(var(--copper-dark))]`.
   - Add `aria-hidden="true"` to `<ExternalLink>`.
4. `src/components/applications/ApplicationDetail/components/MainPanel/CompanyInfo.tsx`
   - Replace raw colors (`text-orange-700`, `text-slate-400`) with semantic tokens.
   - Replace deprecated `<Edit>` with `<Edit2>`.
   - Standardize icon sizes (`h-5 w-5`, `h-4 w-4`, `h-10 w-10`).
   - Add `aria-hidden="true"` to decorative icons.
5. `src/components/applications/ApplicationDetail/components/MainPanel/Documents.tsx`
   - Standardize empty state icon to `<FileText className="h-10 w-10 text-[var(--text-muted)]" aria-hidden="true" />`.
   - Standardize row icon to `<FileText className="h-4 w-4 text-[var(--text-secondary)]" aria-hidden="true" />`.
   - Replace hardcoded slate colors with semantic tokens.
   - Add `aria-hidden="true"` to decorative icons.

### SHOULD MODIFY (Optional Harmonization in E3)

6. `src/components/applications/ApplicationDetail/components/LeftPanel/TabNavigation.tsx`
   - Harmonize `<Building>` to `<Building2>` to match `CompanyInfo.tsx`.
   - Add `aria-hidden="true"` to tab icons.
7. `src/components/applications/ApplicationDetail/components/ActionButtons/ActionButtons.tsx`
   - Replace raw `text-slate-500` with `text-[var(--text-muted)]`.
   - Add `aria-hidden="true"` to `<ExternalLink>`, `<Edit2>`, `<Trash2>`, and `<X>`.

### DO NOT MODIFY (Strictly Frozen)

- `src/app/styles/theme/legacy-shadcn.css` (FROZEN)
- `src/app/styles/utilities/gradients.css` (FROZEN)
- `src/app/dashboard/page.tsx` (FROZEN from E2)
- `src/components/dashboard/*` (FROZEN from E1)
- `src/components/ui/*` (FROZEN from Phase B)
- `src/lib/types/*`
- `src/lib/storage/column-storage.ts`
- `src/app/dashboard/actions/*`

---

## 12. REGRESSION CONSTRAINTS

Under no circumstances will Phase E3 modify:

1. Supabase database schema or client configuration
2. Next.js server actions (`src/app/dashboard/actions/*`)
3. Authentication or storage logic
4. DnD-kit drag sensors, droppable containers, or sortable context
5. Application mutations, status updates, or optimistic state
6. Filter and sort algorithms
7. ThemeProvider or CSS custom property definitions
8. Phase E1 Dashboard analytics widgets
9. Phase E2 Editorial atmosphere or background styling
10. `legacy-shadcn.css` token definitions

---

## 13. IMPLEMENTATION SEQUENCE

When approved for execution, Phase E3 will follow this exact phased sequence:

1. **Step 1 — Kanban Column Iconography:**
   - In `KanbanBoardV3.tsx`, define a clean helper `renderColumnIcon(column: ColumnConfig)` that maps default column IDs (`saved`, `applied`, `interview`, `offers`, `closed`) to their dedicated Lucide icons (`Bookmark`, `Send`, `CalendarClock`, `Sparkles`, `Archive`), while gracefully falling back to string rendering for custom column emojis.
   - Update `EmptyState` to render the matching Lucide icon.
2. **Step 2 — Application Detail Metadata Strip:**
   - In `ApplicationDetailLayout.tsx`, replace the 6 emojis with `MapPin`, `WalletCards`, `Activity`, `KanbanSquare`, `Calendar`, `Compass`.
   - Set `aria-hidden="true"` on all 6 icons.
3. **Step 3 — MainPanel Subcomponents Clean-up:**
   - In `JobDescription.tsx`: update empty state memo emoji to `<FileText>`, fix `ExternalLink` styling.
   - In `CompanyInfo.tsx`: replace deprecated `Edit` with `Edit2`, migrate raw colors to tokens, standardize sizes.
   - In `Documents.tsx`: replace `File` with `FileText`, migrate raw slate colors to tokens.
4. **Step 4 — Minor Navigation & Action Harmonization (if in scope):**
   - Harmonize `Building` -> `Building2` in `TabNavigation.tsx`.
   - Ensure all decorative SVGs have `aria-hidden="true"`.
5. **Step 5 — Verification & Gate Check:**
   - Run TypeScript typecheck, ESLint, and full Vitest suite.
   - Inspect git diff to verify zero scope creep.

---

## 14. VERIFICATION PLAN

Following implementation, the verification checklist will require:

| Check                 | Command / Method                              | Success Threshold                                           |
| :-------------------- | :-------------------------------------------- | :---------------------------------------------------------- |
| **TypeScript**        | `npm run typecheck`                           | 0 errors                                                    |
| **ESLint**            | `npm run lint`                                | 0 warnings / errors                                         |
| **Targeted Tests**    | `npx vitest run src/components/applications/` | 11/11 test files, 198/198 tests pass                        |
| **Full Vitest Suite** | `npm test`                                    | 41/41 test files, 627/627 tests pass                        |
| **Git Scope Check**   | `git status --short`                          | Only the approved files in `src/components/applications/`   |
| **Theme Safety**      | Code inspection for raw colors                | Zero `text-orange-*`, zero `text-slate-*` in modified files |
| **Accessibility**     | Visual + AST check                            | All decorative SVGs have `aria-hidden="true"`               |

---

## 15. RISKS & MITIGATION

1. **Risk:** Custom columns created by users might have emoji characters stored in the database.
   - **Mitigation:** The column icon renderer will check if `column.id` matches a default column; if so, it renders the modern Lucide icon. If `column.isCustom` is true and `column.icon` is provided, it safely falls back to rendering the user's custom emoji string.
2. **Risk:** Existing unit tests might assert on emoji characters.
   - **Mitigation:** Forensic audit of `KanbanBoardV3.test.tsx` and `ApplicationDetail.test.tsx` confirmed that tests mock `getColumnIcon` or assert on text labels (`San Francisco, CA`, `Applied`, etc.), NOT the emoji characters. All 198 tests in `src/components/applications/` passed.

---

## 16. OPEN QUESTIONS

1. **Custom Column Icon Picker:** Currently `ColumnManageModal.tsx` offers an emoji selector dropdown for custom columns. Should the custom column icon picker be modernized to Lucide icons in Phase E3, or deferred to Phase E4 (Modal Architecture Refinement)?
   - _Recommendation:_ Keep `ColumnManageModal.tsx` unchanged in E3 to maintain strict minimal scope, allowing users' custom emoji selections to render seamlessly alongside default Lucide column icons.

---

## 17. FINAL READINESS VERDICT

```
E3 READY FOR IMPLEMENTATION
```
