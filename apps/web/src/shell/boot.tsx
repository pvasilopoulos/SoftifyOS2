import { useEffect } from 'react'
import { useT } from '@/i18n'
import { useKernel } from '@/kernel/store'
import { Logo } from '@/ui/primitives'

export function BootScreen() {
  const t = useT()
  const boot = useKernel((s) => s.boot)
  const org = useKernel((s) => s.org)

  useEffect(() => {
    const timer = window.setTimeout(boot, 1600)
    return () => window.clearTimeout(timer)
  }, [boot])

  return (
    <div className="grid h-full place-items-center px-6">
      <div className="rise flex w-full max-w-md flex-col items-center text-center">
        <Logo className="mb-8 scale-125" />
        <p className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">{t.brand}</p>
        <p className="mt-3 text-sm text-muted">{t.tagline}</p>
        <div className="mt-10 w-full rounded-2xl border border-line bg-bg-1 p-4 text-left">
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-faint">
            Workspace
          </div>
          <div className="mt-1 text-sm font-semibold">{org.name}</div>
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-bg-2">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-accent" />
          </div>
          <div className="mt-2 text-xs text-muted">{t.entering}</div>
        </div>
        <button
          type="button"
          onClick={boot}
          className="mt-6 text-sm text-accent hover:underline"
        >
          {t.enter}
        </button>
      </div>
    </div>
  )
}
