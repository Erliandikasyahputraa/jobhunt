'use client'

import * as React from 'react'
import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Application } from '@/lib/types/database.types'

interface JobDescriptionProps {
  application: Application
  className?: string
}

export function JobDescription({ application, className }: JobDescriptionProps) {
  return (
    <div className={cn('space-y-4 sm:space-y-6', className)}>
      {/* Job URL */}
      {application.job_url && (
        <section className="bg-white dark:bg-slate-800/90 border border-neutral-200 dark:border-slate-700/60 rounded-xl p-5 sm:p-6 shadow-xs">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
            <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-orange-700 dark:text-amber-400" />
            Job Posting
          </h3>
          <a
            href={application.job_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-orange-700 dark:text-amber-400 hover:text-orange-800 dark:hover:text-amber-300 hover:underline transition-colors duration-150 font-medium text-sm"
          >
            View Original Job Posting
            <ExternalLink className="w-4 h-4" />
          </a>
        </section>
      )}

      {/* Job Description */}
      {application.job_description && (
        <section className="bg-white dark:bg-slate-800/90 border border-neutral-200 dark:border-slate-700/60 rounded-xl p-5 sm:p-6 shadow-xs">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Job Description
          </h3>
          <div
            className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: application.job_description }}
          />
        </section>
      )}

      {/* Notes */}
      {application.notes && (
        <section className="bg-white dark:bg-slate-800/90 border border-neutral-200 dark:border-slate-700/60 rounded-xl p-5 sm:p-6 shadow-xs">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Notes
          </h3>
          <div className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
            {application.notes}
          </div>
        </section>
      )}

      {/* Empty State */}
      {!application.job_description && !application.notes && !application.job_url && (
        <section className="bg-white dark:bg-slate-800/90 border border-neutral-200 dark:border-slate-700/60 rounded-xl p-8 sm:p-12 text-center shadow-xs">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center">
              <span className="text-xl text-slate-500 dark:text-slate-400">📝</span>
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              No Details Available
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
              This application doesn't have any job description or notes yet.
            </p>
          </div>
        </section>
      )}
    </div>
  )
}
