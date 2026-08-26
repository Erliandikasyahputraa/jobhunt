# JobHunt UI/UX Polish Audit & Design System Plan

## 1. Executive Summary & Objective

- **Baseline Commit**: `dfb8f5171726352b0c47ac2f014cfcf15d9394be` (Functional Feature Freeze)
- **Phase Goal**: Visual-only design system unification and interaction polish.
- **Strict Boundary**: All database schemas, RLS, Server Actions, API routes, application state, URL syncing, and drag-and-drop mechanics are **FROZEN**.
- **Dark Mode Policy**: The dark-mode scheme is already well-tuned and serves as the visual reference standard. It remains unchanged, except where shared components require alignment.
- **Light Mode Priority**: Light mode currently suffers from flat, washed-out pure-white backgrounds and inconsistent border/surface separation. The objective is to introduce subtle, restrained tonal depth, soft borders, and clear surface hierarchy.

---

## 2. Existing Design Tokens & System Analysis

### 2.1 CSS Modular Structure

The styling system is loaded via `src/app/globals.css`:

- `styles/theme/base-colors.css` (Base color values, brand copper palette: `--copper: 25 95% 53%`)
- `styles/theme/semantic-colors.css` (macOS 26 liquid glass tokens, labels, fill colors, glass materials)
- `styles/theme/legacy-shadcn.css` (Compatibility CSS variables for Radix UI / Shadcn primitives)
- `styles/components/glass-effects.css` (`.glass-ultra`, `.glass-light`, `.glass-medium`, `.glass-heavy`, `.glass-interactive`)
- `styles/components/surfaces.css` (`.surface-primary`, `.surface-secondary`, `.surface-tertiary`)
- `styles/utilities/shadows.css` (`--shadow-glass-subtle`, `--shadow-glass-soft`, `--shadow-glass-medium`, `--shadow-glass-strong`)
- `styles/utilities/border-radius.css` (`--radius: 0.5rem`, `rounded-glass`, `rounded-glass-sm`, `rounded-glass-lg`)

### 2.2 Surface Hierarchy

