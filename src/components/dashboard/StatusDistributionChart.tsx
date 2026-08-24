'use client'

import { ResponsivePie } from '@nivo/pie'
import { useTheme } from '@/components/providers/ThemeProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface DistributionData {
  id: string
  label: string
  value: number
  color: string
}

export function StatusDistributionChart({ data }: { data: DistributionData[] }) {
  const { resolvedTheme } = useTheme()
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card className="w-full glass-ultra border-glass-medium shadow-glass-subtle @lg:col-span-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg text-label-primary min-w-0 truncate">
            Status Distribution
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-[200px] w-full">
          {data.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center">
              <div className="h-[132px] w-[132px] rounded-full border-[18px] border-slate-200 dark:border-slate-800" />
              <p className="absolute inset-x-0 bottom-0 text-center text-sm text-label-secondary">
                No applications recorded
              </p>
            </div>
          ) : (
            <ResponsivePie
              data={data}
              margin={{ top: 26, right: 84, bottom: 26, left: 84 }}
              innerRadius={0.72}
              padAngle={2}
              cornerRadius={2}
              activeOuterRadiusOffset={4}
              colors={{ datum: 'data.color' }}
              borderWidth={0}
              enableArcLabels={false}
              enableArcLinkLabels={true}
              arcLinkLabelsSkipAngle={10}
              arcLinkLabelsTextColor={resolvedTheme === 'light' ? '#334155' : '#cbd5e1'}
              arcLinkLabelsThickness={2}
              arcLinkLabelsColor={{ from: 'color' }}
              theme={{
                text: { fontSize: 11 },
                tooltip: {
                  container: { background: '#1e293b', color: '#fff' },
                },
              }}
              tooltip={({ datum }) => (
                <div className="bg-slate-800 text-white px-3 py-2 rounded-md text-xs shadow-lg">
                  <strong>{datum.data.label}</strong> — {datum.value}
                </div>
              )}
            />
          )}
          {data.length > 0 && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-px text-center">
              <span className="text-xl font-bold leading-tight tabular-nums text-label-primary">
                {total}
              </span>
              <span className="text-sm text-label-secondary tabular-nums">Total</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
