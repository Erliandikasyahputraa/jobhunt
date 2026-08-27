-- ============================================================================
-- JOBHUNT APPLICATION STATUS HISTORY MIGRATION
-- Adds dedicated audit trail for application status transitions and custom column movements
-- ============================================================================

-- Create application_status_history table
CREATE TABLE IF NOT EXISTS application_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  from_custom_column_id UUID REFERENCES custom_columns(id) ON DELETE SET NULL,
  to_custom_column_id UUID REFERENCES custom_columns(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_status_history_application_id ON application_status_history(application_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_status_history_user_id ON application_status_history(user_id);

-- Enable Row Level Security
ALTER TABLE application_status_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own application status history" ON application_status_history;
DROP POLICY IF EXISTS "Users can insert own application status history" ON application_status_history;

-- RLS Policies
CREATE POLICY "Users can view own application status history"
  ON application_status_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own application status history"
  ON application_status_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- AUTOMATED TRIGGER FOR STATUS AND COLUMN TRANSITIONS
-- Records status transitions automatically without creating duplicate entries
-- when unrelated fields (e.g. company_name, notes, salary) are updated.
-- ============================================================================

CREATE OR REPLACE FUNCTION log_application_status_history()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO application_status_history (
      application_id,
      user_id,
      from_status,
      to_status,
      from_custom_column_id,
      to_custom_column_id,
      created_at
    ) VALUES (
      NEW.id,
      NEW.user_id,
      NULL,
      NEW.status,
      NULL,
      NEW.custom_column_id,
      COALESCE(NEW.created_at, NOW())
    );
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Only record if status or custom_column_id actually changed
    IF (OLD.status IS DISTINCT FROM NEW.status) OR (OLD.custom_column_id IS DISTINCT FROM NEW.custom_column_id) THEN
      INSERT INTO application_status_history (
        application_id,
        user_id,
        from_status,
        to_status,
        from_custom_column_id,
        to_custom_column_id,
        created_at
      ) VALUES (
        NEW.id,
        NEW.user_id,
        OLD.status,
        NEW.status,
        OLD.custom_column_id,
        NEW.custom_column_id,
        NOW()
      );
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate Trigger on applications table
DROP TRIGGER IF EXISTS trigger_log_application_status_history ON applications;

CREATE TRIGGER trigger_log_application_status_history
AFTER INSERT OR UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION log_application_status_history();

-- ============================================================================
-- EXISTING APPLICATIONS NOTE:
-- Historical transitions prior to this migration cannot be reconstructed.
-- The query below creates a single baseline entry per existing application
-- using its original created_at timestamp and initial status, without
-- fabricating unprovable intermediate status changes.
-- ============================================================================
INSERT INTO application_status_history (
  application_id,
  user_id,
  from_status,
  to_status,
  from_custom_column_id,
  to_custom_column_id,
  created_at
)
SELECT
  a.id,
  a.user_id,
  NULL,
  a.status,
  NULL,
  a.custom_column_id,
  a.created_at
FROM applications a
WHERE NOT EXISTS (
  SELECT 1 FROM application_status_history h WHERE h.application_id = a.id
);
