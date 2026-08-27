'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { type ApplicationFormData, type ApplicationStatus } from '@/lib/schemas/application.schema'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

// Define a form-friendly version of the schema that works better with React Hook Form
const formSchema = z.object({
  company_name: z
    .string()
    .min(1, 'Company name is required')
    .max(255, 'Company name must be less than 255 characters'),
  job_title: z
    .string()
    .min(1, 'Job title is required')
    .max(255, 'Job title must be less than 255 characters'),
  job_url: z.string().url('Must be a valid URL').or(z.literal('')),
  location: z.string().max(255, 'Location must be less than 255 characters'),
  salary_range: z.string().max(100, 'Salary range must be less than 100 characters'),
  status: z.enum([
    'wishlist',
    'applied',
    'phone_screen',
    'assessment',
    'take_home',
    'interviewing',
    'final_round',
    'offered',
    'accepted',
    'rejected',
    'withdrawn',
    'ghosted',
  ]),
  date_applied: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  notes: z.string().max(5000, 'Notes must be less than 5000 characters'),
})

type FormData = z.infer<typeof formSchema>

interface ApplicationFormProps {
  onSubmit: (_data: ApplicationFormData) => void
  onCancel?: () => void
  initialData?: Partial<ApplicationFormData>
  isLoading?: boolean
  submitButtonText?: string
}

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: 'wishlist', label: 'Wishlist' },
  { value: 'applied', label: 'Applied' },
  { value: 'phone_screen', label: 'Phone Screen' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'take_home', label: 'Take Home' },
  { value: 'interviewing', label: 'Interview' },
  { value: 'final_round', label: 'Final Round' },
  { value: 'offered', label: 'Offered' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'ghosted', label: 'Ghosted' },
]

export default function ApplicationForm({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
  submitButtonText = 'Submit Application',
}: ApplicationFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company_name: initialData?.company_name ?? '',
      job_title: initialData?.job_title ?? '',
      job_url: initialData?.job_url ?? '',
      location: initialData?.location ?? '',
      salary_range: initialData?.salary_range ?? '',
      status: initialData?.status ?? 'wishlist',
      date_applied: initialData?.date_applied ?? new Date().toISOString().split('T')[0],
      notes: initialData?.notes ?? '',
    },
  })

  const handleSubmit = (data: FormData) => {
    // Cast to ApplicationFormData - the types are compatible
    onSubmit(data as unknown as ApplicationFormData)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Company Name */}
          <FormField
            control={form.control}
            name="company_name"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel className="text-neutral-900 dark:text-label-primary font-semibold">
                  Company Name <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., Google, Microsoft, Acme Inc."
                    required
                    disabled={isLoading}
                    aria-required="true"
                    className="bg-white text-neutral-900 border-neutral-900/40 focus-visible:border-neutral-900 placeholder:text-neutral-500 shadow-xs dark:glass-ultra dark:border-0 dark:text-label-primary dark:placeholder:text-label-tertiary"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Job Title */}
          <FormField
            control={form.control}
            name="job_title"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel className="text-neutral-900 dark:text-label-primary font-semibold">
                  Job Title <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., Software Engineer, Product Manager"
                    required
                    disabled={isLoading}
                    aria-required="true"
                    className="bg-white text-neutral-900 border-neutral-900/40 focus-visible:border-neutral-900 placeholder:text-neutral-500 shadow-xs dark:glass-ultra dark:border-0 dark:text-label-primary dark:placeholder:text-label-tertiary"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Job URL */}
          <FormField
            control={form.control}
            name="job_url"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel className="text-neutral-900 dark:text-label-primary font-semibold">
                  Job URL
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="url"
                    placeholder="https://example.com/job-posting"
                    disabled={isLoading}
                    value={field.value ?? ''}
                    className="bg-white text-neutral-900 border-neutral-900/40 focus-visible:border-neutral-900 placeholder:text-neutral-500 shadow-xs dark:glass-ultra dark:border-0 dark:text-label-primary dark:placeholder:text-label-tertiary"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Location */}
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-neutral-900 dark:text-label-primary font-semibold">
                  Location
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., Remote, San Francisco, CA"
                    disabled={isLoading}
                    value={field.value ?? ''}
                    className="bg-white text-neutral-900 border-neutral-900/40 focus-visible:border-neutral-900 placeholder:text-neutral-500 shadow-xs dark:glass-ultra dark:border-0 dark:text-label-primary dark:placeholder:text-label-tertiary"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Salary Range */}
          <FormField
            control={form.control}
            name="salary_range"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-neutral-900 dark:text-label-primary font-semibold">
                  Salary Range
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., $100k-$150k"
                    disabled={isLoading}
                    value={field.value ?? ''}
                    className="bg-white text-neutral-900 border-neutral-900/40 focus-visible:border-neutral-900 placeholder:text-neutral-500 shadow-xs dark:glass-ultra dark:border-0 dark:text-label-primary dark:placeholder:text-label-tertiary"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-neutral-900 dark:text-label-primary font-semibold">
                  Status <span className="text-red-500">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger
                      aria-label="Status"
                      className="bg-white text-neutral-900 border-neutral-900/40 focus:border-neutral-900 shadow-xs dark:border-border dark:text-foreground"
                    >
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white text-neutral-900 border-neutral-900/20 dark:bg-card dark:text-foreground dark:border-border">
                    {STATUS_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date Applied */}
          <FormField
            control={form.control}
            name="date_applied"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-neutral-900 dark:text-label-primary font-semibold">
                  Date Applied <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="date"
                    disabled={isLoading}
                    className="bg-white text-neutral-900 border-neutral-900/40 focus-visible:border-neutral-900 shadow-xs dark:glass-ultra dark:border-0 dark:text-label-primary"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel className="text-neutral-900 dark:text-label-primary font-semibold">
                  Notes
                </FormLabel>
                <p className="text-xs text-neutral-600 dark:text-label-tertiary mb-2">
                  Additional notes, interview details, etc.
                </p>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Add any additional notes or interview details here..."
                    className="min-h-[120px] resize-y bg-white text-neutral-900 border border-neutral-900/40 focus-visible:border-neutral-900 placeholder:text-neutral-500 shadow-xs dark:glass-ultra dark:border-0 dark:text-label-primary dark:placeholder:text-label-tertiary rounded-md p-3"
                    disabled={isLoading}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-label-quaternary">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="min-w-[100px] bg-white text-neutral-900 border-neutral-900 dark:bg-card dark:text-foreground dark:border-border font-medium hover:bg-neutral-100 dark:hover:bg-accent active:scale-[0.98] transition-all shadow-xs"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="default"
            disabled={isLoading}
            className="min-w-[160px] bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 active:scale-[0.98] transition-all font-semibold shadow-xs"
          >
            {isLoading
              ? submitButtonText === 'Save Changes'
                ? 'Saving...'
                : 'Creating...'
              : submitButtonText}
          </Button>
        </div>
      </form>
    </Form>
  )
}
