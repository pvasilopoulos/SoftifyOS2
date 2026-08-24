import { format, subMonths } from 'date-fns'
import { el, enUS } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { useT } from '@/i18n'
import { useKernel, useRecords } from '@/kernel/store'
import { DEAL_STAGES, field, type SoftifyRecord } from '@/kernel/types'
import { formatCurrency } from '@/lib/format'
import { Avatar, Badge, Surface } from '@/ui/primitives'

function ymd(value: Date | string) {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function amountOf(deal: SoftifyRecord) {
  return field(deal, 'amount', 0)
}

export function InsightsModule() {
  const t = useT()
  const locale = useKernel((s) => s.ui.locale)
  const members = useKernel((s) => s.members)
  const openInspector = useKernel((s) => s.openInspector)
  const navigate = useNavigate()
  const deals = useRecords('deal')
  const tasks = useRecords('task')
  const dfLocale = locale === 'el' ? el : enUS
  const today = ymd(new Date())

  const openDeals = deals.filter((deal) => !['won', 'lost'].includes(field(deal, 'stage', '')))
  const won = deals.filter((deal) => field(deal, 'stage', '') === 'won')
  const lost = deals.filter((deal) => field(deal, 'stage', '') === 'lost')
  const closed = won.length + lost.length
  const wonSum = won.reduce((sum, deal) => sum + amountOf(deal), 0)
  const weighted = openDeals.reduce(
    (sum, deal) => sum + amountOf(deal) * (field(deal, 'probability', 0) / 100),
    0,
  )
  const winRate = closed ? Math.round((won.length / closed) * 100) : 0
  const done = tasks.filter((task) => field(task, 'status', '') === 'done').length
  const overdue = tasks.filter((task) => {
    if (field(task, 'status', '') === 'done') return false
    const due = field(task, 'due', '').slice(0, 10)
    return Boolean(due && due < today)
  })

  const months = Array.from({ length: 6 }, (_, index) => {
    const date = subMonths(new Date(), 5 - index)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    const value = won
      .filter((deal) => {
        const close = field(deal, 'closeDate', deal.updatedAt)
        const parsed = new Date(close)
        return !Number.isNaN(parsed.getTime()) && `${parsed.getFullYear()}-${parsed.getMonth()}` === key
      })
      .reduce((sum, deal) => sum + amountOf(deal), 0)
    return { key, label: format(date, 'MMM', { locale: dfLocale }), value }
  })
  const maxMonth = Math.max(1, ...months.map((month) => month.value))

  const owners = members
    .map((member) => {
      const owned = openDeals.filter((deal) => field(deal, 'ownerId', '') === member.id)
      const ownedTasks = tasks.filter(
        (task) => field(task, 'ownerId', '') === member.id && field(task, 'status', '') !== 'done',
      )
      const pipeline = owned.reduce(
        (sum, deal) => sum + amountOf(deal) * (field(deal, 'probability', 0) / 100),
        0,
      )
      return { member, owned, ownedTasks, pipeline }
    })
    .filter((row) => row.owned.length || row.ownedTasks.length)
    .sort((a, b) => b.pipeline - a.pipeline)

  const hot = [...openDeals].sort((a, b) => amountOf(b) - amountOf(a)).slice(0, 5)
  const funnelMax = Math.max(
    1,
    ...DEAL_STAGES.filter((stage) => stage !== 'lost').map((stage) =>
      deals.filter((deal) => field(deal, 'stage', '') === stage).reduce((sum, deal) => sum + amountOf(deal), 0),
    ),
  )

  function openDeal(id: string) {
    navigate('/crm')
    openInspector(id)
  }

  function openTask(id: string) {
    navigate('/work')
    openInspector(id)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 md:p-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t.insights.won} value={formatCurrency(wonSum, locale)} />
        <Stat label={t.home.weighted} value={formatCurrency(weighted, locale)} />
        <Stat label={t.home.winRate} value={`${winRate}%`} />
        <Stat
          label={t.insights.pace}
          value={`${done}/${tasks.length}`}
          hint={overdue.length ? `${overdue.length} ${t.insights.overdue}` : undefined}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Surface className="p-5 lg:col-span-3">
          <h2 className="text-sm font-semibold">{t.insights.funnel}</h2>
          <ul className="mt-4 space-y-2">
            {DEAL_STAGES.filter((stage) => stage !== 'lost').map((stage) => {
              const list = deals.filter((deal) => field(deal, 'stage', '') === stage)
              const sum = list.reduce((total, deal) => total + amountOf(deal), 0)
              const width = Math.max(8, (sum / funnelMax) * 100)
              const top = [...list].sort((a, b) => amountOf(b) - amountOf(a))[0]
              return (
                <li key={stage}>
                  <button
                    type="button"
                    onClick={() => (top ? openDeal(top.id) : navigate('/crm'))}
                    className="flex w-full items-center gap-3 text-left text-sm"
                  >
                    <span className="w-28 shrink-0 text-muted">{t.stages[stage]}</span>
                    <div className="h-8 flex-1 rounded-lg bg-bg-2">
                      <div
                        className="flex h-full items-center rounded-lg bg-accent/25 px-3 text-xs"
                        style={{ width: `${width}%` }}
                      >
                        {list.length}
                      </div>
                    </div>
                    <span className="w-24 shrink-0 text-right text-muted">{formatCurrency(sum, locale)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Surface>

        <Surface className="p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold">{t.insights.won}</h2>
          <div className="mt-6 flex h-40 items-end gap-2">
            {months.map((month) => (
              <div key={month.key} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-accent/80"
                  style={{ height: `${(month.value / maxMonth) * 100}%`, minHeight: month.value ? 6 : 2 }}
                />
                <span className="text-[10px] text-faint">{month.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">{formatCurrency(wonSum, locale)}</p>
        </Surface>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Surface className="p-5">
          <h2 className="text-sm font-semibold">{t.insights.owners}</h2>
          <ul className="mt-3 divide-y divide-line">
            {owners.map((row) => (
              <li key={row.member.id} className="flex items-center gap-3 py-2.5">
                <Avatar name={row.member.name} hue={row.member.hue} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{row.member.name}</div>
                  <div className="text-[11px] text-faint">
                    {row.owned.length} {t.home.openDeals.toLowerCase()} · {row.ownedTasks.length} {t.work.all.toLowerCase()}
                  </div>
                </div>
                <span className="text-sm text-muted">{formatCurrency(row.pipeline, locale)}</span>
              </li>
            ))}
          </ul>
        </Surface>

        <Surface className="p-5">
          <h2 className="text-sm font-semibold">{t.insights.attention}</h2>
          <ul className="mt-3 divide-y divide-line">
            {overdue.slice(0, 4).map((task) => (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => openTask(task.id)}
                  className="flex w-full items-center justify-between gap-3 py-2.5 text-left text-sm hover:text-accent"
                >
                  <span className="truncate">{task.title}</span>
                  <Badge tone="danger">{t.insights.overdue}</Badge>
                </button>
              </li>
            ))}
            {hot.map((deal) => (
              <li key={deal.id}>
                <button
                  type="button"
                  onClick={() => openDeal(deal.id)}
                  className="flex w-full items-center justify-between gap-3 py-2.5 text-left text-sm hover:text-accent"
                >
                  <span className="truncate">{deal.title}</span>
                  <span className="shrink-0 text-muted">{formatCurrency(amountOf(deal), locale)}</span>
                </button>
              </li>
            ))}
          </ul>
        </Surface>
      </div>
    </div>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Surface className="p-4">
      <div className="text-[11px] font-medium uppercase tracking-wider text-faint">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">{value}</div>
      {hint ? <div className="mt-1 text-[11px] text-danger">{hint}</div> : null}
    </Surface>
  )
}
