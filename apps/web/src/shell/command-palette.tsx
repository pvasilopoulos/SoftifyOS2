import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useT } from '@/i18n'
import { useKernel } from '@/kernel/store'
import type { RecordType } from '@/kernel/types'
import { cn } from '@/lib/format'

const nav = [
  { to: '/', key: 'home' as const },
  { to: '/inbox', key: 'inbox' as const },
  { to: '/crm', key: 'crm' as const },
  { to: '/work', key: 'work' as const },
  { to: '/docs', key: 'docs' as const },
  { to: '/calendar', key: 'calendar' as const },
  { to: '/insights', key: 'insights' as const },
  { to: '/settings', key: 'settings' as const },
]

const creates: { type: RecordType; key: keyof ReturnType<typeof useT>['create'] }[] = [
  { type: 'deal', key: 'deal' },
  { type: 'task', key: 'task' },
  { type: 'contact', key: 'contact' },
  { type: 'company', key: 'company' },
  { type: 'project', key: 'project' },
  { type: 'doc', key: 'doc' },
]

export function CommandPalette() {
  const t = useT()
  const open = useKernel((s) => s.ui.commandOpen)
  const setOpen = useKernel((s) => s.setCommandOpen)
  const records = useKernel((s) => s.records)
  const setCreateType = useKernel((s) => s.setCreateType)
  const openInspector = useKernel((s) => s.openInspector)
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)

  const items = useMemo(() => {
    const query = q.trim().toLowerCase()
    const navItems = nav
      .filter((item) => t.nav[item.key].toLowerCase().includes(query) || !query)
      .map((item) => ({
        id: `nav:${item.to}`,
        group: t.command.nav,
        label: t.nav[item.key],
        run: () => navigate(item.to),
      }))
    const createItems = creates
      .filter((item) => String(t.create[item.key]).toLowerCase().includes(query) || !query)
      .map((item) => ({
        id: `create:${item.type}`,
        group: t.command.create,
        label: String(t.create[item.key]),
        run: () => setCreateType(item.type),
      }))
    const recordItems = records
      .filter((record) => ['deal', 'company', 'contact', 'project', 'task', 'doc'].includes(record.type))
      .filter((record) => !query || record.title.toLowerCase().includes(query))
      .slice(0, 8)
      .map((record) => ({
        id: `rec:${record.id}`,
        group: t.command.records,
        label: record.title,
        hint: t.types[record.type],
        run: () => {
          openInspector(record.id)
          const routes: Partial<Record<string, string>> = {
            deal: '/crm',
            company: '/crm/companies',
            contact: '/crm/contacts',
            project: '/work',
            task: '/work',
            doc: `/docs/${record.id}`,
          }
          navigate(routes[record.type] ?? '/')
        },
      }))
    return [...navItems, ...createItems, ...recordItems]
  }, [navigate, openInspector, q, records, setCreateType, t])

  useEffect(() => {
    setActive(0)
  }, [q, open])

  useEffect(() => {
    if (!open) setQ('')
  }, [open])

  if (!open) return null

  function close() {
    setOpen(false)
  }

  function run(index: number) {
    items[index]?.run()
    close()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" onClick={close}>
      <div
        className="rise mx-auto mt-[12vh] w-full max-w-xl overflow-hidden rounded-2xl border border-line-strong bg-bg-1 shadow-[var(--shadow)]"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.command.placeholder}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActive((i) => Math.min(i + 1, items.length - 1))
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((i) => Math.max(i - 1, 0))
            }
            if (e.key === 'Enter') {
              e.preventDefault()
              run(active)
            }
            if (e.key === 'Escape') close()
          }}
          className="h-12 w-full border-b border-line bg-transparent px-4 text-sm outline-none placeholder:text-faint"
        />
        <div className="max-h-[420px] overflow-y-auto p-2 scrollbar-thin">
          {items.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted">{t.command.empty}</div>
          ) : (
            items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => setActive(index)}
                onClick={() => run(index)}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm',
                  index === active && 'bg-bg-2',
                )}
              >
                <span>
                  <span className="mr-2 text-[10px] font-medium uppercase tracking-wider text-faint">
                    {item.group}
                  </span>
                  {item.label}
                </span>
                {'hint' in item && item.hint ? (
                  <span className="text-xs text-faint">{item.hint}</span>
                ) : null}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
