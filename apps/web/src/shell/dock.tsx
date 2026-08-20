import {
  Building2,
  CalendarDays,
  FileText,
  Home,
  Inbox,
  LayoutDashboard,
  PenTool,
  Settings,
  SquareKanban,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
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

export function Dock() {
  const t = useT()
  const navigate = useNavigate()
  const openTab = useKernel((s) => s.openTab)
  const multitabs = useKernel((s) => s.ui.multitabs)
  const unread = useKernel(
    (s) => s.records.filter((r) => r.type === 'inbox' && r.fields.read === false).length,
  )

  function onModuleClick(event: MouseEvent, to: string) {
    if (multitabs && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      skipNextTabSync()
      openTab(to)
      navigate(to)
    }
  }

  return (
    <aside className="flex w-[72px] shrink-0 flex-col items-center border-r border-line bg-bg/80 py-3">
      <Logo mark className="mb-4" />
      <nav className="flex flex-1 flex-col items-center gap-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={t.nav[item.key]}
            onClick={(event) => onModuleClick(event, item.to)}
            className={({ isActive }) =>
              cn(
                'relative grid size-10 place-items-center rounded-xl text-muted transition hover:bg-bg-2 hover:text-ink',
                isActive && 'bg-bg-2 text-ink shadow-[inset_0_0_0_1px_var(--line-strong)]',
              )
            }
          >
            <item.icon className="size-[18px]" strokeWidth={1.75} />
            {item.key === 'inbox' && unread > 0 ? (
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-accent" />
            ) : null}
          </NavLink>
        ))}
      </nav>
      <NavLink
        to="/settings"
        title={t.nav.settings}
        onClick={(event) => onModuleClick(event, '/settings')}
        className={({ isActive }) =>
          cn(
            'grid size-10 place-items-center rounded-xl text-muted hover:bg-bg-2 hover:text-ink',
            isActive && 'bg-bg-2 text-ink',
          )
        }
      >
        <Settings className="size-[18px]" strokeWidth={1.75} />
      </NavLink>
    </aside>
  )
}
