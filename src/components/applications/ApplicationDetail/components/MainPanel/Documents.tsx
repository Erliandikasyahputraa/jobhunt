'use client'

import * as React from 'react'
import { FileText, Upload, Plus, Download, Trash2, Loader2, File } from 'lucide-react'
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
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload document. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownload = async (doc: ApplicationDocumentDB) => {
    try {
      setIsDownloadingId(doc.id)
      const url = await getDocumentUrlAction(doc.id)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (error: any) {
      console.error('Download error:', error)
      toast.error(error.message || 'Unable to access this document.')
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
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(error.message || 'Failed to delete document. Please try again.')
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
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-label-secondary" />
        </div>
      ) : documents.length === 0 ? (
        <div className="glass-light bg-muted/40 border border-border rounded-glass-sm p-6 text-center">
          <FileText className="w-12 h-12 text-label-secondary mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-label-primary mb-2">No documents yet</h3>
          <p className="text-label-secondary mb-4">
            Upload resumes, cover letters, or other attachments for this application.
          </p>
          <Button onClick={handleUploadClick} variant="default">
            <Plus className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {documents.map(doc => (
            <div
              key={doc.id}
              className="glass-ultra rounded-glass-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-border shadow-glass-subtle hover:border-foreground/30 dark:hover:border-copper/40 transition-all duration-200"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-muted/60 dark:bg-copper/10 rounded-md shrink-0 border border-border dark:border-copper/20">
                  <File className="w-5 h-5 text-foreground dark:text-copper" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-medium text-label-primary truncate" title={doc.name}>
                    {doc.name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-label-secondary mt-1">
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
                  className="h-8 text-label-primary hover:text-foreground hover:bg-accent font-medium transition-colors"
                >
                  {isDownloadingId === doc.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
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
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent variant="glass" className="border-border/60 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-label-primary">Upload Document</DialogTitle>
            <DialogDescription className="text-label-secondary">
              Supported formats: PDF, DOC, DOCX (Max 5MB)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-label-secondary">Document Type</label>
              <Select value={uploadType} onValueChange={val => setUploadType(val as DocumentType)}>
                <SelectTrigger className="glass-ultra border-border">
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
              <label className="text-sm font-medium text-label-secondary">File</label>
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
                  className="glass-ultra border-border shrink-0"
                >
                  Choose File
                </Button>
                <span className="text-sm text-label-secondary truncate">
                  {selectedFile ? selectedFile.name : 'No file selected'}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsUploadDialogOpen(false)}
              className="text-label-secondary hover:text-label-primary"
            >
              Cancel
            </Button>
            <Button
              variant="brand"
              onClick={handleUploadSubmit}
              disabled={!selectedFile || isUploading}
              className="min-w-[100px]"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
        <DialogContent variant="glass" className="border-border/60 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-label-primary">Delete Document</DialogTitle>
            <DialogDescription className="text-label-secondary">
              Are you sure you want to delete{' '}
              <span className="font-medium text-label-primary">{documentToDelete?.name}</span>? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button
              variant="ghost"
              onClick={() => setDocumentToDelete(null)}
              className="text-label-secondary hover:text-label-primary"
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
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
