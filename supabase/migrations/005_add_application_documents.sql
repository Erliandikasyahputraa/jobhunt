-- ============================================================================
-- JOBHUNT DOCUMENTS MIGRATION
-- Adds a user-owned application_documents table and storage bucket
-- ============================================================================

-- Create document_type enum
CREATE TYPE document_type_enum AS ENUM ('resume', 'cover_letter', 'attachment');

-- Create the application_documents table
CREATE TABLE application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  document_type document_type_enum NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add updated_at trigger
CREATE TRIGGER update_application_documents_updated_at
  BEFORE UPDATE ON application_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_app_documents_user_id ON application_documents(user_id);
CREATE INDEX idx_app_documents_application_id ON application_documents(application_id);

-- Enable RLS for application_documents
ALTER TABLE application_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see only their own documents
CREATE POLICY "Users can view their own documents"
  ON application_documents FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own documents
CREATE POLICY "Users can insert their own documents"
  ON application_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own documents
CREATE POLICY "Users can update their own documents"
  ON application_documents FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own documents
CREATE POLICY "Users can delete their own documents"
  ON application_documents FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- STORAGE CONFIGURATION
-- ============================================================================

-- Insert the jobhunt_documents bucket
-- Includes 5MB size limit and allowed MIME types for PDF, DOC, DOCX
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'jobhunt_documents',
  'jobhunt_documents',
  false,
  5242880, -- 5MB in bytes
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[]
);

-- Note: In older or restricted Supabase instances, file_size_limit and allowed_mime_types 
-- might not be supported directly via SQL if the extensions/versions differ. 
-- If migration fails on these columns, remove them and rely entirely on Step 2 server validation.

-- ============================================================================
-- STORAGE RLS
-- ============================================================================

-- Policy: Users can upload their own files
CREATE POLICY "Users can upload their own documents to storage"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'jobhunt_documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can view their own files
CREATE POLICY "Users can view their own documents in storage"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'jobhunt_documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can update their own files
CREATE POLICY "Users can update their own documents in storage"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'jobhunt_documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete their own documents in storage"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'jobhunt_documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- SECURITY ENFORCEMENT
-- ============================================================================

-- Create a trigger function to ensure cross-table ownership validity for documents
-- Prevents User A from attaching a document to User B's application
CREATE OR REPLACE FUNCTION check_document_application_owner()
RETURNS TRIGGER AS $$
DECLARE
  app_owner UUID;
BEGIN
  -- Fetch the owner of the target application
  SELECT user_id INTO app_owner 
  FROM applications 
  WHERE id = NEW.application_id;

  -- If application doesn't exist (caught by FK, but safe check)
  IF app_owner IS NULL THEN
    RAISE EXCEPTION 'Application does not exist';
  END IF;

  -- Check if the document owner matches the application owner
  IF app_owner != NEW.user_id THEN
    RAISE EXCEPTION 'Security violation: Cannot attach document to an application owned by another user.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger to application_documents table for INSERT and UPDATE
CREATE TRIGGER enforce_document_ownership
  BEFORE INSERT OR UPDATE OF application_id ON application_documents
  FOR EACH ROW EXECUTE FUNCTION check_document_application_owner();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Document management migration completed successfully at %', NOW();
  RAISE NOTICE 'Created: application_documents table with strict RLS';
  RAISE NOTICE 'Created: jobhunt_documents private storage bucket';
  RAISE NOTICE 'Security: Enforced cross-table ownership constraint via trigger';
END $$;
