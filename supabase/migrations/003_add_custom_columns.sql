-- ============================================================================
-- JOBHUNT CUSTOM COLUMNS MIGRATION
-- Adds persistent custom workflow columns for the Kanban board
-- ============================================================================

-- Create the custom_columns table
CREATE TABLE custom_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure user_id and name are unique (a user shouldn't have identically named columns)
ALTER TABLE custom_columns ADD CONSTRAINT custom_columns_user_id_name_key UNIQUE (user_id, name);

-- Add updated_at trigger
CREATE TRIGGER update_custom_columns_updated_at
  BEFORE UPDATE ON custom_columns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for custom_columns
ALTER TABLE custom_columns ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see only their own columns
CREATE POLICY "Users can view their own custom columns"
  ON custom_columns FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own columns
CREATE POLICY "Users can insert their own custom columns"
  ON custom_columns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own columns
CREATE POLICY "Users can update their own custom columns"
  ON custom_columns FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own columns
CREATE POLICY "Users can delete their own custom columns"
  ON custom_columns FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- ALTER APPLICATIONS TABLE
-- ============================================================================

-- Add nullable custom_column_id to applications
-- ON DELETE SET NULL ensures applications are preserved when a column is deleted
ALTER TABLE applications 
ADD COLUMN custom_column_id UUID REFERENCES custom_columns(id) ON DELETE SET NULL;

-- Add index for performance when grouping applications
CREATE INDEX idx_applications_custom_column_id ON applications(custom_column_id);

-- ============================================================================
-- SECURITY ENFORCEMENT
-- ============================================================================

-- Create a trigger function to ensure cross-table ownership validity
-- Prevents User A from assigning an application to User B's custom column
CREATE OR REPLACE FUNCTION check_application_custom_column_owner()
RETURNS TRIGGER AS $$
DECLARE
  column_owner UUID;
BEGIN
  -- If not assigning to a custom column, valid
  IF NEW.custom_column_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Fetch the owner of the target custom column
  SELECT user_id INTO column_owner 
  FROM custom_columns 
  WHERE id = NEW.custom_column_id;

  -- If column doesn't exist (should be caught by FK, but safe check)
  IF column_owner IS NULL THEN
    RAISE EXCEPTION 'Custom column does not exist';
  END IF;

  -- Check if the application owner matches the custom column owner
  IF column_owner != NEW.user_id THEN
    RAISE EXCEPTION 'Security violation: Cannot assign application to a custom column owned by another user.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger to applications table for INSERT and UPDATE
CREATE TRIGGER enforce_custom_column_ownership
  BEFORE INSERT OR UPDATE OF custom_column_id ON applications
  FOR EACH ROW EXECUTE FUNCTION check_application_custom_column_owner();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Custom column persistence migration completed successfully at %', NOW();
  RAISE NOTICE 'Created: custom_columns table with strict RLS';
  RAISE NOTICE 'Altered: applications table added nullable custom_column_id (ON DELETE SET NULL)';
  RAISE NOTICE 'Security: Enforced cross-table ownership constraint via trigger';
END $$;
