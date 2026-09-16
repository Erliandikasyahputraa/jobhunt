# ANTI-NGANGGUR — PRE-PHASE 2 MODAL VISUAL REVISION AUDIT

**Document Reference:** `ANTI_NGANGGUR_PHASE_2_MODAL_VISUAL_REVISION.md`  
**Auditor:** Senior Design Systems Engineer, Accessibility Specialist & Principal Frontend Architect  
**Evaluation Scope:** Visual Architecture Audit of Job Application Modal, Edit Form, and Dialog System  
**Date:** September 16, 2026  
**Status:** REVISED AUDIT COMPLETE — DESIGN GATE RE-EVALUATION

---

## 1. Executive Summary

This forensic visual architecture audit re-evaluates the modal and popup system of Anti-Nganggur following direct inspection of rendered application states and the actual repository implementation.

While the previous gate review established theoretical mathematical color boundaries, the actual code implementation suffers from a critical visual failure: **the Dark Mode modal renders with a blinding pure-white header docked to a dark translucent body**, producing a severe **"Frankenstein UI"**. Furthermore, the Light Mode modal collapses into a **flat, washed-out sheet of uniform white and faint gray outlines**, while modal contents across both modes are polluted with **nested glassmorphic backdrop-filters** and an over-proliferation of uncalibrated borders.

### Primary Audit Conclusions:

