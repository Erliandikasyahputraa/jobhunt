import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'rounded-md border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
        secondary:
          'rounded-md border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'rounded-md border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
        outline: 'rounded-md text-foreground border-border',
        copper: 'rounded-md border-transparent bg-copper text-white shadow-xs hover:bg-copper-dark',
        glass:
          'rounded-full bg-[var(--glass-light)] backdrop-blur-[20px] [-webkit-backdrop-filter:blur(20px)] saturate-[180%] border-[var(--glass-border-medium)] text-[var(--text-primary)] shadow-glass-subtle',
        'glass-success':
          'rounded-glass-sm bg-[var(--glass-ultra)] backdrop-blur-[15px] [-webkit-backdrop-filter:blur(15px)] border border-green-500/30 text-green-600 dark:text-green-400 shadow-glass-subtle',
        'glass-warning':
          'rounded-glass-sm bg-[var(--glass-ultra)] backdrop-blur-[15px] [-webkit-backdrop-filter:blur(15px)] border border-amber-500/30 text-amber-600 dark:text-amber-400 shadow-glass-subtle',
        'glass-error':
          'rounded-glass-sm bg-[var(--glass-ultra)] backdrop-blur-[15px] [-webkit-backdrop-filter:blur(15px)] border border-red-500/30 text-red-600 dark:text-red-400 shadow-glass-subtle',
        'glass-info':
          'rounded-glass-sm bg-[var(--glass-ultra)] backdrop-blur-[15px] [-webkit-backdrop-filter:blur(15px)] border border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-glass-subtle',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
