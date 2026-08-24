'use client'

import { formatDistanceToNow, parseISO } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Application } from '@/lib/types/database.types'

export function RecentActivity({ applications }: { applications: Application[] }) {
  return (
    <Card className="w-full glass-ultra border-glass-medium shadow-glass-subtle">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-label-primary">Recently Updated Applications</CardTitle>
      </CardHeader>
      <CardContent>
        {applications.length === 0 ? (
          <div className="flex justify-center p-4">
            <p className="text-sm text-label-secondary">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {applications.map(app => (
              <div
                key={app.id}
                className="flex flex-col gap-1 border-b border-border/50 pb-3 last:border-0 last:pb-0"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-semibold text-label-primary">{app.job_title}</h4>
                    <p className="text-xs text-label-secondary">{app.company_name}</p>
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {app.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-[10px] text-label-secondary">
                  Updated {formatDistanceToNow(parseISO(app.updated_at || app.created_at))} ago
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
