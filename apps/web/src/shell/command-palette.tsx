import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useT } from '@/i18n'
import { useKernel } from '@/kernel/store'
import type { RecordType } from '@/kernel/types'
import { cn } from '@/lib/format'
import { skipNextTabSync } from './tab-bar'

const nav = [
  { to: '/', key: 'home' as const },
  { to: '/inbox', key: 'inbox' as const },
  { to: '/crm', key: 'crm' as const },
  { to: '/work', key: 'work' as const },
  { to: '/docs', key: 'docs' as const },
  { to: '/calendar', key: 'calendar' as const },
  { to: '/insights', key: 'insights' as const },
  { to: '/studio', key: 'studio' as const },
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

interface PaletteItem {
  id: string
  group: string
  label: string
  hint?: string
  run: () => void
}

export function CommandPalette() {
  const t = useT()
  const open = useKernel((s) => s.ui.commandOpen)
  const setOpen = useKernel((s) => s.setCommandOpen)
  const records = useKernel((s) => s.records)
  const setCreateType = useKernel((s) => s.setCreateType)
  const openInspector = useKernel((s) => s.openInspector)
  const openTab = useKernel((s) => s.openTab)
  const navigate = useNavigate()
  const location = useLocation()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)

  const items = useMemo(() => {
    const query = q.trim().toLowerCase()
    const tabItems: PaletteItem[] = !query || t.settings.newTab.toLowerCase().includes(query)
      ? [
          {
            id: 'tab:new',
            group: t.command.nav,
            label: t.settings.newTab,
            run: () => {
              skipNextTabSync()
              openTab('/', location.pathname)
              navigate('/')
            },
          },
        ]
      : []
    const navItems: PaletteItem[] = nav
      .filter((item) => t.nav[item.key].toLowerCase().includes(query) || !query)
      .map((item) => ({
        id: `nav:${item.to}`,
        group: t.command.nav,
        label: t.nav[item.key],
        run: () => navigate(item.to),
      }))
    const createItems: PaletteItem[] = creates
      .filter((item) => String(t.create[item.key]).toLowerCase().includes(query) || !query)
      .map((item) => ({
        id: `create:${item.type}`,
        group: t.command.create,
        label: String(t.create[item.key]),
        run: () => setCreateType(item.type),
      }))
    const recordItems: PaletteItem[] = records
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
    return [...tabItems, ...navItems, ...createItems, ...recordItems]
  }, [location.pathname, navigate, openInspector, openTab, q, records, setCreateType, t])

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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] md:p-0" onClick={close}>
      <div
        className="rise flex h-full w-full flex-col overflow-hidden border-line-strong bg-bg-1 pb-[env(safe-area-inset-bottom)] shadow-[var(--shadow)] md:mx-auto md:mt-[12vh] md:h-auto md:max-w-xl md:rounded-2xl md:border md:pb-0"
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
          className="h-14 w-full border-b border-line bg-transparent px-4 text-base outline-none placeholder:text-faint md:h-12 md:text-sm"
        />
        <div className="min-h-0 flex-1 overflow-y-auto p-2 scrollbar-thin md:max-h-[420px] md:flex-none">
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
                  'flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm md:py-2',
                  index === active && 'bg-bg-2',
                )}
              >
                <span>
                  <span className="mr-2 text-[10px] font-medium uppercase tracking-wider text-faint">
                    {item.group}
                  </span>
                  {item.label}
                </span>
                {item.hint ? (
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
