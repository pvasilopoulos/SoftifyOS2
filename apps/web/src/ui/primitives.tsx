import { cn } from '@/lib/format'

export function Logo({ className, mark = false }: { className?: string; mark?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 32 32" className="size-7 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="8" fill="var(--bg-2)" />
        <rect x="6" y="6" width="9" height="9" rx="2.4" fill="var(--accent)" />
        <rect x="17" y="6" width="9" height="9" rx="2.4" fill="var(--accent)" opacity="0.55" />
        <rect x="6" y="17" width="9" height="9" rx="2.4" fill="var(--accent)" opacity="0.32" />
        <rect x="17" y="17" width="9" height="9" rx="2.4" fill="var(--ai)" />
      </svg>
      {mark ? null : (
        <span className="text-[15px] font-semibold tracking-tight">
          Softify<span className="text-muted">OS</span>
        </span>
      )}
    </div>
  )
}

export function Avatar({
  name,
  hue,
  size = 'md',
}: {
  name: string
  hue: number
  size?: 'sm' | 'md' | 'lg'
}) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
  return (
    <span
      title={name}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        size === 'sm' && 'size-6 text-[10px]',
        size === 'md' && 'size-7 text-[11px]',
        size === 'lg' && 'size-10 text-sm',
      )}
      style={{ background: `hsl(${hue} 42% 42%)` }}
    >
      {initials}
    </span>
  )
}

export function Badge({
  children,
  tone = 'muted',
}: {
  children: React.ReactNode
  tone?: 'muted' | 'accent' | 'ok' | 'warn' | 'danger' | 'ai'
}) {
  const tones: Record<string, string> = {
    muted: 'bg-bg-2 text-muted',
    accent: 'bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-accent',
    ok: 'bg-[color-mix(in_srgb,var(--ok)_16%,transparent)] text-ok',
    warn: 'bg-[color-mix(in_srgb,var(--warn)_18%,transparent)] text-warn',
    danger: 'bg-[color-mix(in_srgb,var(--danger)_16%,transparent)] text-danger',
    ai: 'bg-[color-mix(in_srgb,var(--ai)_16%,transparent)] text-ai',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide',
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}

export function IconButton({
  children,
  active,
  label,
  onClick,
  className,
}: {
  children: React.ReactNode
  active?: boolean
  label: string
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'grid size-9 place-items-center rounded-xl text-muted transition hover:bg-bg-2 hover:text-ink',
        active && 'bg-bg-2 text-ink',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-md border border-line bg-bg-2 px-1.5 py-0.5 font-sans text-[10px] font-medium text-faint">
      {children}
    </kbd>
  )
}

export function Surface({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-2xl border border-line bg-bg-1', className)}>{children}</div>
  )
}
