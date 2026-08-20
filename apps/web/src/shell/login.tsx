import { useState } from 'react'
import { useT } from '@/i18n'
import { useKernel } from '@/kernel/store'
import { Logo } from '@/ui/primitives'

export function LoginScreen() {
  const t = useT()
  const login = useKernel((s) => s.login)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  return (
    <div className="grid h-full place-items-center px-6">
      <form
        className="rise w-full max-w-[400px]"
        onSubmit={(event) => {
          event.preventDefault()
          const ok = login(username, password)
          setError(!ok)
          if (!ok) setPassword('')
        }}
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo className="mb-6 scale-110" />
          <h1 className="font-serif text-4xl tracking-tight">{t.login.title}</h1>
          <p className="mt-2 text-sm text-muted">{t.login.subtitle}</p>
        </div>
        <div className="rounded-2xl border border-line bg-bg-1 p-5 shadow-[var(--shadow)]">
          <label className="block text-xs font-medium text-muted">
            {t.login.username}
            <input
              autoFocus
              autoComplete="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setError(false)
              }}
              className="mt-1.5 h-11 w-full rounded-xl border border-line bg-bg px-3 text-sm text-ink outline-none focus:border-accent"
            />
          </label>
          <label className="mt-3 block text-xs font-medium text-muted">
            {t.login.password}
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError(false)
              }}
              className="mt-1.5 h-11 w-full rounded-xl border border-line bg-bg px-3 text-sm text-ink outline-none focus:border-accent"
            />
          </label>
          {error ? <p className="mt-3 text-sm text-danger">{t.login.error}</p> : null}
          <button
            type="submit"
            className="mt-5 h-11 w-full rounded-xl bg-accent text-sm font-semibold text-bg"
          >
            {t.login.submit}
          </button>
        </div>
      </form>
    </div>
  )
}
