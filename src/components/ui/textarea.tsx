import * as React from 'react'

import { cn } from '@/lib/utils'

export interface TextareaProps extends React.ComponentProps<'textarea'> {
  variant?: 'default' | 'glass'
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[60px] w-full px-3 py-2 text-sm text-foreground shadow-xs transition-colors placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 resize-y aria-invalid:border-destructive aria-invalid:ring-destructive/30',
          variant === 'default' &&
            'rounded-md border border-input bg-muted/30 dark:bg-slate-800/40 hover:border-slate-400 dark:hover:border-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring',
          variant === 'glass' &&
            'rounded-glass-sm bg-[var(--glass-ultra)] backdrop-blur-[15px] [-webkit-backdrop-filter:blur(15px)] border border-[var(--glass-border-medium)] hover:border-[var(--glass-border-strong)] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring focus-visible:shadow-glass-soft transition-all duration-300',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
