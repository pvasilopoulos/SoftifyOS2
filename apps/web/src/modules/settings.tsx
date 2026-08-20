import { useT } from '@/i18n'
import { useKernel } from '@/kernel/store'
import { Avatar, Kbd, Surface } from '@/ui/primitives'
import { cn } from '@/lib/format'

export function SettingsModule() {
  const t = useT()
  const ui = useKernel((s) => s.ui)
  const members = useKernel((s) => s.members)
  const org = useKernel((s) => s.org)
  const setTheme = useKernel((s) => s.setTheme)
  const setLocale = useKernel((s) => s.setLocale)
  const setDensity = useKernel((s) => s.setDensity)
  const setMultitabs = useKernel((s) => s.setMultitabs)
  const resetDemo = useKernel((s) => s.resetDemo)
  const logout = useKernel((s) => s.logout)

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <header>
        <h1 className="font-serif text-4xl">{org.name}</h1>
        <p className="mt-1 text-sm text-muted">{org.plan} plan</p>
      </header>

      <Surface className="p-5">
        <h2 className="text-sm font-semibold">{t.settings.appearance}</h2>
        <div className="mt-3 flex gap-2">
          {(['dark', 'light'] as const).map((theme) => (
            <button
              key={theme}
              type="button"
              onClick={() => setTheme(theme)}
              className={cn(
                'rounded-xl border px-3 py-2 text-sm',
                ui.theme === theme ? 'border-accent bg-accent/10' : 'border-line',
              )}
            >
              {t.settings[theme]}
            </button>
          ))}
        </div>
        <h2 className="mt-6 text-sm font-semibold">{t.settings.density}</h2>
        <div className="mt-3 flex gap-2">
          {(['comfortable', 'compact'] as const).map((density) => (
            <button
              key={density}
              type="button"
              onClick={() => setDensity(density)}
              className={cn(
                'rounded-xl border px-3 py-2 text-sm',
                ui.density === density ? 'border-accent bg-accent/10' : 'border-line',
              )}
            >
              {t.settings[density]}
            </button>
          ))}
        </div>
        <h2 className="mt-6 text-sm font-semibold">{t.settings.multitabs}</h2>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setMultitabs(false)}
            className={cn(
              'rounded-xl border px-3 py-2 text-sm',
              !ui.multitabs ? 'border-accent bg-accent/10' : 'border-line',
            )}
          >
            {t.settings.off}
          </button>
          <button
            type="button"
            onClick={() => setMultitabs(true)}
            className={cn(
              'rounded-xl border px-3 py-2 text-sm',
              ui.multitabs ? 'border-accent bg-accent/10' : 'border-line',
            )}
          >
            {t.settings.multitabs}
          </button>
        </div>
        <h2 className="mt-6 text-sm font-semibold">{t.settings.language}</h2>
        <div className="mt-3 flex gap-2">
          {(['el', 'en'] as const).map((locale) => (
            <button
              key={locale}
              type="button"
              onClick={() => setLocale(locale)}
              className={cn(
                'rounded-xl border px-3 py-2 text-sm',
                ui.locale === locale ? 'border-accent bg-accent/10' : 'border-line',
              )}
            >
              {locale === 'el' ? 'Ελληνικά' : 'English'}
            </button>
          ))}
        </div>
      </Surface>

      <Surface className="p-5">
        <h2 className="text-sm font-semibold">{t.settings.members}</h2>
        <ul className="mt-3 space-y-2">
          {members.map((member) => (
            <li key={member.id} className="flex items-center gap-3 rounded-xl px-1 py-1.5">
              <Avatar name={member.name} hue={member.hue} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{member.name}</div>
                <div className="text-xs text-faint">{member.email}</div>
              </div>
              <span className="text-xs text-muted">{member.role}</span>
            </li>
          ))}
        </ul>
      </Surface>

      <Surface className="p-5">
        <h2 className="text-sm font-semibold">{t.settings.shortcuts}</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex justify-between">
            Command palette <Kbd>⌘K</Kbd>
          </li>
          <li className="flex justify-between">
            Copilot <Kbd>⌘J</Kbd>
          </li>
          <li className="flex justify-between">
            {t.settings.newTab} <Kbd>⌘T</Kbd>
          </li>
          <li className="flex justify-between">
            Close <Kbd>Esc</Kbd>
          </li>
        </ul>
      </Surface>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={resetDemo}
          className="rounded-xl border border-line px-3 py-2 text-sm text-muted hover:border-danger hover:text-danger"
        >
          {t.settings.reset}
        </button>
        <button
          type="button"
          onClick={logout}
          className="rounded-xl border border-line px-3 py-2 text-sm text-muted hover:text-ink"
        >
          {t.logout}
        </button>
      </div>
    </div>
  )
}
