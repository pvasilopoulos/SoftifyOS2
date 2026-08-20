import { useT } from '@/i18n'
import { useKernel, useRecords } from '@/kernel/store'
import { DEAL_STAGES, field } from '@/kernel/types'
import { formatCurrency } from '@/lib/format'
import { Surface } from '@/ui/primitives'

const MONTHS = [
  { label: 'Jan', value: 18 },
  { label: 'Feb', value: 24 },
  { label: 'Mar', value: 21 },
  { label: 'Apr', value: 36 },
  { label: 'May', value: 32 },
  { label: 'Jun', value: 44 },
  { label: 'Jul', value: 41 },
  { label: 'Aug', value: 52 },
]

export function InsightsModule() {
  const t = useT()
  const locale = useKernel((s) => s.ui.locale)
  const deals = useRecords('deal')
  const tasks = useRecords('task')
  const max = Math.max(...MONTHS.map((m) => m.value))
  const ytd = MONTHS.reduce((s, m) => s + m.value, 0) * 1000
  const done = tasks.filter((task) => field(task, 'status', '') === 'done').length

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 md:p-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Surface className="p-5">
          <div className="text-[11px] font-medium uppercase tracking-wider text-faint">{t.insights.revenue}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{formatCurrency(ytd, locale)}</div>
        </Surface>
        <Surface className="p-5">
          <div className="text-[11px] font-medium uppercase tracking-wider text-faint">{t.insights.pace}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            {done}/{tasks.length}
          </div>
        </Surface>
        <Surface className="p-5">
          <div className="text-[11px] font-medium uppercase tracking-wider text-faint">Won</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            {formatCurrency(
              deals.filter((d) => field(d, 'stage', '') === 'won').reduce((s, d) => s + field(d, 'amount', 0), 0),
              locale,
            )}
          </div>
        </Surface>
      </div>

      <Surface className="p-5">
        <h2 className="text-sm font-semibold">{t.insights.revenue}</h2>
        <div className="mt-6 flex h-40 items-end gap-3">
          {MONTHS.map((month) => (
            <div key={month.label} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-lg bg-accent/80"
                style={{ height: `${(month.value / max) * 100}%` }}
              />
              <span className="text-[10px] text-faint">{month.label}</span>
            </div>
          ))}
        </div>
      </Surface>

      <Surface className="p-5">
        <h2 className="text-sm font-semibold">{t.insights.funnel}</h2>
        <ul className="mt-4 space-y-2">
          {DEAL_STAGES.filter((s) => s !== 'lost').map((stage) => {
            const list = deals.filter((d) => field(d, 'stage', '') === stage)
            const sum = list.reduce((s, d) => s + field(d, 'amount', 0), 0)
            const width = Math.max(8, (list.length / Math.max(deals.length, 1)) * 100)
            return (
              <li key={stage} className="flex items-center gap-3 text-sm">
                <span className="w-28 text-muted">{stage}</span>
                <div className="h-8 flex-1 rounded-lg bg-bg-2">
                  <div
                    className="flex h-full items-center rounded-lg bg-accent/25 px-3 text-xs"
                    style={{ width: `${width}%` }}
                  >
                    {list.length}
                  </div>
                </div>
                <span className="w-24 text-right text-muted">{formatCurrency(sum, locale)}</span>
              </li>
            )
          })}
        </ul>
      </Surface>
    </div>
  )
}
