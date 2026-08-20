import { X } from 'lucide-react'
import { useT } from '@/i18n'
import { useKernel, useMember, useRecord } from '@/kernel/store'
import { field, type DealStage, type TaskPriority, type TaskStatus } from '@/kernel/types'
import { formatCurrency, formatDate, formatRelative } from '@/lib/format'
import { Avatar, Badge } from '@/ui/primitives'

export function Inspector() {
  const t = useT()
  const locale = useKernel((s) => s.ui.locale)
  const id = useKernel((s) => s.ui.inspectorId)
  const record = useRecord(id)
  const records = useKernel((s) => s.records)
  const members = useKernel((s) => s.members)
  const close = useKernel((s) => s.openInspector)
  const updateRecord = useKernel((s) => s.updateRecord)
  const owner = useMember(record ? field(record, 'ownerId', '') : '')

  if (!record) return null

  const related = record.relations
    .map((rel) => records.find((item) => item.id === rel.id))
    .filter(Boolean)
  const activity = records
    .filter((item) => item.type === 'activity' && item.relations.some((rel) => rel.id === record.id))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))

  const stage = field<DealStage | ''>(record, 'stage', '')
  const status = field<TaskStatus | ''>(record, 'status', '')
  const priority = field<TaskPriority | ''>(record, 'priority', '')
  const amount = field<number>(record, 'amount', NaN)
  const health = field<string>(record, 'health', '')

  return (
    <div className="fixed inset-x-0 top-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 flex w-full flex-col border-line bg-bg-1 shadow-[var(--shadow)] md:absolute md:inset-y-0 md:right-0 md:bottom-auto md:top-auto md:z-20 md:w-[420px] md:max-w-full md:border-l">
      <header className="flex items-start gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0 flex-1">
          <Badge tone="accent">{t.types[record.type]}</Badge>
          <input
            value={record.title}
            onChange={(e) => updateRecord(record.id, { title: e.target.value })}
            className="mt-2 w-full bg-transparent text-lg font-semibold outline-none"
          />
        </div>
        <button type="button" onClick={() => close(null)} className="mt-1 text-muted hover:text-ink">
          <X className="size-4" />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          {owner ? (
            <Meta label={t.crm.owner}>
              <span className="inline-flex items-center gap-2">
                <Avatar name={owner.name} hue={owner.hue} size="sm" />
                {owner.name.split(' ')[0]}
              </span>
            </Meta>
          ) : null}
          {stage ? (
            <Meta label="Stage">
              <Badge tone={stage === 'won' ? 'ok' : stage === 'lost' ? 'danger' : 'muted'}>
                {t.stages[stage]}
              </Badge>
            </Meta>
          ) : null}
          {status ? (
            <Meta label="Status">
              <Badge>{t.taskStatus[status]}</Badge>
            </Meta>
          ) : null}
          {priority ? (
            <Meta label="Priority">
              <Badge tone={priority === 'urgent' || priority === 'high' ? 'warn' : 'muted'}>
                {t.priority[priority]}
              </Badge>
            </Meta>
          ) : null}
          {Number.isFinite(amount) ? (
            <Meta label={t.crm.amount}>{formatCurrency(amount, locale)}</Meta>
          ) : null}
          {health ? (
            <Meta label={t.crm.health}>
              <Badge tone={health === 'strong' ? 'ok' : health === 'risk' ? 'danger' : 'muted'}>
                {health}
              </Badge>
            </Meta>
          ) : null}
          {field(record, 'industry', '') ? (
            <Meta label={t.crm.industry}>{field(record, 'industry', '')}</Meta>
          ) : null}
          {field(record, 'email', '') ? <Meta label="Email">{field(record, 'email', '')}</Meta> : null}
          {field(record, 'domain', '') ? <Meta label="Domain">{field(record, 'domain', '')}</Meta> : null}
        </dl>

        {related.length ? (
          <section className="mt-6">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-faint">
              {t.inspector.related}
            </h3>
            <ul className="mt-2 space-y-1">
              {related.map((item) =>
                item ? (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => close(item.id)}
                      className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-sm hover:bg-bg-2"
                    >
                      <span>{item.title}</span>
                      <span className="text-xs text-faint">{t.types[item.type]}</span>
                    </button>
                  </li>
                ) : null,
              )}
            </ul>
          </section>
        ) : null}

        <section className="mt-6">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-faint">
            {t.inspector.activity}
          </h3>
          {activity.length === 0 ? (
            <p className="mt-2 text-sm text-muted">{t.inspector.empty}</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {activity.map((item) => {
                const actor = members.find((m) => m.id === field(item, 'actorId', ''))
                return (
                  <li key={item.id} className="rounded-xl border border-line px-3 py-2 text-sm">
                    <div className="text-ink">
                      {actor?.name.split(' ')[0]} {item.title}
                    </div>
                    <div className="text-[11px] text-faint">{formatRelative(item.createdAt, locale)}</div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
        <p className="mt-6 text-[11px] text-faint">
          {formatDate(record.updatedAt, locale, true)}
        </p>
      </div>
    </div>
  )
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-bg px-3 py-2">
      <dt className="text-[10px] font-medium uppercase tracking-wider text-faint">{label}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  )
}
