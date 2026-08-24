import { useState } from 'react'
import {
  Building2,
  CalendarDays,
  FileText,
  Home,
  Inbox,
  LayoutDashboard,
  MoreHorizontal,
  PenTool,
  Settings,
  SquareKanban,
} from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import type { MouseEvent } from 'react'
import { useT } from '@/i18n'
import { useKernel } from '@/kernel/store'
import { cn } from '@/lib/format'
import { Logo } from '@/ui/primitives'
import { skipNextTabSync } from './tab-bar'

const items = [
  { to: '/', icon: Home, key: 'home' as const, end: true },
  { to: '/inbox', icon: Inbox, key: 'inbox' as const },
  { to: '/crm', icon: Building2, key: 'crm' as const },
  { to: '/work', icon: SquareKanban, key: 'work' as const },
  { to: '/docs', icon: FileText, key: 'docs' as const },
  { to: '/calendar', icon: CalendarDays, key: 'calendar' as const },
  { to: '/insights', icon: LayoutDashboard, key: 'insights' as const },
  { to: '/studio', icon: PenTool, key: 'studio' as const },
]

const primary = items.slice(0, 4)
const moreItems = [
  ...items.slice(4),
  { to: '/settings', icon: Settings, key: 'settings' as const },
]
const morePrefixes = moreItems.map((item) => item.to)

export function Dock() {
  const t = useT()
  const location = useLocation()
  const navigate = useNavigate()
  const openTab = useKernel((s) => s.openTab)
  const multitabs = useKernel((s) => s.ui.multitabs)
  const unread = useKernel(
    (s) => s.records.filter((r) => r.type === 'inbox' && r.fields.read === false).length,
  )
  const [moreOpen, setMoreOpen] = useState(false)
  const moreActive = morePrefixes.some((to) =>
    to === '/' ? location.pathname === '/' : location.pathname === to || location.pathname.startsWith(`${to}/`),
  )

  function onModuleClick(event: MouseEvent, to: string) {
    setMoreOpen(false)
    if (multitabs && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      skipNextTabSync()
      openTab(to)
      navigate(to)
    }
  }

  return (
    <>
      <aside className="hidden w-[72px] shrink-0 flex-col items-center border-r border-line bg-bg/80 py-3 md:flex">
        <Logo mark className="mb-4" />
        <nav className="flex flex-1 flex-col items-center gap-1">
          {items.map((item) => (
            <DockLink
              key={item.to}
              item={item}
              label={t.nav[item.key]}
              unread={item.key === 'inbox' ? unread : 0}
              onClick={(event) => onModuleClick(event, item.to)}
            />
          ))}
        </nav>
        <DockLink
          item={{ to: '/settings', icon: Settings, key: 'settings', end: false }}
          label={t.nav.settings}
          unread={0}
          onClick={(event) => onModuleClick(event, '/settings')}
        />
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        {primary.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={(event) => onModuleClick(event, item.to)}
            className={({ isActive }) =>
              cn(
                'relative flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium text-muted',
                isActive && 'text-ink',
              )
            }
          >
            <item.icon className="size-[18px]" strokeWidth={1.75} />
            <span className="truncate">{t.nav[item.key]}</span>
            {item.key === 'inbox' && unread > 0 ? (
              <span className="absolute top-1.5 right-1/2 size-1.5 translate-x-3 rounded-full bg-accent" />
            ) : null}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen((open) => !open)}
          className={cn(
            'relative flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium text-muted',
            (moreOpen || moreActive) && 'text-ink',
          )}
        >
          <MoreHorizontal className="size-[18px]" strokeWidth={1.75} />
          <span className="truncate">{t.nav.more}</span>
        </button>
      </nav>

      {moreOpen ? (
        <div className="fixed inset-0 z-20 md:hidden" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] rounded-t-2xl border border-line bg-bg-1 p-3 shadow-[var(--shadow)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-strong" />
            <div className="grid grid-cols-3 gap-1">
              {moreItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={(event) => onModuleClick(event, item.to)}
                  className={({ isActive }) =>
                    cn(
                      'flex flex-col items-center gap-2 rounded-2xl px-2 py-3 text-[11px] font-medium text-muted',
                      isActive && 'bg-bg-2 text-ink',
                    )
                  }
                >
                  <item.icon className="size-5" strokeWidth={1.75} />
                  {t.nav[item.key]}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

function DockLink({
  item,
  label,
  unread,
  onClick,
}: {
  item: { to: string; icon: typeof Home; key: string; end?: boolean }
  label: string
  unread: number
  onClick: (event: MouseEvent) => void
}) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      title={label}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'relative grid size-10 place-items-center rounded-xl text-muted transition hover:bg-bg-2 hover:text-ink',
          isActive && 'bg-bg-2 text-ink shadow-[inset_0_0_0_1px_var(--line-strong)]',
        )
      }
    >
      <item.icon className="size-[18px]" strokeWidth={1.75} />
      {unread > 0 ? <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-accent" /> : null}
    </NavLink>
  )
}