| Level                        | Purpose                          | Dark Mode Token / Class                                        | Current Light Mode State                 | Target Light Mode Polish                                                           |
| ---------------------------- | -------------------------------- | -------------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------- |
| **L0 (Canvas)**              | Page background                  | `var(--gradient-light-start)` to `end` (subtle dark navy/gray) | Pure white / near-white (#ffffff)        | Warm tinted background (`hsl(220 20% 98%)` / subtle gradient)                      |
| **L1 (Panel)**               | Kanban columns, Dashboard panels | `.glass-light` / `.glass-ultra`                                | Often blends directly with L0            | Soft tinted surface (`hsl(0 0% 100% / 0.7)` with `border-black/5` & subtle shadow) |
| **L2 (Card)**                | Application cards, Stat cards    | `.glass-light` + `border-glass-strong`                         | White box with harsh border or no shadow | Crisp elevated card with soft border (`hsl(0 0% 100% / 0.9)` + `box-shadow`)       |
| **L3 (Interactive / Hover)** | Card hover, dropdown hover       | `.glass-heavy` or copper glow                                  | Inconsistent hover feedback              | Standardized smooth transition + subtle ring/border elevation                      |
| **L4 (Overlay / Modal)**     | Dialogs, Popovers, Toolbars      | `.glass-medium` / `.glass-heavy`                               | High contrast white popovers             | Refined backdrop blur with balanced border contrast                                |

---

## 3. Identified Visual Inconsistencies & Gaps

### 3.1 Button & Control Inconsistencies

1. **Button Variants**:
   - `variant="glass"` uses `[var(--glass-medium)]` with spring timing.
   - `variant="outline"` uses standard `border bg-background shadow-xs hover:bg-accent`.
   - `variant="default"` uses `bg-primary text-primary-foreground`.
   - In several places (e.g., `Documents.tsx`), buttons use custom ad-hoc inline classes (`className="h-8 text-copper hover:text-copper/80 hover:bg-copper/10"`, `bg-copper hover:bg-copper/90 text-white`) instead of unified button variants.
2. **Input Fields**:
   - Search input in `ApplicationsToolbar` uses `variant="glass"`.
   - Inputs in `Documents.tsx` and modal forms use standard `<Input>` or custom tailwind borders (`border-gray-300`).
3. **Checkboxes**:
   - `ApplicationCard.tsx` uses `@/components/ui/checkbox`.
   - `ApplicationsToolbar.tsx` mobile filters use raw `<input type="checkbox" className="rounded border-gray-300 text-blue-600..." />`.
4. **Dropdowns & Select Menus**:
   - Status filters use Radix `DropdownMenuContent` with `.bg-popover`.
   - Bulk actions toolbar dropdown uses `DropdownMenu` with ad-hoc styling.
   - Documents type selector uses `Select` with `.glass-ultra .border-glass-border`.

### 3.2 Surface & Elevation Inconsistencies

1. **Bulk Actions Toolbar**:
   - Currently rendered with `border-blue-500/30` and `glass-heavy`. In light mode, the blue border can feel disconnected from the copper brand palette. It should align with the clean glassmorphic design system while retaining clear selection presence.
2. **Documents UI**:
   - Empty state, document cards, and upload dialogs use a mix of `.glass-panel`, `.glass-ultra`, and raw Tailwind borders (`border-copper/20`).
   - Action buttons (Download, Delete) have inconsistent hover treatments.
3. **Kanban Board & Columns**:
   - Column headers have count badges (`data-testid="count-badge-*"`) styled with `glass-light border border-label-quaternary/30`.
   - Column containers in light mode have minimal contrast against the canvas background.

### 3.3 Light Mode Specific Contrast Issues

1. **Excessive Pure White**:
   - In light mode, backgrounds, card backgrounds, and popovers all share `hsl(0 0% 100%)` causing lack of hierarchy.
2. **Text Secondary Legibility**:
   - Text using `text-label-secondary` or `text-muted-foreground` in light mode can have lower contrast against translucent glass backgrounds.
3. **Hover States**:
   - Several clickable cards lack smooth micro-interactions or only change border color abruptly without elevation or background transitions.

---

## 4. Unification Strategy & Recommended Shared Fixes

### 4.1 Step 1: Design Tokens & CSS Variables (`globals.css` & Theme Styles)

- Refine light mode semantic variables in `src/app/styles/theme/legacy-shadcn.css` and `src/app/styles/theme/semantic-colors.css`:
  - Adjust `--background` in light mode to a soft neutral canvas (`hsl(220 20% 98%)` / `#f8fafc`).
  - Ensure `--card` in light mode is clean elevated white (`hsl(0 0% 100%)`) with a subtle 1px border (`hsl(220 13% 91%)`).
  - Unify `--border` and `--input` tokens so all inputs and cards share consistent framing.
  - Preserve all dark mode variables (`.dark` block) exactly as verified.

### 4.2 Step 2: Shared UI Primitives

- **`Button` (`src/components/ui/button.tsx`)**:
  - Add smooth transition utilities (`transition-all duration-200 ease-out`).
  - Refine `variant="outline"` and `variant="ghost"` hover states to use soft surface highlights.
  - Standardize copper brand button variant (`variant="brand"` or uniform `bg-copper` token).
- **`Input` (`src/components/ui/input.tsx`)**:
  - Unify default and glass inputs so focus rings use `--ring` with subtle shadow glow.
- **`Card` (`src/components/ui/card.tsx`)**:
  - Unify border and elevation tokens for `variant="glass"` and default cards.
- **`Checkbox` (`src/components/ui/checkbox.tsx`)**:
  - Ensure checkbox uses copper or brand primary on check, with accessible focus outline.
- **`DropdownMenu` & `Select` (`src/components/ui/dropdown-menu.tsx`, `select.tsx`)**:
  - Unify menu padding, backdrop blur, border radius (`rounded-lg`), and active/hover item highlighting.
- **`Dialog` & `AlertDialog` (`src/components/ui/dialog.tsx`, `alert-dialog.tsx`)**:
  - Standardize overlay blur and modal surface borders.

### 4.3 Step 3: Applications & Kanban Polish

- **`KanbanBoardV3.tsx`**:
  - Enhance column container surface definition and column header badges.
  - Subtle drop target highlight during drag over.
  - Refine empty column state typography and visual balance.
- **`ApplicationCard.tsx`**:
  - Polish card borders, selection ring (`ring-copper` or cohesive selection indicator), and drag handle grip icon styling.
  - Maintain all DnD props and click handlers intact.
- **`ApplicationsToolbar.tsx` & `FilterChips.tsx`**:
  - Replace raw input checkboxes with design system controls.
  - Unify search bar, filter button, sort dropdown, and export button heights and hover states.
- **`BulkActionsToolbar.tsx`**:
  - Refine bulk bar styling to feel seamless with the toolbar while maintaining clear multi-select focus.

### 4.4 Step 4: Documents & Application Detail Polish

- **`Documents.tsx`**:
  - Standardize document item card layout, file icon badges, action button hover states, and dialog styling.
- **`ApplicationDetail` Layout & Panels**:
  - Unify tab active indicators, header typography, and border separation between left/main/right panels.

### 4.5 Step 5: Dashboard & Navigation Polish

- **`NavBar.tsx`**:
  - Unify active tab pill styles and profile dropdown trigger.
- **`DashboardStats.tsx`, `RecentActivity.tsx`, `StatusDistributionChart.tsx`, `ActivityCalendar.tsx`**:
  - Align card surfaces, metric typography, and chart container borders with the shared design system.

---

## 5. Scope & Component Matrix

| Area               | Component(s)                                                                                                       | Type of Polish                                           | Functional Risk                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- | --------------------------------------- |
| **Theme / Tokens** | `legacy-shadcn.css`, `semantic-colors.css`, `glass-effects.css`                                                    | Light mode surface & border token refinement             | Zero (CSS only)                         |
| **Primitives**     | `button.tsx`, `input.tsx`, `card.tsx`, `checkbox.tsx`, `dropdown-menu.tsx`, `dialog.tsx`                           | Interaction transitions, focus rings, hover styles       | Zero (DOM & props preserved)            |
| **Applications**   | `KanbanBoardV3.tsx`, `ApplicationCard.tsx`, `ApplicationsToolbar.tsx`, `BulkActionsToolbar.tsx`, `FilterChips.tsx` | Visual hierarchy, selection styling, control alignment   | Zero (DnD & events preserved)           |
| **Documents**      | `Documents.tsx`, `DocumentRow`                                                                                     | Document list styling, button unification, modal styling | Zero (Upload/download/delete preserved) |
| **Dashboard**      | `DashboardStats.tsx`, `RecentActivity.tsx`, `ActivityCalendar.tsx`, `StatusDistributionChart.tsx`                  | Stat cards, list spacing, empty state polish             | Zero (Calculations preserved)           |
| **Navigation**     | `NavBar.tsx`, `ProfileDropdown.tsx`                                                                                | Active nav indicator, mobile nav bar styling             | Zero (Navigation routes preserved)      |

---

## 6. Execution Plan & Quality Verification Gates

1. **Step 1: Visual Tokens & Theme CSS**: Refine light mode variables in theme files.
2. **Step 2: Shared UI Primitives**: Standardize buttons, inputs, checkboxes, cards, dialogs, dropdowns.
3. **Step 3: Applications Kanban & Bulk Actions UI**: Polish card cards, columns, toolbars, selection states.
4. **Step 4: Documents & Detail Panels**: Polish Documents tab and detail views.
5. **Step 5: Dashboard & Navigation**: Polish dashboard stats, charts, recent activity, and navbar.
6. **Step 6: Comprehensive Verification**:
   - `bun run typecheck` (0 errors)
   - `bun run lint` (0 errors)
   - `bun run test` (All 589 tests passing)
   - `bunx next build` (Clean production build)
   - Full manual QA across light and dark modes
