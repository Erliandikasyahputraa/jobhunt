'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

import {
  uploadDocumentToStorage,
  createDocumentRecord,
  getSignedUrl,
  deleteDocument,
  getDocumentsByApplication,
} from '@/lib/api/documents'
import { documentInsertSchema, documentTypeSchema } from '@/lib/schemas/document.schema'
import type { DocumentType, ApplicationDocumentDB } from '@/lib/types/database.types'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx']

async function verifyApplicationOwnership(supabase: any, applicationId: string, userId: string) {
  const { data, error } = await supabase
    .from('applications')
    .select('id')
    .eq('id', applicationId)
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    throw new Error('Unauthorized or application not found')
  }
}

export async function uploadApplicationDocumentAction(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const file = formData.get('file') as File
  const applicationId = formData.get('applicationId') as string
  const documentTypeRaw = formData.get('documentType') as string

  if (!file || !applicationId || !documentTypeRaw) {
    throw new Error('Missing required fields')
  }

  // 1. Verify document type via Zod schema
  const documentType = documentTypeSchema.parse(documentTypeRaw) as DocumentType

  // 2. Verify file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File must be 5 MB or smaller.')
  }

  // 3. Verify MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Unsupported file type. Please upload PDF, DOC, or DOCX.')
  }

  // 4. Verify extension
  const originalName = file.name
  const dotIndex = originalName.lastIndexOf('.')
  const ext = dotIndex !== -1 ? originalName.slice(dotIndex).toLowerCase() : ''
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error('Unsupported file extension. Please upload PDF, DOC, or DOCX.')
  }

  // 5. Verify application ownership
  await verifyApplicationOwnership(supabase, applicationId, user.id)

  // 6. Upload to private Storage bucket
  const documentUuid = crypto.randomUUID()
  let storagePath = ''
  try {
    storagePath = await uploadDocumentToStorage(
      supabase,
      user.id,
      applicationId,
      file,
      documentUuid,
      originalName
    )
  } catch (error) {
    console.error('Storage upload error:', error)
    throw new Error('Failed to upload document. Please try again.')
  }

  // 7. Create database record with rollback if insert fails
  try {
    const documentData = {
      application_id: applicationId,
      name: originalName,
      document_type: documentType,
      storage_path: storagePath,
      mime_type: file.type,
      size_bytes: file.size,
    }

    // Validate insert payload
    documentInsertSchema.parse(documentData)

    await createDocumentRecord(supabase, documentData, user.id)
  } catch (error) {
    // Rollback uploaded storage object if metadata row creation fails
    console.error('Database insert error, rolling back storage:', error)
    await supabase.storage.from('jobhunt_documents').remove([storagePath])
    throw new Error('Failed to save document metadata. Please try again.')
  }

  revalidatePath('/dashboard')
  revalidatePath('/applications')
}

export async function deleteApplicationDocumentAction(documentId: string, storagePath: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify document ownership
  const { data: doc, error: fetchError } = await supabase
    .from('application_documents')
    .select('user_id, application_id')
    .eq('id', documentId)
    .single()

  if (fetchError || !doc || doc.user_id !== user.id) {
    throw new Error('Unauthorized or document not found')
  }

  // Also verify application ownership
  await verifyApplicationOwnership(supabase, doc.application_id, user.id)

  try {
    await deleteDocument(supabase, documentId, storagePath)
    revalidatePath('/dashboard')
    revalidatePath('/applications')
  } catch (error) {
    console.error('Failed to delete document:', error)
    throw new Error('Failed to delete document. Please try again.')
  }
}

export async function getDocumentUrlAction(documentId: string): Promise<string> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify document ownership and get storage path
  const { data: doc, error: fetchError } = await supabase
    .from('application_documents')
    .select('storage_path, user_id, application_id')
    .eq('id', documentId)
    .single()

  if (fetchError || !doc || doc.user_id !== user.id) {
    throw new Error('Unauthorized to view this document')
  }

  // Also verify application ownership
  await verifyApplicationOwnership(supabase, doc.application_id, user.id)

  try {
    return await getSignedUrl(supabase, doc.storage_path)
  } catch (error) {
    console.error('Failed to generate document url:', error)
    throw new Error('Failed to open document. Please try again.')
  }
}

export async function getDocumentsByApplicationAction(
  applicationId: string
): Promise<ApplicationDocumentDB[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await verifyApplicationOwnership(supabase, applicationId, user.id)

  try {
    return await getDocumentsByApplication(supabase, applicationId)
  } catch (error) {
    console.error('Failed to get documents:', error)
    throw new Error('Failed to fetch documents.')
  }
}
