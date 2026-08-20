import { useEffect, useLayoutEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useKernel } from '@/kernel/store'
import { MOBILE_QUERY } from '@/lib/media'
import { CreateDialog } from '@/ui/create-dialog'
import { AiPanel } from './ai-panel'
import { BootScreen } from './boot'
import { CommandPalette } from './command-palette'
import { Dock } from './dock'
import { Inspector } from './inspector'
import { skipNextTabSync, TabBar } from './tab-bar'
import { Topbar } from './topbar'

export function OsShell() {
  const booted = useKernel((s) => s.ui.booted)
  const theme = useKernel((s) => s.ui.theme)
  const density = useKernel((s) => s.ui.density)
  const locale = useKernel((s) => s.ui.locale)
  const setCommandOpen = useKernel((s) => s.setCommandOpen)
  const toggleAi = useKernel((s) => s.toggleAi)
  const setAiOpen = useKernel((s) => s.setAiOpen)
  const openInspector = useKernel((s) => s.openInspector)
  const commandOpen = useKernel((s) => s.ui.commandOpen)
  const inspectorId = useKernel((s) => s.ui.inspectorId)
  const aiOpen = useKernel((s) => s.ui.aiOpen)
  const multitabs = useKernel((s) => s.ui.multitabs)
  const openTab = useKernel((s) => s.openTab)
  const closeTab = useKernel((s) => s.closeTab)
  const activeTabId = useKernel((s) => s.activeTabId)
  const navigate = useNavigate()

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.dataset.density = density
    document.documentElement.lang = locale
  }, [density, locale, theme])

  useLayoutEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY)
    const apply = () => {
      if (mq.matches) {
        const state = useKernel.getState()
        state.setAiOpen(false)
        state.openInspector(null)
      } else {
        useKernel.getState().setAiOpen(true)
      }
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const meta = event.metaKey || event.ctrlKey
      const key = event.key.toLowerCase()
      if (meta && key === 'k') {
        event.preventDefault()
        setCommandOpen(!commandOpen)
      }
      if (meta && key === 'j') {
        event.preventDefault()
        toggleAi()
      }
      if (meta && key === 't' && multitabs) {
        event.preventDefault()
        skipNextTabSync()
        openTab('/')
        navigate('/')
      }
      if (meta && key === 'w' && multitabs) {
        event.preventDefault()
        skipNextTabSync()
        closeTab(activeTabId)
        const next = useKernel.getState()
        const current = next.tabs.find((tab) => tab.id === next.activeTabId)
        if (current) navigate(current.path)
      }
      if (event.key === 'Escape') {
        setCommandOpen(false)
        openInspector(null)
        setAiOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    activeTabId,
    closeTab,
    commandOpen,
    multitabs,
    navigate,
    openInspector,
    openTab,
    setAiOpen,
    setCommandOpen,
    toggleAi,
  ])

  if (!booted) return <BootScreen />

  return (
    <div className="flex h-full min-h-0 overflow-hidden pt-[env(safe-area-inset-top)]">
      <Dock />
      <div className="flex min-w-0 flex-1 pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <div className="relative flex min-w-0 flex-1 flex-col">
          <Topbar />
          <TabBar />
          <main className="relative min-h-0 flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto scrollbar-thin">
              <Outlet />
            </div>
            {inspectorId ? (
              <>
                <button
                  type="button"
                  aria-label="Close"
                  className="fixed inset-x-0 top-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 bg-black/40 md:hidden"
                  onClick={() => openInspector(null)}
                />
                <Inspector />
              </>
            ) : null}
          </main>
        </div>
        {aiOpen ? (
          <>
            <button
              type="button"
              aria-label="Close"
              className="fixed inset-x-0 top-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 bg-black/40 md:hidden"
              onClick={() => setAiOpen(false)}
            />
            <AiPanel />
          </>
        ) : null}
      </div>
      <CommandPalette />
      <CreateDialog />
    </div>
  )
}
