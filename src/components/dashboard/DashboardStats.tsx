'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Briefcase, CheckCircle, Clock, Star } from 'lucide-react'
import type { DashboardStats as Stats } from '@/lib/utils/dashboard'

interface DashboardStatsProps {
  stats: Stats
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: 'Total Applications',
      value: stats.total,
      icon: Briefcase,
      color: 'text-sky-600 dark:text-sky-400',
      bgColor: 'bg-sky-500/10',
      borderColor: 'border-sky-500/20',
    },
    {
      title: 'Active Applications',
      value: stats.active,
      icon: Clock,
      color: 'text-amber-700 dark:text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
    },
    {
      title: 'Interviews',
      value: stats.interviews,
      icon: Star,
      color: 'text-indigo-700 dark:text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
    },
    {
      title: 'Offers',
      value: stats.offers,
      icon: CheckCircle,
      color: 'text-emerald-700 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {statCards.map(card => (
        <Card
          key={card.title}
          className="bg-[var(--surface-card)] border border-[var(--border-default)] shadow-depth-1 hover:bg-[var(--surface-card-hover)] hover:shadow-depth-2 transition-all duration-200"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold tracking-wide text-[var(--text-secondary)]">
              {card.title}
            </CardTitle>
            <div
              className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${card.bgColor} ${card.borderColor}`}
            >
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums text-[var(--text-primary)]">
              {card.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
