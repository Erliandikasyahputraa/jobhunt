'use client'

import * as React from 'react'
import { FileText, Upload, Plus, Download, Trash2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Application, ApplicationDocumentDB, DocumentType } from '@/lib/types/database.types'
import { toast } from 'sonner'
import {
  uploadApplicationDocumentAction,
  deleteApplicationDocumentAction,
  getDocumentUrlAction,
  getDocumentsByApplicationAction,
} from '@/app/dashboard/actions/documents'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { formatDistanceToNow } from 'date-fns'

interface DocumentsProps {
  _application: Application
  className?: string
}

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function Documents({ _application, className }: DocumentsProps) {
  const [documents, setDocuments] = React.useState<ApplicationDocumentDB[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isUploading, setIsUploading] = React.useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = React.useState(false)
  const [uploadType, setUploadType] = React.useState<DocumentType>('resume')
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const [documentToDelete, setDocumentToDelete] = React.useState<ApplicationDocumentDB | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isDownloadingId, setIsDownloadingId] = React.useState<string | null>(null)

  const fetchDocuments = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const docs = await getDocumentsByApplicationAction(_application.id)
      setDocuments(docs)
    } catch (error) {
      console.error('Failed to load documents:', error)
      toast.error('Failed to load documents.')
    } finally {
      setIsLoading(false)
    }
  }, [_application.id])

  React.useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleUploadClick = () => {
    setIsUploadDialogOpen(true)
    setSelectedFile(null)
    setUploadType('resume')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUploadSubmit = async () => {
    if (!selectedFile) return

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('File must be 5 MB or smaller.')
      return
    }

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('applicationId', _application.id)
      formData.append('documentType', uploadType)

      await uploadApplicationDocumentAction(formData)
      toast.success('Document uploaded')
      setIsUploadDialogOpen(false)
      setSelectedFile(null)
      fetchDocuments()
    } catch (error: unknown) {
      console.error('Upload error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to upload document. Please try again.'
      )
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownload = async (doc: ApplicationDocumentDB) => {
    try {
      setIsDownloadingId(doc.id)
      const url = await getDocumentUrlAction(doc.id)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (error: unknown) {
      console.error('Download error:', error)
      toast.error(error instanceof Error ? error.message : 'Unable to access this document.')
    } finally {
      setIsDownloadingId(null)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return

    try {
      setIsDeleting(true)
      await deleteApplicationDocumentAction(documentToDelete.id, documentToDelete.storage_path)
      toast.success('Document deleted')
      setDocumentToDelete(null)
      fetchDocuments()
    } catch (error: unknown) {
      console.error('Delete error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete document. Please try again.'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleUploadClick}
          variant="outline"
          className="border-border shadow-xs hover:bg-accent transition-all"
        >
          <Upload className="h-4 w-4 mr-1.5 shrink-0" aria-hidden="true" />
          Upload Document
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2
            className="h-8 w-8 animate-spin text-[var(--text-muted)]"
            aria-label="Loading documents"
            role="status"
          />
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-slate-50 dark:bg-[#090d16] border border-neutral-200 dark:border-slate-800 rounded-xl p-6 text-center">
          <FileText
            className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-3"
            aria-hidden="true"
          />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            No documents yet
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">
            Upload resumes, cover letters, or other attachments for this application.
          </p>
          <Button
            onClick={handleUploadClick}
            variant="default"
            className="bg-orange-700 hover:bg-orange-800 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950"
          >
            <Plus className="h-4 w-4 mr-1.5 shrink-0" aria-hidden="true" />
            Upload Document
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {documents.map(doc => (
            <div
              key={doc.id}
              className="bg-white dark:bg-slate-800/90 border border-neutral-200 dark:border-slate-700/60 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-150"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-slate-100 dark:bg-slate-700/60 rounded-lg shrink-0 border border-slate-200 dark:border-slate-700">
                  <FileText
                    className="h-4 w-4 text-[var(--text-secondary)] shrink-0"
                    aria-hidden="true"
                  />
                </div>
                <div className="min-w-0">
                  <h4
                    className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate"
                    title={doc.name}
                  >
                    {doc.name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span className="capitalize font-medium">
                      {doc.document_type.replace('_', ' ')}
                    </span>
                    <span>•</span>
                    <span>{formatBytes(doc.size_bytes)}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(doc.created_at))} ago</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="View document"
                  onClick={() => handleDownload(doc)}
                  disabled={isDownloadingId === doc.id}
                  className="h-8 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
                >
                  {isDownloadingId === doc.id ? (
                    <Loader2
                      className="h-3.5 w-3.5 animate-spin mr-1.5 shrink-0"
                      aria-hidden="true"
                    />
                  ) : (
                    <Download className="h-3.5 w-3.5 mr-1.5 shrink-0" aria-hidden="true" />
                  )}
                  View
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Delete document"
                  onClick={() => setDocumentToDelete(doc)}
                  className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">
              Upload Document
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Supported formats: PDF, DOC, DOCX (Max 5MB)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Document Type
              </label>
              <Select value={uploadType} onValueChange={val => setUploadType(val as DocumentType)}>
                <SelectTrigger className="border-neutral-200 dark:border-slate-700">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resume">Resume</SelectItem>
                  <SelectItem value="cover_letter">Cover Letter</SelectItem>
                  <SelectItem value="attachment">Attachment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">File</label>
              <div className="flex items-center gap-3">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-neutral-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shrink-0"
                >
                  Choose File
                </Button>
                <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
                  {selectedFile ? selectedFile.name : 'No file selected'}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsUploadDialogOpen(false)}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadSubmit}
              disabled={!selectedFile || isUploading}
              className="min-w-[100px] bg-orange-700 hover:bg-orange-800 text-white dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 font-medium"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin shrink-0" aria-hidden="true" />
                  Uploading...
                </>
              ) : (
                'Upload'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!documentToDelete} onOpenChange={open => !open && setDocumentToDelete(null)}>
        <DialogContent className="max-w-sm bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">
              Delete Document
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Are you sure you want to delete{' '}
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {documentToDelete?.name}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button
              variant="ghost"
              onClick={() => setDocumentToDelete(null)}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="min-w-[100px]"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
