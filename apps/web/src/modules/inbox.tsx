import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useT } from '@/i18n'
import { useKernel } from '@/kernel/store'
import { field, workspacePathForRelated } from '@/kernel/types'
import { cn, formatRelative } from '@/lib/format'
import { Badge } from '@/ui/primitives'

export function InboxModule() {
  const t = useT()
  const locale = useKernel((s) => s.ui.locale)
  const records = useKernel((s) => s.records)
  const patchFields = useKernel((s) => s.patchFields)
  const openInspector = useKernel((s) => s.openInspector)
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const items = records
    .filter((r) => r.type === 'inbox')
    .filter((r) => (filter === 'unread' ? r.fields.read === false : true))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  const unread = records.filter((r) => r.type === 'inbox' && r.fields.read === false)

  function openItem(id: string, relatedId?: string) {
    patchFields(id, { read: true })
    const related = relatedId ? records.find((r) => r.id === relatedId) : undefined
    navigate(workspacePathForRelated(related?.type))
    openInspector(related?.id ?? id)
  }

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-1">
        {(['all', 'unread'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm',
              filter === key ? 'bg-bg-2 font-medium' : 'text-muted',
            )}
          >
            {t.inbox[key]}
            {key === 'unread' && unread.length ? ` · ${unread.length}` : ''}
          </button>
        ))}
        {unread.length ? (
          <button
            type="button"
            onClick={() => unread.forEach((item) => patchFields(item.id, { read: true }))}
            className="ml-auto text-xs text-accent hover:underline"
          >
            {t.inbox.markAll}
          </button>
        ) : null}
      </div>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-line bg-bg-1 px-4 py-10 text-center text-sm text-muted">
          {t.inbox.empty}
        </p>
      ) : (
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-bg-1">
          {items.map((item) => {
            const related = records.find((r) => r.id === item.relations[0]?.id)
            const isUnread = item.fields.read === false
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => openItem(item.id, related?.id)}
                className="flex w-full gap-3 px-4 py-3 text-left hover:bg-bg-2/50"
              >
                <span
                  className={cn('mt-2 size-2 shrink-0 rounded-full', isUnread ? 'bg-accent' : 'bg-transparent')}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn('truncate text-sm', isUnread && 'font-semibold')}>{item.title}</span>
                    <Badge>{field(item, 'channel', 'os')}</Badge>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted">{field(item, 'preview', '')}</p>
                  <p className="mt-1 text-[11px] text-faint">
                    {field(item, 'from', '')} · {formatRelative(item.createdAt, locale)}
                    {related ? ` · ${related.title}` : ''}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
