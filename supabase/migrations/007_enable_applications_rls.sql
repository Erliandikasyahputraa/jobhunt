-- ============================================================================
-- JOBHUNT APPLICATIONS ROW LEVEL SECURITY (RLS) MIGRATION
-- Enforces strict multi-tenant data isolation on the core applications table
-- ============================================================================

-- Revoke blanket anon access granted in initial setup
REVOKE ALL ON applications FROM anon;
REVOKE ALL ON applications_with_company FROM anon;

-- Enable Row Level Security for applications table
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view only their own applications
CREATE POLICY "Users can view their own applications"
  ON applications FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own applications
CREATE POLICY "Users can insert their own applications"
  ON applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own applications
CREATE POLICY "Users can update their own applications"
  ON applications FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own applications
CREATE POLICY "Users can delete their own applications"
  ON applications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'JobHunt applications RLS migration completed successfully at %', NOW();
  RAISE NOTICE 'Enabled Row Level Security and configured CRUD policies on applications table';
  RAISE NOTICE 'Multi-tenant isolation enforced at database engine level!';
END $$;
