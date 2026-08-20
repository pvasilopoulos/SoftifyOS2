import { useMemo } from 'react'
import {
  addDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  parseISO,
  startOfWeek,
} from 'date-fns'
import { el, enUS } from 'date-fns/locale'
import { useT } from '@/i18n'
import { useKernel, useRecords } from '@/kernel/store'
import { field } from '@/kernel/types'
import { cn } from '@/lib/format'

export function CalendarModule() {
  const t = useT()
  const locale = useKernel((s) => s.ui.locale)
  const events = useRecords('event')
  const openInspector = useKernel((s) => s.openInspector)
  const week = useMemo(() => {
    const today = new Date()
    const start = startOfWeek(today, { weekStartsOn: 1 })
    return {
      today,
      start,
      days: eachDayOfInterval({ start, end: endOfWeek(today, { weekStartsOn: 1 }) }),
      hours: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    }
  }, [])
  const dfLocale = locale === 'el' ? el : enUS

  return (
    <div className="flex h-full min-h-0 flex-col p-3 md:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">
          {t.calendar.week} · {format(week.start, 'd MMM', { locale: dfLocale })} –{' '}
          {format(addDays(week.start, 6), 'd MMM', { locale: dfLocale })}
        </h1>
        <span className="rounded-full bg-accent/15 px-2.5 py-1 text-xs text-accent">{t.calendar.today}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-line scrollbar-thin">
        <div className="grid min-w-[880px] grid-cols-[64px_repeat(7,1fr)]">
          <div className="border-b border-line" />
          {week.days.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                'border-b border-l border-line px-3 py-2 text-center text-xs',
                isSameDay(day, week.today) && 'bg-accent/10 font-semibold text-accent',
              )}
            >
              {format(day, 'EEE d', { locale: dfLocale })}
            </div>
          ))}
          {week.hours.map((hour) => (
            <HourRow
              key={hour}
              hour={hour}
              days={week.days}
              events={events}
              onOpen={openInspector}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function HourRow({
  hour,
  days,
  events,
  onOpen,
}: {
  hour: number
  days: Date[]
  events: ReturnType<typeof useKernel.getState>['records']
  onOpen: (id: string) => void
}) {
  return (
    <>
      <div className="border-b border-line px-2 py-3 text-right text-[11px] text-faint">{hour}:00</div>
      {days.map((day) => {
        const cellEvents = events.filter((event) => {
          const raw = field(event, 'start', event.createdAt)
          const start = parseISO(raw)
          if (Number.isNaN(start.getTime())) return false
          return isSameDay(start, day) && start.getHours() === hour
        })
        return (
          <div key={day.toISOString() + hour} className="relative min-h-[64px] border-b border-l border-line">
            {cellEvents.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => {
                  const related = event.relations[0]?.id
                  onOpen(related ?? event.id)
                }}
                className="absolute inset-x-1 top-1 rounded-lg bg-accent/18 px-2 py-1 text-left text-[11px] leading-tight text-ink"
              >
                <div className="font-medium">{event.title}</div>
                <div className="text-faint">{field(event, 'location', '')}</div>
              </button>
            ))}
          </div>
        )
      })}
    </>
  )
}
