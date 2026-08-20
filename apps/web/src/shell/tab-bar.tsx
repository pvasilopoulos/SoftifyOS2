import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Plus, X } from 'lucide-react'
import { useT } from '@/i18n'
import { useKernel } from '@/kernel/store'
import { cn } from '@/lib/format'

const titles: Record<string, keyof ReturnType<typeof useT>['nav']> = {
  '/': 'home',
  '/inbox': 'inbox',
  '/crm': 'crm',
  '/work': 'work',
  '/docs': 'docs',
  '/calendar': 'calendar',
  '/insights': 'insights',
  '/settings': 'settings',
}

function tabTitle(path: string, t: ReturnType<typeof useT>) {
  const root = path === '/' ? '/' : `/${path.split('/').filter(Boolean)[0]}`
  const key = titles[root]
  return key ? t.nav[key] : t.brand
}

let skipSync = false

export function skipNextTabSync() {
  skipSync = true
}

export function TabBar() {
  const t = useT()
  const location = useLocation()
  const navigate = useNavigate()
  const enabled = useKernel((s) => s.ui.multitabs)
  const tabs = useKernel((s) => s.tabs)
  const activeTabId = useKernel((s) => s.activeTabId)
  const openTab = useKernel((s) => s.openTab)
  const closeTab = useKernel((s) => s.closeTab)
  const setActiveTab = useKernel((s) => s.setActiveTab)
  const syncTabPath = useKernel((s) => s.syncTabPath)
  const switching = useRef(false)

  useEffect(() => {
    if (switching.current || skipSync) {
      switching.current = false
      skipSync = false
      return
    }
    if (enabled) syncTabPath(location.pathname)
  }, [enabled, location.pathname, syncTabPath])

  if (!enabled) return null

  function activate(id: string, path: string) {
    switching.current = true
    setActiveTab(id)
    navigate(path)
  }

  return (
    <div className="flex h-10 shrink-0 items-center gap-1 border-b border-line px-2">
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto scrollbar-thin">
        {tabs.map((tab) => {
          const active = tab.id === activeTabId
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => activate(tab.id, tab.path)}
              className={cn(
                'group flex h-7 max-w-[180px] items-center gap-1 rounded-lg px-2 text-xs',
                active ? 'bg-bg-2 text-ink' : 'text-muted hover:bg-bg-2/70',
              )}
            >
              <span className="truncate">{tabTitle(tab.path, t)}</span>
              <span
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation()
                  const wasActive = tab.id === activeTabId
                  closeTab(tab.id)
                  if (wasActive) {
                    const next = useKernel.getState()
                    switching.current = true
                    const current = next.tabs.find((item) => item.id === next.activeTabId)
                    if (current) navigate(current.path)
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') (event.currentTarget as HTMLSpanElement).click()
                }}
                className="grid size-4 place-items-center rounded text-faint hover:text-ink"
              >
                <X className="size-3" />
              </span>
            </button>
          )
        })}
      </div>
      <button
        type="button"
        title={t.settings.newTab}
        onClick={() => {
          switching.current = true
          openTab('/')
          navigate('/')
        }}
        className="grid size-7 place-items-center rounded-lg text-muted hover:bg-bg-2 hover:text-ink"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  )
}
