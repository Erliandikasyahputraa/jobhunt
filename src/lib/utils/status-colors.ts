

export type StatusCategory =
  | 'Wishlist'
  | 'Applied'
  | 'Interviewing'
  | 'Offer'
  | 'Rejected'
  | 'Closed'
  | 'Other'

export function getStatusCategory(status: string): StatusCategory {
  switch (status) {
    case 'wishlist':
      return 'Wishlist'
    case 'applied':
      return 'Applied'
    case 'phone_screen':
    case 'assessment':
    case 'take_home':
    case 'interviewing':
    case 'final_round':
      return 'Interviewing'
    case 'offered':
    case 'accepted':
      return 'Offer'
    case 'rejected':
      return 'Rejected'
    case 'withdrawn':
    case 'ghosted':
      return 'Closed'
    default:
      return 'Other'
  }
}

// Map each category to specific CSS variables defined in semantic-colors.css
// or use Tailwind classes directly for badges.
export const STATUS_STYLES: Record<
  StatusCategory,
  { chart: string; badge: string }
> = {
  Wishlist: {
    chart: '#94a3b8',
    badge:
      'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  },
  Applied: {
    chart: '#38bdf8',
    badge:
      'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300 border-sky-200 dark:border-sky-800/50',
  },
  Interviewing: {
    chart: '#818cf8',
    badge:
      'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50',
  },
  Offer: {
    chart: '#34d399',
    badge:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
  },
  Rejected: {
    chart: '#f87171',
    badge:
      'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300 border-red-200 dark:border-red-800/50',
  },
  Closed: {
    chart: '#64748b',
    badge:
      'bg-slate-200 text-slate-700 dark:bg-slate-700/30 dark:text-slate-400 border-slate-300 dark:border-slate-700',
  },
  Other: {
    chart: '#cbd5e1',
    badge:
      'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300 border-gray-200 dark:border-gray-700',
  },
}

export function getStatusStyles(status: string) {
  const category = getStatusCategory(status)
  return STATUS_STYLES[category]
}
