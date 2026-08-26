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
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Active Applications',
      value: stats.active,
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'Interviews',
      value: stats.interviews,
      icon: Star,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
    },
    {
      title: 'Offers',
      value: stats.offers,
      icon: CheckCircle,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {statCards.map(card => (
        <Card
          key={card.title}
          className="glass-ultra border-border/80 shadow-glass-subtle hover:shadow-glass-soft hover:border-border transition-all duration-200"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-label-secondary">{card.title}</CardTitle>
            <div className={`p-2 rounded-full ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-label-primary">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
