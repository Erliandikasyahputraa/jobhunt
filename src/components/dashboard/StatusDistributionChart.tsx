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
    <Card className="w-full bg-[var(--surface-card)] border border-[var(--border-default)] shadow-depth-1 @lg:col-span-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg font-semibold text-[var(--text-primary)] min-w-0 truncate">
            Status Distribution
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-[200px] w-full">
          {data.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center">
              <div className="h-[132px] w-[132px] rounded-full border-[18px] border-[var(--border-subtle)]" />
              <p className="absolute inset-x-0 bottom-0 text-center text-sm text-[var(--text-secondary)]">
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
              arcLinkLabelsTextColor={resolvedTheme === 'light' ? '#334155' : '#e4e4e7'}
              arcLinkLabelsThickness={2}
              arcLinkLabelsColor={{ from: 'color' }}
              theme={{
                text: { fontSize: 11 },
                tooltip: {
                  container: { background: 'transparent', boxShadow: 'none', padding: 0 },
                },
              }}
              tooltip={({ datum }) => (
                <div className="bg-[var(--surface-card)] text-[var(--text-primary)] border border-[var(--border-default)] px-3 py-2 rounded-lg text-xs shadow-depth-3 flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: datum.data.color }}
                  />
                  <span className="font-semibold text-[var(--text-primary)]">
                    {datum.data.label}
                  </span>
                  <span className="text-[var(--text-secondary)] tabular-nums font-medium">
                    — {datum.value}
                  </span>
                </div>
              )}
            />
          )}
          {data.length > 0 && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-px text-center">
              <span className="text-2xl font-bold leading-tight tabular-nums text-[var(--text-primary)]">
                {total}
              </span>
              <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider tabular-nums">
                Total
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