1. **White Header Root Cause:** In [ApplicationDetailLayout.tsx](file:///c:/Mine/porto/jobtracker/anti-nganggur/src/components/applications/ApplicationDetail/components/ApplicationDetailLayout.tsx#L48) and [ApplicationDetail.tsx](file:///c:/Mine/porto/jobtracker/anti-nganggur/src/components/applications/ApplicationDetail/ApplicationDetail.tsx#L117), headers declare `className="bg-white dark:glass-ultra"`. Because `.glass-ultra` is a raw custom CSS rule (not registered as a Tailwind utility with `@utility`), the Tailwind compiler **never generates `.dark .dark\:glass-ultra`**. Consequently, `bg-white` remains unconditionally active in Dark Mode, forcing `background-color: #ffffff` under white text (`text-label-primary`).
2. **Backdrop & Modal Washed-Out Translucency:** The custom `DialogContent` in [ApplicationDetail.tsx](file:///c:/Mine/porto/jobtracker/anti-nganggur/src/components/applications/ApplicationDetail/ApplicationDetail.tsx#L38) applies `dark:bg-[var(--glass-medium)]` (which is 35% transparent) plus `backdrop-blur-[30px]`. Applying backdrop filters and transparency to the modal container allows underlying backdrop scrim and dashboard cards to bleed through, destroying visual contrast and causing murky rendering.
3. **Light Mode Flatness Trap:** In Light Mode, the modal shell, header, sidebar, canvas, and cards all render `bg-white`. The cards use `.glass-ultra`, which in light mode is 85% transparent white over 100% white. The result is zero surface contrast, forcing an over-reliance on 1px borders.
4. **Architectural Remedy:** Replace scattered ad-hoc utility classes and broken glass tokens with a unified, semantic **8-layer surface hierarchy** backed by CSS custom properties (`--modal-shell`, `--modal-header`, `--modal-canvas`, `--modal-card`, `--modal-input`, `--modal-border`).
5. **Final Gate Verdict:** `DESIGN GATE REQUIRES REVISION` until the structural fixes detailed herein are formally integrated into Phase 2 execution.

---

## 2. Screenshot Findings & Visual Discrepancy Log

Comparison between the intended design system and actual rendered states reveals five critical defects:

| Defect ID   | Rendered Screenshot Observation                                                                                                                                                                      | Intended Design Specification                                                                                                        | Impact                                                                             |
| :---------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------- |
| **DISC-01** | **Blinding White Header in Dark Mode:** The top header strip (avatar, job title, company name, action buttons) renders as solid white `#ffffff` with white text, while the modal body below is dark. | The entire modal shell, header, and sidebar must form a unified Deep Slate envelope (`#0f172a`).                                     | **CRITICAL:** Visual break, unreadable text, destroys dark mode immersion.         |
| **DISC-02** | **Washed-Out / Muddy Dark Body:** The main panel and timeline in Dark Mode appear translucent and fuzzy; background kanban board elements bleed through.                                             | Opaque surfaces: Modal shell `#0f172a`, canvas `#090d16`, cards `#1e293b`. Modal must be fully opaque.                               | **HIGH:** Reduces text contrast below WCAG thresholds; causes GPU compositing lag. |
| **DISC-03** | **Light Mode "Monochrome Hospital Sheet":** In Light Mode, everything inside the modal is flat pure white with identical faint gray outlines.                                                        | Clear tonal contrast: Recessed `#f1f5f9` canvas, anchored `#f8fafc` header/sidebar, and elevated `#ffffff` cards with micro-shadows. | **HIGH:** Lack of visual hierarchy; cognitive strain scanning cards.               |
| **DISC-04** | **"Box Inside Box" Border Overload:** Every card, subsection, input field, and tab item is bounded by prominent gray outlines.                                                                       | Structural hierarchy driven by tonal elevation, surface contrast, and spacing; borders reserved for essential boundaries.            | **MEDIUM:** Visual clutter; feels like an unstyled wireframe.                      |
| **DISC-05** | **Neon Orange Line Spam in Dark Mode:** The vertical timeline connector line is a high-saturation orange bar (`dark:border-copper/50`), and all icons/status titles are tinted orange.               | Neutral Slate connector (`#334155`); copper strictly reserved for active status node and primary CTA.                                | **MEDIUM:** Visual fatigue; distracts from actual job content.                     |

---

## 3. Dark Mode Frankenstein Analysis

The phenomenon termed "Frankenstein UI" is not merely an aesthetic mismatch; it is a structural failure where distinct subcomponents operate under incompatible design philosophies:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ MODAL CONTAINER (ApplicationDetail.tsx)                                │
│ dark:bg-[var(--glass-medium)] (35% Transparent Dark Glass)             │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ HEADER (ApplicationDetailLayout.tsx)                               │ │
│ │ bg-white [FAILED dark:glass-ultra fallback]                        │ │
│ │ ──> RENDERS PURE SOLID WHITE #FFFFFF IN DARK MODE <──               │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────┬────────────────────────┬────────────────────┐ │
│ │ SIDEBAR (TabNav)     │ MAIN CONTENT (Cards)   │ TIMELINE PANEL     │ │
│ │ bg-transparent       │ bg-transparent         │ bg-transparent     │ │
│ │ Floating glass tabs  │ .glass-ultra cards     │ Bright orange line │ │
│ │ (Incompatible style) │ (Translucent grey)     │ (Over-accented)    │ │
│ └──────────────────────┴────────────────────────┴────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

The header acts like an un-themed Light Mode artifact, the modal shell acts like a semi-transparent macOS glass sheet, the cards act like floating wireframes, and the timeline acts like a neon copper diagram. They do not belong to the same visual system.

---

## 4. Root Cause Analysis (Codebase Forensics)

A file-by-file forensic investigation reveals the exact technical mechanisms causing these failures:

### 4.1 Root Cause of the White Header

- **Files:** [ApplicationDetailLayout.tsx line 48](file:///c:/Mine/porto/jobtracker/anti-nganggur/src/components/applications/ApplicationDetail/components/ApplicationDetailLayout.tsx#L48) and [ApplicationDetail.tsx line 117](file:///c:/Mine/porto/jobtracker/anti-nganggur/src/components/applications/ApplicationDetail/ApplicationDetail.tsx#L117).
- **Code:** `className="bg-white dark:glass-ultra border-b border-neutral-200 ..."`
- **Failure Mechanism:**
  1. Tailwind CSS processes class names during build/runtime. The class `.glass-ultra` is defined in `src/app/styles/components/glass-effects.css` as a standard CSS rule:
     ```css
     .glass-ultra {
       background: var(--glass-ultra);
       backdrop-filter: blur(15px) saturate(150%);
       ...
     }
     ```
  2. Because `.glass-ultra` was not registered via Tailwind's `@utility` directive or as a plugin component, the Tailwind compiler has **no definition for the variant `dark:glass-ultra`**.
  3. Tailwind discards `dark:glass-ultra` as an unrecognized token.
  4. The browser only receives `bg-white` (`background-color: #ffffff`).
  5. In Dark Mode, the text inherits `dark:text-label-primary` (white `#f8fafc`), resulting in invisible white text on an accidental white header background.

### 4.2 Root Cause of Washed-Out Translucent Modal Body

- **File:** [ApplicationDetail.tsx lines 24-46 & 94](file:///c:/Mine/porto/jobtracker/anti-nganggur/src/components/applications/ApplicationDetail/ApplicationDetail.tsx#L38).
- **Code:**
  ```tsx
  <DialogPrimitive.Content
    className={cn(
      '... dark:bg-[var(--glass-medium)] dark:backdrop-blur-[30px] dark:border-[var(--glass-border-strong)]',
      className
    )}
  />
  ```
- **Failure Mechanism:**
  1. In `src/app/styles/theme/semantic-colors.css`, `--glass-medium` is defined as:
     `--glass-medium: color-mix(in srgb, rgb(var(--glass-base-dark)) 65%, transparent);`
  2. This makes the modal background **35% transparent**.
  3. The modal is layered on top of `DialogPrimitive.Overlay` (`bg-black/50 backdrop-blur-[40px]`).
  4. Double-stacking heavy backdrop blurs (`40px` on overlay + `30px` on modal shell + `15px` on cards) causes severe color washing, GPU rendering artifacts, and allows high-contrast elements from the dashboard beneath to show through the modal text.

### 4.3 Root Cause of Light Mode Flatness

- **Files:** [ApplicationDetailLayout.tsx lines 46, 140, 145, 150](file:///c:/Mine/porto/jobtracker/anti-nganggur/src/components/applications/ApplicationDetail/components/ApplicationDetailLayout.tsx#L46).
- **Code:** All panel wrappers have `bg-white dark:bg-transparent`.
- **Card Styling:** In [JobDescription.tsx](file:///c:/Mine/porto/jobtracker/anti-nganggur/src/components/applications/ApplicationDetail/components/MainPanel/JobDescription.tsx#L18) and [CompanyInfo.tsx](file:///c:/Mine/porto/jobtracker/anti-nganggur/src/components/applications/ApplicationDetail/components/MainPanel/CompanyInfo.tsx#L186), cards are styled with `<section className="glass-ultra rounded-glass-sm p-6">`.
- **Failure Mechanism:**
  1. In Light Mode, `--glass-ultra` is `color-mix(in srgb, rgb(255, 255, 255) 15%, transparent)` (15% white, 85% transparent).
  2. When a 15% white surface sits inside a `bg-white` container, mathematically the resulting color is identical to pure white `#ffffff`.
  3. Without tonal contrast between canvas and card, the card boundaries disappear completely unless an artificial border is applied.

---

## 5. Backdrop & Layering Architecture Audit

### 5.1 Correct Stacking Context & DOM Hierarchy

The modal dialog must adhere strictly to a non-leaking stacking architecture:

```text
[PAGE BODY] (position: relative, z-index: auto)
   └── [PORTAL ROOT] (Radix DialogPrimitive.Portal, z-index: 50)
         ├── [BACKDROP OVERLAY] (position: fixed, inset: 0, z-index: 50)
         │     ├── Light: bg-slate-900/40 + backdrop-blur-[2px]
         │     └── Dark:  bg-black/70 + backdrop-blur-[4px]
         │     └── Isolation: pointer-events: auto, aria-hidden: true
         └── [MODAL SHELL CONTAINER] (position: fixed, z-index: 51, OPAQUE)
               ├── Light: bg-white / #ffffff (100% OPAQUE)
               └── Dark:  bg-slate-900 / #0f172a (100% OPAQUE)
                     ├── [HEADER STRIP] (z-index: 1, sticky/fixed top)
                     └── [BODY CONTAINER] (z-index: 1, overflow-hidden)
                           ├── [SIDEBAR] (docked left, 1px border-r)
                           ├── [CANVAS] (recessed background)
                           │     └── [CARDS] (elevated opaque surfaces)
                           └── [TIMELINE] (docked right, 1px border-l)
```

### 5.2 Layering Invariants:

1. **The Modal Shell Must Be 100% Opaque:** Neither `DialogPrimitive.Content` nor its root layout wrapper may contain `backdrop-blur`, `opacity`, or semi-transparent alpha backgrounds (`bg-slate-900/60`). Transparency belongs exclusively to the Backdrop Overlay.
2. **Backdrop Filter Containment:** `backdrop-filter` is permitted **only** on the full-screen backdrop overlay (`DialogPrimitive.Overlay`). All internal card glassmorphic backdrop filters must be eliminated.
3. **Scroll Containment:** The backdrop must lock the document body scroll (`overscroll-behavior: contain`), while the modal panels independently own their internal scrollbars.

---

## 6. Light Mode Hierarchy Problems & Tonal Solution

### 6.1 The "Gray-on-Gray" & "White-out" Traps

Light Mode fails when either:

- Everything is gray (`#f1f5f9` on `#e2e8f0` on `#cbd5e1`), creating a dull, muddy appearance.
- Everything is white (`#ffffff` everywhere), creating a blinding, border-dependent wireframe.

### 6.2 The Three-Tier Workspace Solution

```text
[1. PAGE CANVAS] #f1f5f9 (Slate-100)
       ↓
[2. MODAL FRAME] #ffffff (Pure White Shell)
       ↓
[3. STRUCTURAL STRIPS] #f8fafc (Slate-50 Header & Sidebar - Subtly Anchored)
       ↓
[4. WORKSPACE CANVAS] #f1f5f9 (Slate-100 Recessed Basin)
       ↓
[5. ELEVATED WORKSPACE CARDS] #ffffff (Pure White Cards with Micro-Shadow)
```

### Visual Contrast Justification:

- **Card-to-Canvas Delta:** Placing `#ffffff` cards on a `#f1f5f9` recessed canvas creates an immediate $\Delta L \approx 6.5\%$ difference in surface luminance.
- **Natural Depth:** The eye perceives cards as elevated physical sheets of paper resting on a workspace tray, completely removing the need for heavy outlines or aggressive dark shadows.

---

## 7. Border & Elevation Audit (Stopping the Outlining Habit)

### 7.1 Current Defect: "Box Inside Box"

Currently, the UI stacks borders redundantly:

1. Modal Shell Border (`border border-neutral-200`)
2. Panel Column Border (`border-r border-neutral-200`)
3. Section Container Border (`border border-label-quaternary/20`)
4. Internal Card Border (`border border-[var(--glass-border-subtle)]`)
5. Input Field Border (`border border-[var(--glass-border-medium)]`)

When five concentric borders are visible simultaneously, visual tension spikes and readability plummets.

### 7.2 Strict Border Disciplining Rules:

1. **Structural Separators (1px only):** Use 1px borders strictly to separate functional columns:
   - Header bottom divider: `1px solid var(--modal-border)`
   - Sidebar right divider: `1px solid var(--modal-border)`
   - Timeline left divider: `1px solid var(--modal-border)`
2. **Card Boundaries:**
   - **Light Mode:** Cards use `1px solid #e2e8f0` paired with micro-ambient shadow `0 1px 3px rgba(15,23,42,0.05)`.
   - **Dark Mode:** Cards use `1px solid rgba(148, 163, 184, 0.14)` with zero drop shadow. The surface color `#1e293b` against `#090d16` provides the primary elevation.
3. **Elimination of Section Outlines:** Sub-sections inside cards (e.g. "Job Description text block" or "Notes area") must NOT have their own bounding boxes. They must flow naturally within the parent card container using typography spacing (`space-y-4`).

---

## 8. Semantic Design Token Proposal

To permanently decouple component code from ad-hoc hex values and uncompiled class names, the design system must define explicit semantic tokens in CSS variables:

### 8.1 Modal Semantic Token Schema

```css
/* ========================================================================== */
/* MODAL SEMANTIC DESIGN TOKENS                                              */
/* ========================================================================== */

:root {
  /* Surface Tokens - Light Mode */
  --modal-backdrop: rgba(15, 23, 42, 0.45);
  --modal-backdrop-blur: 2px;
  --modal-shell: #ffffff;
  --modal-header: #ffffff;
  --modal-sidebar: #f8fafc;
  --modal-canvas: #f1f5f9;
  --modal-card: #ffffff;
  --modal-input: #ffffff;
  --modal-input-border: #cbd5e1;

  /* Border & Divider Tokens - Light Mode */
  --modal-border: #e2e8f0;
  --modal-divider: #e2e8f0;

  /* Text Tokens - Light Mode */
  --text-primary: #0f172a; /* Slate-900 (17.8:1 on white) */
  --text-secondary: #475569; /* Slate-600 (7.58:1 on white) */
  --text-muted: #64748b; /* Slate-500 (4.76:1 on white) */

  /* Accent Tokens - Light Mode (High-Contrast Burnt Copper) */
  --accent-primary: #9a3412; /* Copper-800 (7.31:1 AAA on white) */
  --accent-primary-hover: #7c2d12;
  --accent-subtle: rgba(154, 52, 18, 0.08);
  --accent-text: #9a3412;

  /* Elevation Shadows - Light Mode */
  --modal-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.2);
  --card-shadow: 0 1px 3px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.03);
}

.dark {
  /* Surface Tokens - Dark Mode */
  --modal-backdrop: rgba(0, 0, 0, 0.7);
  --modal-backdrop-blur: 4px;
  --modal-shell: #0f172a; /* Slate-900 (Solid, 100% Opaque) */
  --modal-header: #0f172a; /* Unified with shell */
  --modal-sidebar: #0f172a; /* Unified with shell */
  --modal-canvas: #090d16; /* Deep Slate Basin */
  --modal-card: #1e293b; /* Slate-800 (Tonal Elevation) */
  --modal-input: #090d16; /* Recessed into card */
  --modal-input-border: rgba(148, 163, 184, 0.2);

  /* Border & Divider Tokens - Dark Mode */
  --modal-border: rgba(148, 163, 184, 0.14);
  --modal-divider: rgba(148, 163, 184, 0.1);

  /* Text Tokens - Dark Mode */
  --text-primary: #f8fafc; /* Slate-50 (14.28:1 on #1e293b) */
  --text-secondary: #94a3b8; /* Slate-400 (5.71:1 on #1e293b) */
  --text-muted: #64748b; /* Slate-500 (3.3:1 for non-body timestamps) */

  /* Accent Tokens - Dark Mode (Luminous Copper / Amber) */
  --accent-primary: #ea580c; /* Copper-600 */
  --accent-primary-hover: #f97316;
  --accent-subtle: rgba(249, 115, 22, 0.12);
  --accent-text: #fb923c; /* Amber-400 (6.46:1 AA on #1e293b) */

  /* Elevation Shadows - Dark Mode */
  --modal-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
  --card-shadow: none; /* Zero drop shadows on dark surfaces */
}
```

---

## 9. Light Mode Final Surface Map

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ APPLICATION PAGE BACKGROUND: #f1f5f9 (Slate-100)                            │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ BACKDROP: rgba(15, 23, 42, 0.45) + 2px blur                             │ │
│ │ ┌─────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ MODAL SHELL: #ffffff (100% Opaque, 16px Radius, Deep Shadow)        │ │ │
│ │ │ ┌─────────────────────────────────────────────────────────────────┐ │ │ │
│ │ │ │ HEADER: #ffffff (Sticky, 1px border-b #e2e8f0)                  │ │ │ │
│ │ │ │ Title: #0f172a | Sub: #475569 | CTA: #9a3412 (White text, AAA)  │ │ │ │
│ │ │ ├──────────────────┬──────────────────────────────┬───────────────┤ │ │ │
│ │ │ │ SIDEBAR: #f8fafc │ RECESSED CANVAS: #f1f5f9     │ TIMELINE:     │ │ │ │
│ │ │ │ 1px border-r     │ (p-6 basin)                  │ #ffffff       │ │ │ │
│ │ │ │ Active tab:      │ ┌──────────────────────────┐ │ 1px border-l │ │ │ │
│ │ │ │ bg-copper/8      │ │ CARD: #ffffff            │ │ Neutral line: │ │ │ │
│ │ │ │ border-l-3       │ │ border: 1px solid #e2e8f0│ │ #e2e8f0       │ │ │ │
│ │ │ │ copper           │ │ shadow: 0 1px 3px rgba.. │ │ Nodes: Slate  │ │ │ │
│ │ │ │                  │ │ Input: #ffffff (border)  │ │ Active: Copper│ │ │ │
│ │ │ │                  │ └──────────────────────────┘ │               │ │ │ │
│ │ │ └──────────────────┴──────────────────────────────┴───────────────┘ │ │ │
│ │ └─────────────────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Dark Mode Final Surface Map

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ APPLICATION PAGE BACKGROUND: #020617 (Pitch Slate)                          │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ BACKDROP: rgba(0, 0, 0, 0.70) + 4px blur                                │ │
│ │ ┌─────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ MODAL SHELL: #0f172a (100% Opaque Slate-900, 1px border-slate-700)  │ │ │
│ │ │ ┌─────────────────────────────────────────────────────────────────┐ │ │ │
│ │ │ │ HEADER: #0f172a (ZERO WHITE! 1px border-b rgba(148,163,184,0.1))│ │ │ │
│ │ │ │ Title: #f8fafc | Sub: #94a3b8 | Close: Slate-400                │ │ │ │
│ │ │ ├──────────────────┬──────────────────────────────┬───────────────┤ │ │ │
│ │ │ │ SIDEBAR: #0f172a │ DEEP CANVAS: #090d16         │ TIMELINE:     │ │ │ │
│ │ │ │ 1px border-r     │ (p-6 dark basin)             │ #0f172a       │ │ │ │
│ │ │ │ Active tab:      │ ┌──────────────────────────┐ │ 1px border-l │ │ │ │
│ │ │ │ bg-copper/12     │ │ CARD: #1e293b (Slate-800)│ │ Neutral line: │ │ │ │
│ │ │ │ border-l-3       │ │ border: 1px border-slate │ │ #334155       │ │ │ │
│ │ │ │ copper           │ │ shadow: NONE             │ │ Nodes: Slate  │ │ │ │
│ │ │ │                  │ │ Input: #090d16 (recessed)│ │ Active: Copper│ │ │ │
│ │ │ │                  │ └──────────────────────────┘ │               │ │ │ │
│ │ │ └──────────────────┴──────────────────────────────┴───────────────┘ │ │ │
│ │ └─────────────────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Modal Architecture Across Application Dialogs

To ensure all modals belong to the same visual family, every dialog in the application must align with the standardized surface architecture:

| Modal Component         | Shell Background             | Header Treatment                       | Body / Content Basin                      | Form Controls / Inputs                           | Action Buttons                                              |
| :---------------------- | :--------------------------- | :------------------------------------- | :---------------------------------------- | :----------------------------------------------- | :---------------------------------------------------------- |
| **Application Detail**  | L: `#ffffff`<br>D: `#0f172a` | L: `#ffffff`<br>D: `#0f172a` (Unified) | L: `#f1f5f9`<br>D: `#090d16` (p-6)        | N/A (Display cards `#ffffff` / `#1e293b`)        | Secondary outline + Primary edit                            |
| **Edit Application**    | L: `#ffffff`<br>D: `#0f172a` | L: `#ffffff`<br>D: `#0f172a` (Unified) | L: `#ffffff`<br>D: `#0f172a` (Scrollable) | L: `#ffffff` (border)<br>D: `#090d16` (recessed) | Sticky bottom footer: Cancel + Save (`#9a3412` / `#ea580c`) |
| **Add Application**     | L: `#ffffff`<br>D: `#0f172a` | L: `#ffffff`<br>D: `#0f172a` (Unified) | L: `#ffffff`<br>D: `#0f172a` (Scrollable) | L: `#ffffff` (border)<br>D: `#090d16` (recessed) | Cancel + Submit (`#9a3412` / `#ea580c`)                     |
| **Column Manager**      | L: `#ffffff`<br>D: `#0f172a` | L: `#ffffff`<br>D: `#0f172a` (Unified) | L: `#f8fafc`<br>D: `#090d16`              | Column items: L: `#ffffff`, D: `#1e293b`         | Done (secondary outline)                                    |
| **Delete Confirmation** | L: `#ffffff`<br>D: `#1e293b` | Unified alert title                    | Compact warning body                      | N/A                                              | Cancel (outline) + Delete (`bg-destructive`)                |

---

## 12. Responsive Behavior & Viewport Composition

```text
Viewport Width    Modal Layout Architecture
──────────────    ──────────────────────────────────────────────────────────
≥ 1440px          3-Column Fixed Shell (Max 1180px)
                  [ Sidebar 220px ] | [ Canvas flex-1 ] | [ Timeline 280px ]

1280px – 1439px   3-Column Compact Shell (Max 1040px)
                  [ Sidebar 200px ] | [ Canvas flex-1 ] | [ Timeline 260px ]

1024px – 1279px   2-Column Responsive Shell (Max 920px)
                  [ Sidebar 180px ] | [ Canvas flex-1 (Timeline stacks under Cards) ]

768px – 1023px    1-Column Tabbed Modal (Max 680px)
                  [ Header ] -> [ Segmented Nav Tabs ] -> [ Active Tab Body ]

≤ 640px (390px)   Native Mobile Bottom Sheet (100% width, max 92vh)
                  [ Pull Handle ] -> [ Header ] -> [ Scrollable Tabs ] -> [ Single Scroll Body ] -> [ Sticky Action Bar ]
```

### Mobile (390px) Non-Negotiable Guardrails:

- **Zero Horizontal Bleed:** Container uses `max-w-full w-full overflow-x-hidden`.
- **Zero Dark Mode White Leakage:** The bottom sheet shell, drag handle area, and header must explicitly render `bg-slate-900` (`#0f172a`).
- **Touch Targets:** All buttons, tab segments, and interactive icons have minimum hit boxes of `44px × 44px`.
- **Sticky Actions Safe Insets:** The bottom action bar incorporates `padding-bottom: max(16px, env(safe-area-inset-bottom))`.

---

## 13. Accessibility Verification (WCAG 2.1 Luminance Recalculation)

All ratios are recalculated using exact linear luminance $L = 0.2126 R + 0.7152 G + 0.0722 B$:

| Interface Element               | Foreground Hex | Background Hex         | Contrast Ratio | WCAG Rule                                 | Status         |
| :------------------------------ | :------------- | :--------------------- | :------------- | :---------------------------------------- | :------------- |
| **Light Mode Primary CTA**      | `#ffffff`      | `#9a3412` (Copper-800) | **7.31:1**     | 14px Button (AA $\ge 4.5$, AAA $\ge 7.0$) | **PASS (AAA)** |
| **Light Mode Inverse CTA**      | `#090d16`      | `#fb923c` (Amber-400)  | **8.59:1**     | 14px Button (AA $\ge 4.5$, AAA $\ge 7.0$) | **PASS (AAA)** |
| **Light Mode Primary Text**     | `#0f172a`      | `#ffffff` (White Card) | **17.85:1**    | 14px Regular (AA $\ge 4.5:1$)             | **PASS (AAA)** |
| **Light Mode Secondary**        | `#475569`      | `#ffffff` (White Card) | **7.58:1**     | 13px Regular (AA $\ge 4.5:1$)             | **PASS (AAA)** |
| **Light Mode Canvas Text**      | `#475569`      | `#f1f5f9` (Canvas)     | **6.92:1**     | 13px Regular (AA $\ge 4.5:1$)             | **PASS (AA)**  |
| **Dark Mode Primary Text**      | `#f8fafc`      | `#1e293b` (Card)       | **14.28:1**    | 14px Regular (AA $\ge 4.5:1$)             | **PASS (AAA)** |
| **Dark Mode Secondary**         | `#94a3b8`      | `#1e293b` (Card)       | **5.71:1**     | 13px Regular (AA $\ge 4.5:1$)             | **PASS (AA)**  |
| **Dark Mode Canvas Text**       | `#94a3b8`      | `#090d16` (Canvas)     | **7.58:1**     | 13px Regular (AA $\ge 4.5:1$)             | **PASS (AAA)** |
| **Dark Mode Copper Accent**     | `#fb923c`      | `#1e293b` (Card)       | **6.46:1**     | 13px Medium (AA $\ge 4.5:1$)              | **PASS (AA)**  |
| **Dark Mode Input Text**        | `#f8fafc`      | `#090d16` (Input Bg)   | **18.98:1**    | 14px Regular (AA $\ge 4.5:1$)             | **PASS (AAA)** |
| **Dark Mode Input Placeholder** | `#64748b`      | `#090d16` (Input Bg)   | **4.81:1**     | 14px Regular (AA $\ge 4.5:1$)             | **PASS (AA)**  |

_Zero contrast contradictions remain in the specification._

---

## 14. Frozen Architectural Decisions vs. Prototype Values

### 14.1 FROZEN DECISIONS (Non-Negotiable Architecture)

1. **Header Surface Fusion:** In Dark Mode, modal headers must unconditionally render `bg-slate-900` (`#0f172a`). `bg-white dark:glass-ultra` is permanently banned.
2. **100% Opaque Modal Shell:** Modals must not use `backdrop-filter`, `opacity`, or semi-transparent background fills on the shell or main containers.
3. **Recessed Canvas Depth (Light Mode):** Light Mode modals must use `#f1f5f9` as the content canvas basin with elevated `#ffffff` cards.
4. **Tonal Elevation (Dark Mode):** Dark Mode must elevate cards via surface brightness (`#1e293b` on `#090d16`), not dark drop shadows.
5. **Restrained Copper:** The timeline connector line must use neutral Slate (`#e2e8f0` Light / `#334155` Dark). Copper is restricted to active milestone indicators and primary CTAs.
6. **No "Box Inside Box":** Cards must not contain nested bordered subsections.

### 14.2 PROTOTYPE VALUES (Calibrated in Browser During Phase 2)

1. **Backdrop Blur Intensity:** Overlay blur calibrated between `2px` and `4px` to ensure 60fps mobile drawer transitions.
2. **Card Micro-Shadow Opacity:** Light card shadow ambient alpha tuned between `0.04` and `0.06`.
3. **Active Sidebar Tab Tint:** Light mode active tab copper background wash calibrated between `0.06` and `0.10`.
4. **Dark Mode Specular Border Alpha:** Dark card border opacity calibrated between `0.12` and `0.16` based on display gamma.

---

## 15. Remaining Implementation Risks

| Risk ID     | Description                                                                                                                                   | Severity | Concrete Mitigation in Phase 2                                                                                                                                       |
| :---------- | :-------------------------------------------------------------------------------------------------------------------------------------------- | :------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **RISK-01** | Legacy CSS class collisions (`.glass-ultra` and `.glass-light` declared in child components like `CompanyInfo.tsx` and `JobDescription.tsx`). | High     | Systematically purge all `.glass-*` classes from modal subcomponents; replace with `.surface-card` and `.surface-canvas`.                                            |
| **RISK-02** | Radix Portal theme inheritance: if Radix renders `<DialogPrimitive.Portal>` outside the `.dark` class container on `<html>` or `<body>`.      | Medium   | Verify that `next-themes` applies the `dark` class to `document.documentElement` (`<html class="dark">`) so Radix Portals automatically inherit dark mode variables. |
| **RISK-03** | Form validation layout shifts in mobile bottom sheet.                                                                                         | Low      | Lock modal body height with `max-h-[90vh]` and enforce `overflow-y-auto` with fixed sticky footer actions.                                                           |

---

## 16. Final Gate Decision

The previous audit issued an unconditional approval without catching the fatal `bg-white dark:glass-ultra` header rendering bug, the translucent washed-out modal shell, and the Light Mode flatness traps in the real codebase.

Because critical visual defects, uncompiled class fallbacks, and surface contradictions were uncovered in the active implementation, the design specification requires formal revision and guardrail binding before code execution.

```text
================================================================================
FINAL GATE VERDICT:
DESIGN GATE REQUIRES REVISION
================================================================================
```

### Action Required Before Implementation Starts:

Phase 2 execution must bind directly to the **Semantic Surface System** and **Root Cause Remedies** documented in this revision (`ANTI_NGANGGUR_PHASE_2_MODAL_VISUAL_REVISION.md`). Implementation of Phase 2 is held until the user authorizes proceeding with these revised constraints.
