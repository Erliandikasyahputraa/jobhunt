# JOBHUNT PHASE 3.4.3 COMPANY RESEARCH AUDIT

## 1. Current Company Architecture

Currently, company information is strictly embedded as flat, application-level data. There is no independent "Company" entity in the database. Every application record stores its own company details.

## 2. Existing Company Fields

- `company_name`: `string` (non-nullable). Owned by the application. Used everywhere (Kanban cards, lists, forms).
- `company_logo_url`: `string | null`. Owned by the application. Used by `CompanyLogo.tsx`.
- `job_url`: `string | null`. Links to the specific job posting, not the general company website.
- `location`: `string | null`. Pertains to the job role, but often overlaps with company HQ.
- `notes`: `string | null`. Often becomes a catch-all for both application-specific notes and general company research.

## 3. Repository Usage Analysis

A repository search reveals that `company_name` is deeply ingrained in the UI, being passed as a direct prop to `CompanyLogo` and displayed prominently on `ApplicationCard`. Attempting to rip this field out entirely would require massive refactoring across the frontend components and server actions.

## 4. Duplicate-Company Analysis

If a user applies to three roles at "Google" (e.g., Software Engineer, Data Analyst, ML Engineer), they currently create three completely independent application records.

- `company_name` is duplicated three times.
- If they write notes about Google's engineering culture in one application, it is NOT shared with the other two.

## 5. A/B/C Architecture Comparison

- **A. Embedded (Status Quo + New JSONB Fields)**
  - _Complexity_: Low.
  - _Duplicate Handling_: Poor. Research is still duplicated.
  - _Migration_: None.
- **B. Strict Companies Table**
  - _Complexity_: High.
  - _Duplicate Handling_: Excellent.
  - _Migration_: Requires extracting all unique `company_name` strings into a new table and replacing them with a strict `company_id` foreign key. High risk of regression.
- **C. Hybrid Architecture**
  - _Complexity_: Medium.
  - _Duplicate Handling_: Excellent.
  - _Migration_: Safe. Keep `company_name` on the `applications` table as a mandatory fallback. Add a nullable `company_id` foreign key.

## 6. Recommended Architecture

**Option C: Hybrid Architecture.**
This provides the safest upgrade path. Legacy applications retain their text-based `company_name`. If a user wants to perform deep research, they can link an application to a unified `Company` record via `company_id`. The UI gracefully falls back to the text field if no `Company` is linked.

## 7. Company Ownership Model

**User-owned/private.**
JobHunt is a personal productivity tool. Company research often includes personal biases, interview impressions, and private notes. Establishing a global, shared `companies` table introduces severe moderation, privacy, and data-leakage risks. Companies must be scoped strictly to the authenticated user via RLS.

## 8. Application ↔ Company Relationship

- **Many-to-One**: Many `Applications` can link to one `Company`.
- **Database implementation**: A nullable `company_id` on the `applications` table referencing `companies.id`.
- **Deletion Behavior**: `ON DELETE SET NULL`. If a user deletes a Company profile, the associated applications should NOT be deleted; they simply lose the rich profile link but retain their original string `company_name`.

## 9. Recommended Company 1.0 Scope

A focused, minimal implementation:

- **Identity**: Name, website, industry, location.
- **Social**: LinkedIn URL, GitHub URL.
- **Research**: Rich text overview/culture notes.
- **Integration**: Ability to view and edit this data directly from the Application view.

## 10. Deferred Company Features

- Global/public company database.
- AI-generated company summaries.
- Automated API enrichment (e.g., Clearbit).
- Documents/Attachments (reserved for Phase 3.4.4).

## 11. Employee/Recruiter Feasibility

**DEFER.**
Legitimate, robust APIs for employee data (like LinkedIn) are heavily restricted or violate Terms of Service (scraping). Relying on manual data entry for recruiters is feasible, but pushes the app toward CRM territory, diluting the Phase 1 goal of simple company research.

## 12. UX Proposal

Company information should live contextually where the user needs it.

- **Application Detail View**: Add a new "Company" tab next to the "Details" and "Notes" tabs inside the `ApplicationDetail` panel/modal.
- **Creation Flow**: If the user enters a `company_name` that matches an existing Company record, offer to link it automatically.
- Avoid a dedicated `/companies` route for now to maintain focus on the core Kanban workspace.

## 13. Database Impact

- **New Table**: `companies` (id, user_id, name, website, linkedin_url, overview, created_at, updated_at).
- **New Column**: `applications.company_id` (UUID, nullable, references `companies.id`).
- **Indexes**: Index on `companies.user_id` and `applications.company_id`.
- **Migration Complexity**: Low (additive only, no destructive data migration required).

## 14. RLS/Security Model

- `companies` table gets standard `user_id = auth.uid()` policies for SELECT, INSERT, UPDATE, DELETE.
- Server Actions must enforce `.eq('user_id', user.id)` when linking an application to a company to prevent cross-user ID assignment.

## 15. Dependency Analysis

**Zero new dependencies.**
We will utilize existing Radix Tabs, Dialogs, Inputs, and Textareas, along with the standard Supabase client.

## 16. Testing Strategy

- Unit test RLS policies on the `companies` table.
- Test server actions for cross-user linkage rejection.
- Test `ON DELETE SET NULL` database cascade behavior.
- Test UI fallback rendering (ensuring `company_name` string displays if `company_id` is null).

## 17. Migration Strategy

1. Create `companies` table via Supabase migration.
2. Add `company_id` to `applications`.
3. (Optional) Provide a UI button or background script to "Merge Applications into Companies" based on exact string matches of `company_name`.

## 18. Risks

- **Data Desync**: If an application is linked to a Company, but the user manually edits the text `company_name` on the application form, what happens? Recommendation: lock the `company_name` text field if a `company_id` is present, or prompt the user to unlink.

## 19. Exact Implementation Plan

1. **Schema**: Write and apply SQL migration.
2. **API**: Create `src/lib/api/companies.ts` and `src/app/dashboard/actions/companies.ts`.
3. **UI Components**: Build `CompanyProfileForm` and `CompanyDetailTab`.
4. **Integration**: Embed the new tab into the existing `ApplicationDetail` component.
5. **Validation**: Write tests and perform visual QA.

## 20. Recommended File Changes

- `supabase/migrations/[timestamp]_add_companies.sql`
- `src/lib/types/database.types.ts`
- `src/lib/schemas/company.schema.ts`
- `src/lib/api/companies.ts`
- `src/app/dashboard/actions.ts` (or a dedicated actions file)
- `src/components/applications/ApplicationDetail.tsx`
- `src/components/companies/CompanyTab.tsx`

## 21. Explicit Out-of-Scope List

- LinkedIn/Web scraping.
- Employee/Recruiter CRM.
- Shared/Public company database.
- Real-time external data synchronization.
- Complex nested company hierarchies (e.g., Google vs Alphabet).
