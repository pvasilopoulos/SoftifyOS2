import { useT } from '@/i18n'
import { useCurrentUser, useKernel } from '@/kernel/store'
import { field } from '@/kernel/types'
import { formatCurrency, formatRelative } from '@/lib/format'
import { Avatar, Badge, Surface } from '@/ui/primitives'

function greetingKey(hour: number) {
  if (hour < 5) return 'night' as const
  if (hour < 12) return 'morning' as const
  if (hour < 17) return 'afternoon' as const
  if (hour < 22) return 'evening' as const
  return 'night' as const
}

export function HomeModule() {
  const t = useT()
  const locale = useKernel((s) => s.ui.locale)
  const user = useCurrentUser()
  const members = useKernel((s) => s.members)
  const records = useKernel((s) => s.records)
  const openInspector = useKernel((s) => s.openInspector)
  const first = user.name.split(' ')[0]
  const deals = records.filter((r) => r.type === 'deal')
  const openDeals = deals.filter((d) => !['won', 'lost'].includes(field(d, 'stage', '')))
  const won = deals.filter((d) => field(d, 'stage', '') === 'won')
  const closed = deals.filter((d) => ['won', 'lost'].includes(field(d, 'stage', '')))
  const weighted = openDeals.reduce(
    (sum, d) => sum + field(d, 'amount', 0) * (field(d, 'probability', 0) / 100),
    0,
  )
  const tasks = records.filter((r) => r.type === 'task' && field(r, 'ownerId', '') === user.id)
  const due = tasks.filter((r) => field(r, 'status', '') !== 'done')
  const activity = records
    .filter((r) => r.type === 'activity')
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 6)
  const winRate = closed.length ? Math.round((won.length / closed.length) * 100) : 0

  return (
    <div className="rise mx-auto max-w-6xl space-y-6 p-6">
      <header>
        <p className="font-serif text-4xl tracking-tight">
          {t.greeting[greetingKey(new Date().getHours())]}, {first}
        </p>
        <p className="mt-2 text-sm text-muted">{t.home.briefing}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t.home.openDeals} value={String(openDeals.length)} />
        <Stat label={t.home.weighted} value={formatCurrency(weighted, locale)} />
        <Stat label={t.home.due} value={String(due.length)} />
        <Stat label={t.home.winRate} value={`${winRate}%`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Surface className="lg:col-span-3 p-4">
          <h2 className="text-sm font-semibold">{t.home.mine}</h2>
          <ul className="mt-3 divide-y divide-line">
            {due.slice(0, 6).map((task) => (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => openInspector(task.id)}
                  className="flex w-full items-center justify-between gap-3 py-2.5 text-left text-sm hover:text-accent"
                >
                  <span className="truncate">{task.title}</span>
                  <Badge tone={field(task, 'priority', '') === 'urgent' ? 'warn' : 'muted'}>
                    {formatRelative(field(task, 'due', task.updatedAt), locale)}
                  </Badge>
                </button>
              </li>
            ))}
          </ul>
        </Surface>
        <Surface className="lg:col-span-2 p-4">
          <h2 className="text-sm font-semibold">{t.home.pipeline}</h2>
          <ul className="mt-3 space-y-2">
            {openDeals
              .sort((a, b) => field(b, 'amount', 0) - field(a, 'amount', 0))
              .slice(0, 5)
              .map((deal) => (
                <li key={deal.id}>
                  <button
                    type="button"
                    onClick={() => openInspector(deal.id)}
                    className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-sm hover:bg-bg-2"
                  >
                    <span className="truncate">{deal.title}</span>
                    <span className="text-muted">{formatCurrency(field(deal, 'amount', 0), locale)}</span>
                  </button>
                </li>
              ))}
          </ul>
        </Surface>
      </div>

      <Surface className="p-4">
        <h2 className="text-sm font-semibold">{t.home.activity}</h2>
        <ul className="mt-3 space-y-2">
          {activity.map((item) => {
            const actor = members.find((m) => m.id === field(item, 'actorId', ''))
            return (
              <li key={item.id} className="flex items-center gap-3 text-sm">
                {actor ? <Avatar name={actor.name} hue={actor.hue} size="sm" /> : null}
                <span className="flex-1">
                  <span className="font-medium">{actor?.name.split(' ')[0]}</span>{' '}
                  <span className="text-muted">{item.title}</span>
                </span>
                <span className="text-xs text-faint">{formatRelative(item.createdAt, locale)}</span>
              </li>
            )
          })}
        </ul>
      </Surface>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Surface className="p-4">
      <div className="text-[11px] font-medium uppercase tracking-wider text-faint">{label}</div>
      <div className="mt-2 font-serif text-3xl tracking-tight">{value}</div>
    </Surface>
  )
}
