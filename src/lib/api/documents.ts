import { SupabaseClient } from '@supabase/supabase-js'
import type { ApplicationDocumentDB, ApplicationDocumentInsert } from '../types/database.types'

const BUCKET_NAME = 'jobhunt_documents'

/**
 * Fetch all documents for a given application, ordered newest first.
 */
export async function getDocumentsByApplication(
  supabase: SupabaseClient,
  applicationId: string
): Promise<ApplicationDocumentDB[]> {
  const { data, error } = await supabase
    .from('application_documents')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch documents: ${error.message}`)
  }

  return data || []
}

/**
 * Upload document binary to private Supabase Storage.
 * Path structure: user_id/application_id/document_uuid/filename
 */
export async function uploadDocumentToStorage(
  supabase: SupabaseClient,
  userId: string,
  applicationId: string,
  file: File,
  documentUuid: string,
  filename: string
): Promise<string> {
  // Strip any directory path components to prevent path traversal
  const baseName = filename.split(/[/\\]/).pop() || 'document'
  const safeFilename = baseName.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^\.+/, '') || 'document'
  const storagePath = `${userId}/${applicationId}/${documentUuid}/${safeFilename}`

  const { error } = await supabase.storage.from(BUCKET_NAME).upload(storagePath, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`)
  }

  return storagePath
}

/**
 * Insert document metadata into application_documents table.
 */
export async function createDocumentRecord(
  supabase: SupabaseClient,
  documentData: ApplicationDocumentInsert,
  userId?: string
): Promise<ApplicationDocumentDB> {
  const insertPayload = userId ? { ...documentData, user_id: userId } : documentData

  const { data, error } = await supabase
    .from('application_documents')
    .insert(insertPayload)
    .select()
    .single()

  if (error) {
    throw new Error(`Database insert failed: ${error.message}`)
  }

  return data
}

/**
 * Generate a short-lived (60s) signed URL for private document download.
 */
export async function getSignedUrl(supabase: SupabaseClient, storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET_NAME).createSignedUrl(storagePath, 60)

  if (error || !data) {
    throw new Error(`Failed to generate signed URL: ${error?.message || 'Unknown error'}`)
  }

  return data.signedUrl
}

/**
 * Delete a document from Storage first, then delete its database row.
 */
export async function deleteDocument(
  supabase: SupabaseClient,
  documentId: string,
  storagePath: string
): Promise<void> {
  // 1. Delete storage object
  const { error: storageError } = await supabase.storage.from(BUCKET_NAME).remove([storagePath])

  if (storageError) {
    throw new Error(`Failed to delete storage object: ${storageError.message}`)
  }

  // 2. Delete metadata row only after Storage deletion succeeds
  const { error: dbError } = await supabase
    .from('application_documents')
    .delete()
    .eq('id', documentId)

  if (dbError) {
    throw new Error(`Failed to delete document metadata: ${dbError.message}`)
  }
}
