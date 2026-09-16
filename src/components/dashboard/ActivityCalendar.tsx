'use client'

import { useState } from 'react'
import { ResponsiveCalendar } from '@nivo/calendar'
import { format, parseISO } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface ActivityCalendarDatum {
  day: string
  value: number
}

export function ActivityCalendar({
  years,
  dataByYear,
}: {
  years: string[]
  dataByYear: Record<string, ActivityCalendarDatum[]>
}) {
  const [year, setYear] = useState(years.at(-1))
  const data = dataByYear[year ?? ''] ?? []
  const countMap = Object.fromEntries(data.map(d => [d.day, d.value ?? 0]))

  return (
    <Card className="w-full bg-[var(--surface-card)] border border-[var(--border-default)] shadow-depth-1">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-[var(--text-primary)]">
            Application Activity
          </CardTitle>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger
              className="w-[100px] bg-[var(--surface-input)] border border-[var(--border-default)]"
              aria-label="Select year"
            >
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent className="bg-[var(--surface-card)] border border-[var(--border-default)] shadow-depth-3">
              {years.map(y => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="h-[200px] overflow-hidden p-0 sm:p-6 pb-2">
        {data.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center">
            <p className="text-sm text-[var(--text-secondary)]">No activity recorded for {year}</p>
          </div>
        ) : (
          <div className="h-full w-full overflow-x-auto scrollbar-hide px-4 sm:px-0">
            <div className="h-full min-w-[700px] pb-4">
              <ResponsiveCalendar
                data={data}
                from={`${year}-01-01`}
                to={`${year}-12-31`}
                emptyColor="var(--heatmap-empty)"
                colors={[
                  'var(--heatmap-1)',
                  'var(--heatmap-2)',
                  'var(--heatmap-3)',
                  'var(--heatmap-4)',
                  'var(--heatmap-5)',
                ]}
                minValue={1}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                yearSpacing={40}
                monthBorderColor="var(--heatmap-border)"
                dayBorderWidth={2}
                dayBorderColor="var(--heatmap-border)"
                tooltip={day => {
                  const count = countMap[day.day] ?? 0
                  return (
                    <div className="bg-[var(--surface-card)] text-[var(--text-primary)] border border-[var(--border-default)] px-3 py-2 rounded-lg text-xs shadow-depth-3">
                      <div className="font-semibold text-[var(--text-primary)] mb-1">
                        {format(parseISO(day.day), 'EEE MMM d, yyyy')}
                      </div>
                      <div className="text-[var(--text-secondary)]">
                        <span className="font-medium text-[var(--text-primary)]">{count}</span>{' '}
                        application
                        {count === 1 ? '' : 's'} created
                      </div>
                    </div>
                  )
                }}
                theme={{
                  text: {
                    fill: 'var(--heatmap-text)',
                  },
                }}
                legends={[
                  {
                    anchor: 'bottom-right',
                    direction: 'row',
                    translateY: 36,
                    itemCount: 4,
                    itemWidth: 42,
                    itemHeight: 36,
                    itemsSpacing: 14,
                    itemDirection: 'right-to-left',
                  },
                ]}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
