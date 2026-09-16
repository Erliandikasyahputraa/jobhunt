'use client'

import * as React from 'react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Settings, Trash2, Edit2, Save, X } from 'lucide-react'
import type {
  ColumnConfig,
  CreateColumnData,
  UpdateColumnData,
  ColumnType,
} from '@/lib/types/column.types'
import type { CustomColumnDB } from '@/lib/types/database.types'
import { DEFAULT_COLUMNS } from '@/lib/storage/column-storage'
import { DEFAULT_COLUMN_ICONS } from '@/lib/utils/column-icons'
import { DraggableColumnList } from './DraggableColumnList'
import {
  createCustomColumnAction,
  updateCustomColumnAction,
  deleteCustomColumnAction,
  reorderCustomColumnsAction,
} from '@/app/dashboard/actions'
import { toast } from 'sonner'

interface ColumnManageModalProps {
  isOpen: boolean
  onClose: () => void
  customColumns: CustomColumnDB[]
  onCustomColumnsChange: (columns: CustomColumnDB[]) => void
}

function ColumnItem({
  column,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onIconChange,
  onNameChange,
  onDescriptionChange,
}: {
  column: ColumnConfig
  isEditing: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onDelete: () => void
  onIconChange: (icon: string) => void
  onNameChange: (name: string) => void
  onDescriptionChange: (description: string) => void
}) {
  const [editName, setEditName] = useState(column.name)
  const [editDescription, setEditDescription] = useState(column.description || '')
  const [editIcon, setEditIcon] = useState(column.icon || '')

  const handleSave = () => {
    onNameChange(editName)
    onDescriptionChange(editDescription)
    onIconChange(editIcon)
    onSave()
  }

  const handleCancel = () => {
    setEditName(column.name)
    setEditDescription(column.description || '')
    setEditIcon(column.icon || '')
    onCancel()
  }

  return (
    <div className="w-full">
      {isEditing ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <select
              value={editIcon}
              onChange={e => setEditIcon(e.target.value)}
              className="text-sm bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-md px-2 py-1 text-slate-900 dark:text-slate-100"
            >
              <option value="">Select icon...</option>
              {DEFAULT_COLUMN_ICONS.map(icon => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>
            <Input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="h-8 text-sm font-semibold flex-1"
              placeholder="Column name"
            />
          </div>
          <Input
            value={editDescription}
            onChange={e => setEditDescription(e.target.value)}
            className="h-8 text-sm"
            placeholder="Column description (optional)"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={!editName.trim()}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-card text-card-foreground border border-border rounded-xl p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-lg">{column.icon || '📋'}</span>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {column.name}
                </h4>
                {column.description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                    {column.description}
                  </p>
                )}
              </div>
              {column.isCustom && (
                <Badge variant="secondary" className="text-xs">
                  Custom
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {column.isCustom && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  onClick={onEdit}
                  title="Edit column"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
              {column.isCustom && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  onClick={onDelete}
                  title="Delete column"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function ColumnManageModal({
  isOpen,
  onClose,
  customColumns,
  onCustomColumnsChange,
}: ColumnManageModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingColumn, setDeletingColumn] = useState<ColumnConfig | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newColumn, setNewColumn] = useState<CreateColumnData>({
    name: '',
    description: '',
    icon: '',
  })
  const [isProcessing, setIsProcessing] = useState(false)

  // Map CustomColumnDB to ColumnConfig for the UI
  const mappedCustomColumns: ColumnConfig[] = customColumns
    .map(cc => ({
      id: cc.id as any,
      name: cc.name,
      description: cc.description || undefined,
      icon: cc.icon || undefined,
      isCustom: true,
      order: cc.order,
    }))
    .sort((a, b) => a.order - b.order)

  const handleCustomColumnReorder = async (newOrder: ColumnType[]) => {
    try {
      const updates = newOrder.map((id, index) => ({ id, order: index }))

      // Optimistic update
      const newCustomColumns = [...customColumns]
      newCustomColumns.forEach(c => {
        const match = updates.find(u => u.id === c.id)
        if (match) c.order = match.order
      })
      onCustomColumnsChange(newCustomColumns)

      await reorderCustomColumnsAction(updates)
    } catch (err) {
      console.error('Failed to reorder', err)
      // On error, let parent refetch or simply rely on optimistic failing
    }
  }

  const handleCreateColumn = async () => {
    if (!newColumn.name.trim() || isProcessing) return
    setIsProcessing(true)

    try {
      const added = await createCustomColumnAction({
        name: newColumn.name,
        description: newColumn.description || null,
        icon: newColumn.icon || null,
        order: customColumns.length,
      })
      onCustomColumnsChange([...customColumns, added])
      setNewColumn({ name: '', description: '', icon: '' })
      setShowAddForm(false)
      toast.success('Column created')
    } catch (err) {
      console.error('Failed to create column', err)
      toast.error("Couldn't create column. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUpdateColumn = async (columnId: string, updates: Partial<UpdateColumnData>) => {
    try {
      // Optimistic update
      const optimisticColumns = customColumns.map(c =>
        c.id === columnId
          ? {
              ...c,
              ...updates,
              description: updates.description ?? c.description,
              icon: updates.icon ?? c.icon,
            }
          : c
      )
      onCustomColumnsChange(optimisticColumns)

      const updated = await updateCustomColumnAction(columnId, updates)

      // Actual update
      onCustomColumnsChange(customColumns.map(c => (c.id === columnId ? updated : c)))
      toast.success('Column updated')
    } catch (err) {
      console.error('Failed to update column', err)
      toast.error("Couldn't update column. Please try again.")
    }
  }

  const handleDeleteColumn = (column: ColumnConfig) => {
    setDeletingColumn(column)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteColumn = async () => {
    if (deletingColumn && deletingColumn.isCustom && !isProcessing) {
      setIsProcessing(true)
      try {
        await deleteCustomColumnAction(deletingColumn.id)
        onCustomColumnsChange(customColumns.filter(c => c.id !== deletingColumn.id))
        toast.success('Column deleted')
      } catch (err) {
        console.error('Failed to delete', err)
        toast.error("Couldn't delete column. Please try again.")
      } finally {
        setIsProcessing(false)
        setDeleteDialogOpen(false)
        setDeletingColumn(null)
      }
    }
  }

  const handleColumnEdit = (columnId: string) => {
    setEditingId(columnId)
  }

  const handleColumnSave = () => {
    setEditingId(null)
  }

  const handleColumnCancel = () => {
    setEditingId(null)
  }

  const handleIconChange = (columnId: string, icon: string) => {
    handleUpdateColumn(columnId, { icon })
  }

  const handleNameChange = (columnId: string, name: string) => {
    handleUpdateColumn(columnId, { name })
  }

  const handleDescriptionChange = (columnId: string, description: string) => {
    handleUpdateColumn(columnId, { description })
  }

  // Core columns are static and cannot be modified here
  const coreColumns = [...DEFAULT_COLUMNS].sort((a, b) => a.order - b.order)

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 shadow-2xl rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Settings className="h-5 w-5 text-orange-600 dark:text-amber-500" />
              Manage Columns
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Customize your kanban board by adding, editing, or removing custom columns. Core
              columns cannot be modified.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Core Columns */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                Core Columns (Fixed)
              </h3>
              <div className="space-y-2">
                {coreColumns.map(column => (
                  <ColumnItem
                    key={column.id}
                    column={column}
                    isEditing={false}
                    onEdit={() => {}}
                    onSave={() => {}}
                    onCancel={() => {}}
                    onDelete={() => {}}
                    onIconChange={() => {}}
                    onNameChange={() => {}}
                    onDescriptionChange={() => {}}
                  />
                ))}
              </div>
            </div>

            {/* Custom Columns */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Custom Columns
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="border-neutral-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Column
                </Button>
              </div>

              {showAddForm && (
                <div className="bg-slate-50 dark:bg-[#090d16] rounded-xl p-4 border border-neutral-200 dark:border-slate-800 mb-3">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={newColumn.icon}
                        onChange={e => setNewColumn({ ...newColumn, icon: e.target.value })}
                        className="text-sm bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-md px-2 py-1 text-slate-900 dark:text-slate-100"
                      >
                        <option value="">Select icon...</option>
                        {DEFAULT_COLUMN_ICONS.map(icon => (
                          <option key={icon} value={icon}>
                            {icon}
                          </option>
                        ))}
                      </select>
                      <Input
                        value={newColumn.name}
                        onChange={e => setNewColumn({ ...newColumn, name: e.target.value })}
                        placeholder="Column name"
                        className="flex-1"
                      />
                    </div>
                    <Input
                      value={newColumn.description}
                      onChange={e => setNewColumn({ ...newColumn, description: e.target.value })}
                      placeholder="Column description (optional)"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleCreateColumn}
                        disabled={!newColumn.name.trim() || isProcessing}
                        className="min-w-[120px] bg-orange-700 hover:bg-orange-800 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 font-medium"
                      >
                        {isProcessing ? 'Creating...' : 'Create Column'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowAddForm(false)
                          setNewColumn({ name: '', description: '', icon: '' })
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {mappedCustomColumns.length === 0 ? (
                  <div className="bg-slate-50 dark:bg-[#090d16] rounded-xl p-8 text-center border-2 border-dashed border-neutral-200 dark:border-slate-800">
                    <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                      No custom columns yet
                    </p>
                    <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                      Add custom columns to track additional application stages
                    </p>
                  </div>
                ) : (
                  <DraggableColumnList
                    columns={mappedCustomColumns}
                    onReorder={handleCustomColumnReorder}
                  >
                    {(column, _isDragging) => (
                      <ColumnItem
                        column={column}
                        isEditing={editingId === column.id}
                        onEdit={() => handleColumnEdit(column.id)}
                        onSave={handleColumnSave}
                        onCancel={handleColumnCancel}
                        onDelete={() => handleDeleteColumn(column)}
                        onIconChange={icon => handleIconChange(column.id, icon)}
                        onNameChange={name => handleNameChange(column.id, name)}
                        onDescriptionChange={description =>
                          handleDescriptionChange(column.id, description)
                        }
                      />
                    )}
                  </DraggableColumnList>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-neutral-200 dark:border-slate-800">
            <Button variant="outline" onClick={onClose}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 shadow-2xl rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 dark:text-slate-100">
              Delete Column
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
              Are you sure you want to delete "{deletingColumn?.name}"? This action cannot be
              undone. Applications in this column will be reverted back to their standard pipeline
              status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteColumn}
              disabled={isProcessing}
              className="bg-error hover:bg-error/90 text-error-foreground min-w-[100px]"
            >
              {isProcessing ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
