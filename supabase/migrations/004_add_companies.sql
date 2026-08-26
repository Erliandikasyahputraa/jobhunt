-- ============================================================================
-- JOBHUNT COMPANIES MIGRATION
-- Adds a user-owned companies table for company research
-- ============================================================================

-- Create the companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  location TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  overview TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure user_id and name are unique (a user shouldn't have identically named companies)
ALTER TABLE companies ADD CONSTRAINT companies_user_id_name_key UNIQUE (user_id, name);

-- Add updated_at trigger
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see only their own companies
CREATE POLICY "Users can view their own companies"
  ON companies FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own companies
CREATE POLICY "Users can insert their own companies"
  ON companies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own companies
CREATE POLICY "Users can update their own companies"
  ON companies FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own companies
CREATE POLICY "Users can delete their own companies"
  ON companies FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- ALTER APPLICATIONS TABLE
-- ============================================================================

-- Add nullable company_id to applications
-- ON DELETE SET NULL ensures applications are preserved when a company is deleted
ALTER TABLE applications 
ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

-- Add index for performance when filtering by company
CREATE INDEX idx_applications_company_id ON applications(company_id);

-- ============================================================================
-- SECURITY ENFORCEMENT
-- ============================================================================

-- Create a trigger function to ensure cross-table ownership validity
-- Prevents User A from assigning an application to User B's company
CREATE OR REPLACE FUNCTION check_application_company_owner()
RETURNS TRIGGER AS $$
DECLARE
  comp_owner UUID;
BEGIN
  -- If not assigning to a company, valid
  IF NEW.company_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Fetch the owner of the target company
  SELECT user_id INTO comp_owner 
  FROM companies 
  WHERE id = NEW.company_id;

  -- If company doesn't exist (should be caught by FK, but safe check)
  IF comp_owner IS NULL THEN
    RAISE EXCEPTION 'Company does not exist';
  END IF;

  -- Check if the application owner matches the company owner
  IF comp_owner != NEW.user_id THEN
    RAISE EXCEPTION 'Security violation: Cannot assign application to a company owned by another user.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger to applications table for INSERT and UPDATE
CREATE TRIGGER enforce_company_ownership
  BEFORE INSERT OR UPDATE OF company_id ON applications
  FOR EACH ROW EXECUTE FUNCTION check_application_company_owner();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Company research migration completed successfully at %', NOW();
  RAISE NOTICE 'Created: companies table with strict RLS';
  RAISE NOTICE 'Altered: applications table added nullable company_id (ON DELETE SET NULL)';
  RAISE NOTICE 'Security: Enforced cross-table ownership constraint via trigger';
END $$;
