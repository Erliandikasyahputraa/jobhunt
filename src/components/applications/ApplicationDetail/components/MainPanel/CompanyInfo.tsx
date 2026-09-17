'use client'

import * as React from 'react'
import { Building2, Globe, Link2, Plus, Edit2, Unlink } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Application, CompanyDB } from '@/lib/types/database.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  getCompaniesAction,
  getCompanyByIdAction,
  createCompanyAction,
  updateCompanyAction,
  linkCompanyAction,
  unlinkCompanyAction,
} from '@/app/dashboard/actions'

interface CompanyInfoProps {
  application: Application
  className?: string
}

export function CompanyInfo({ application, className }: CompanyInfoProps) {
  const [company, setCompany] = React.useState<CompanyDB | null>(null)
  const [availableCompanies, setAvailableCompanies] = React.useState<CompanyDB[]>([])

  const [isLoading, setIsLoading] = React.useState(true)
  const [isCreating, setIsCreating] = React.useState(false)
  const [isLinking, setIsLinking] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)

  const [formData, setFormData] = React.useState({
    name: application.company_name || '',
    website: '',
    industry: '',
    location: '',
    linkedin_url: '',
    github_url: '',
    overview: '',
  })

  const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>('')

  const loadCompany = React.useCallback(async () => {
    if (!application.company_id) {
      setCompany(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const data = await getCompanyByIdAction(application.company_id)
      setCompany(data)
    } catch (error) {
      console.error(error)
      toast.error('Failed to load company profile')
    } finally {
      setIsLoading(false)
    }
  }, [application.company_id])

  React.useEffect(() => {
    loadCompany()
  }, [loadCompany])

  const loadAvailableCompanies = async () => {
    try {
      setIsLoading(true)
      const data = await getCompaniesAction()
      setAvailableCompanies(data)
      setIsLinking(true)
    } catch (error) {
      console.error(error)
      toast.error('Failed to load companies')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      const newCompany = await createCompanyAction(formData)
      await linkCompanyAction(application.id, newCompany.id)
      setCompany(newCompany)
      setIsCreating(false)
      toast.success('Company profile created and linked')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to create company')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company) return
    try {
      setIsLoading(true)
      const updatedCompany = await updateCompanyAction(company.id, formData)
      setCompany(updatedCompany)
      setIsEditing(false)
      toast.success('Company profile updated')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to update company')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLink = async () => {
    if (!selectedCompanyId) return
    try {
      setIsLoading(true)
      await linkCompanyAction(application.id, selectedCompanyId)
      const linked = availableCompanies.find(c => c.id === selectedCompanyId)
      if (linked) {
        setCompany(linked)
      } else {
        await loadCompany()
      }
      setIsLinking(false)
      toast.success('Company linked')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to link company')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnlink = async () => {
    try {
      setIsLoading(true)
      await unlinkCompanyAction(application.id)
      setCompany(null)
      toast.success('Company unlinked')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to unlink company')
    } finally {
      setIsLoading(false)
    }
  }

  const startEdit = () => {
    if (company) {
      setFormData({
        name: company.name,
        website: company.website || '',
        industry: company.industry || '',
        location: company.location || '',
        linkedin_url: company.linkedin_url || '',
        github_url: company.github_url || '',
        overview: company.overview || '',
      })
      setIsEditing(true)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (isLoading && !company && !isCreating && !isLinking) {
    return (
      <div className={cn('flex items-center justify-center p-12', className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-copper"></div>
      </div>
    )
  }

  if (isCreating || isEditing) {
    return (
      <div className={cn('space-y-4 sm:space-y-6', className)}>
        <div className="bg-[var(--modal-card)] border border-[var(--modal-border)] rounded-xl p-5 sm:p-6 shadow-xs">
          <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Building2
              className="h-5 w-5 text-[hsl(var(--copper-dark))] shrink-0"
              aria-hidden="true"
            />
            {isEditing ? 'Edit Company Profile' : 'Create Company Profile'}
          </h3>
          <form onSubmit={isEditing ? handleUpdate : handleCreate} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-[var(--text-primary)] mb-1"
              >
                Company Name *
              </label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label
                htmlFor="website"
                className="block text-sm font-semibold text-[var(--text-primary)] mb-1"
              >
                Website
              </label>
              <Input
                id="website"
                name="website"
                type="url"
                value={formData.website}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="industry"
                  className="block text-sm font-semibold text-[var(--text-primary)] mb-1"
                >
                  Industry
                </label>
                <Input
                  id="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-semibold text-[var(--text-primary)] mb-1"
                >
                  Location
                </label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="linkedin_url"
                  className="block text-sm font-semibold text-[var(--text-primary)] mb-1"
                >
                  LinkedIn URL
                </label>
                <Input
                  id="linkedin_url"
                  name="linkedin_url"
                  type="url"
                  value={formData.linkedin_url}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label
                  htmlFor="github_url"
                  className="block text-sm font-semibold text-[var(--text-primary)] mb-1"
                >
                  GitHub URL
                </label>
                <Input
                  id="github_url"
                  name="github_url"
                  type="url"
                  value={formData.github_url}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="overview"
                className="block text-sm font-semibold text-[var(--text-primary)] mb-1"
              >
                Overview
              </label>
              <Textarea
                id="overview"
                name="overview"
                value={formData.overview}
                onChange={handleInputChange}
                disabled={isLoading}
                className="min-h-[100px]"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreating(false)
                  setIsEditing(false)
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-amber-700 hover:bg-amber-800 text-white dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-zinc-950 font-medium"
              >
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  if (isLinking) {
    return (
      <div className={cn('space-y-4 sm:space-y-6', className)}>
        <div className="bg-[var(--modal-card)] border border-[var(--modal-border)] rounded-xl p-5 sm:p-6 shadow-xs">
          <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Link2 className="h-5 w-5 text-[hsl(var(--copper-dark))] shrink-0" aria-hidden="true" />
            Link Existing Company
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">
                Select Company
              </label>
              <Select
                value={selectedCompanyId}
                onValueChange={setSelectedCompanyId}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a company..." />
                </SelectTrigger>
                <SelectContent>
                  {availableCompanies.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No companies found
                    </SelectItem>
                  ) : (
                    availableCompanies.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsLinking(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleLink}
                disabled={isLoading || !selectedCompanyId || selectedCompanyId === 'none'}
                className="bg-amber-700 hover:bg-amber-800 text-white dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-zinc-950 font-medium"
              >
                {isLoading ? 'Linking...' : 'Link'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (company) {
    return (
      <div className={cn('space-y-4 sm:space-y-6', className)}>
        <div className="bg-[var(--modal-card)] border border-[var(--modal-border)] rounded-xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Building2
                className="h-5 w-5 text-[hsl(var(--copper-dark))] shrink-0"
                aria-hidden="true"
              />
              Company Profile
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={startEdit} disabled={isLoading}>
                <Edit2 className="h-4 w-4 mr-1.5 shrink-0" aria-hidden="true" />
                Edit
              </Button>
              <Button size="sm" variant="outline" onClick={handleUnlink} disabled={isLoading}>
                <Unlink className="h-4 w-4 mr-1.5 shrink-0" aria-hidden="true" />
                Unlink
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-1">
                Company Name
              </h4>
              <p className="text-[var(--text-primary)] font-medium">{company.name}</p>
            </div>

            {(company.website || company.industry || company.location) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {company.website && (
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-[var(--text-secondary)] flex items-center gap-2">
                      <Globe
                        className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0"
                        aria-hidden="true"
                      />{' '}
                      Website
                    </span>
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-700 dark:text-amber-400 hover:underline truncate"
                    >
                      {company.website}
                    </a>
                  </div>
                )}
                {company.industry && (
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-[var(--text-secondary)]">Industry</span>
                    <span className="text-[var(--text-primary)]">{company.industry}</span>
                  </div>
                )}
                {company.location && (
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-[var(--text-secondary)]">Location</span>
                    <span className="text-[var(--text-primary)]">{company.location}</span>
                  </div>
                )}
              </div>
            )}

            {(company.linkedin_url || company.github_url) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {company.linkedin_url && (
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-[var(--text-secondary)]">LinkedIn</span>
                    <a
                      href={company.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-700 dark:text-amber-400 hover:underline truncate"
                    >
                      {company.linkedin_url}
                    </a>
                  </div>
                )}
                {company.github_url && (
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-[var(--text-secondary)]">GitHub</span>
                    <a
                      href={company.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-700 dark:text-amber-400 hover:underline truncate"
                    >
                      {company.github_url}
                    </a>
                  </div>
                )}
              </div>
            )}

            {company.overview && (
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-1">
                  Overview
                </h4>
                <p className="text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
                  {company.overview}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // No company profile linked state
  return (
    <div className={cn('space-y-4 sm:space-y-6', className)}>
      <div className="bg-[var(--modal-card)] border border-[var(--modal-border)] rounded-xl p-6 sm:p-10 text-center shadow-xs">
        <Building2 className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-3" aria-hidden="true" />
        <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-2">
          No company profile linked
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
          This application is for{' '}
          <strong className="text-[var(--text-primary)]">{application.company_name}</strong> but it
          is not linked to a dedicated Company Profile yet.
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 w-full max-w-xs sm:max-w-none mx-auto">
          <Button
            onClick={() => setIsCreating(true)}
            disabled={isLoading}
            className="w-full sm:w-auto bg-amber-700 hover:bg-amber-800 text-white dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-zinc-950 font-medium"
          >
            <Plus className="h-4 w-4 mr-1.5 shrink-0" aria-hidden="true" />
            Create Company Profile
          </Button>
          <Button
            variant="outline"
            onClick={loadAvailableCompanies}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            <Link2 className="h-4 w-4 mr-1.5 shrink-0" aria-hidden="true" />
            Link Existing Company
          </Button>
        </div>
      </div>
    </div>
  )
}
