import clsx, { type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function formatCurrency(amount: number, locale: string) {
  return new Intl.NumberFormat(locale === 'el' ? 'el-GR' : 'en-US', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(iso: string, locale: string, withTime = false) {
  const date = new Date(iso)
  return new Intl.DateTimeFormat(locale === 'el' ? 'el-GR' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date)
}

export function formatRelative(iso: string, locale: string) {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = then - now
  const abs = Math.abs(diff)
  const rtf = new Intl.RelativeTimeFormat(locale === 'el' ? 'el' : 'en', {
    numeric: 'auto',
  })
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour
  if (abs < hour) return rtf.format(Math.round(diff / minute), 'minute')
  if (abs < day) return rtf.format(Math.round(diff / hour), 'hour')
  return rtf.format(Math.round(diff / day), 'day')
}

export function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`
}
