import { Sparkles } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useT } from '@/i18n'
import { useCurrentUser, useKernel } from '@/kernel/store'
import { Avatar, IconButton, Kbd } from '@/ui/primitives'

const titles: Record<string, string> = {
  '/': 'home',
  '/inbox': 'inbox',
  '/crm': 'crm',
  '/work': 'work',
  '/docs': 'docs',
  '/calendar': 'calendar',
  '/insights': 'insights',
  '/settings': 'settings',
}

export function Topbar() {
  const t = useT()
  const location = useLocation()
  const org = useKernel((s) => s.org)
  const user = useCurrentUser()
  const aiOpen = useKernel((s) => s.ui.aiOpen)
  const toggleAi = useKernel((s) => s.toggleAi)
  const setCommandOpen = useKernel((s) => s.setCommandOpen)
  const path = '/' + location.pathname.split('/').filter(Boolean)[0]
  const key = titles[path === '/' ? '/' : path] as keyof typeof t.nav | undefined

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-4">
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-faint">
          {org.name}
        </div>
        <div className="truncate text-sm font-semibold">{key ? t.nav[key] : t.brand}</div>
      </div>
      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="mx-auto flex h-9 w-full max-w-md items-center gap-2 rounded-xl border border-line bg-bg-1 px-3 text-left text-sm text-faint transition hover:border-line-strong"
      >
        <span className="flex-1">{t.search}</span>
        <Kbd>⌘K</Kbd>
      </button>
      <IconButton label={t.ai.title} active={aiOpen} onClick={toggleAi}>
        <Sparkles className="size-4 text-ai" />
      </IconButton>
      <Avatar name={user.name} hue={user.hue} />
    </header>
  )
}
