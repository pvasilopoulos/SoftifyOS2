import { useMemo, useState } from 'react'
import {
  addDays,
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  parseISO,
  startOfWeek,
} from 'date-fns'
import { el, enUS } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useT } from '@/i18n'
import { useKernel, useRecords } from '@/kernel/store'
import { field, type SoftifyRecord } from '@/kernel/types'
import { cn } from '@/lib/format'

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]

function parseWhen(value: string) {
  const date = parseISO(value)
  return Number.isNaN(date.getTime()) ? new Date(value) : date
}

export function CalendarModule() {
  const t = useT()
  const locale = useKernel((s) => s.ui.locale)
  const events = useRecords('event')
  const tasks = useRecords('task')
  const openInspector = useKernel((s) => s.openInspector)
  const setCreateType = useKernel((s) => s.setCreateType)
  const [anchor, setAnchor] = useState(() => new Date())
  const week = useMemo(() => {
    const start = startOfWeek(anchor, { weekStartsOn: 1 })
    return {
      today: new Date(),
      start,
      days: eachDayOfInterval({ start, end: endOfWeek(anchor, { weekStartsOn: 1 }) }),
    }
  }, [anchor])
  const dfLocale = locale === 'el' ? el : enUS

  function createAt(day: Date, hour: number) {
    const start = new Date(day)
    start.setHours(hour, 0, 0, 0)
    const end = new Date(start)
    end.setHours(hour + 1)
    setCreateType('event', {
      fields: { start: start.toISOString(), end: end.toISOString() },
    })
  }

  return (
    <div className="flex h-full min-h-0 flex-col p-3 md:p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-semibold">
          {t.calendar.week} · {format(week.start, 'd MMM', { locale: dfLocale })} –{' '}
          {format(addDays(week.start, 6), 'd MMM', { locale: dfLocale })}
        </h1>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setAnchor((d) => addWeeks(d, -1))}
            className="rounded-lg p-1.5 text-muted hover:bg-bg-2 hover:text-ink"
            aria-label={t.calendar.prev}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setAnchor(new Date())}
            className="rounded-full bg-accent/15 px-2.5 py-1 text-xs text-accent"
          >
            {t.calendar.today}
          </button>
          <button
            type="button"
            onClick={() => setAnchor((d) => addWeeks(d, 1))}
            className="rounded-lg p-1.5 text-muted hover:bg-bg-2 hover:text-ink"
            aria-label={t.calendar.next}
          >
            <ChevronRight className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => createAt(week.today, Math.max(9, new Date().getHours()))}
            className="ml-1 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-bg"
          >
            {t.create.event}
          </button>
        </div>
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
          <div className="border-b border-line px-2 py-2 text-right text-[10px] uppercase tracking-wider text-faint">
            {t.calendar.due}
          </div>
          {week.days.map((day) => {
            const due = tasks.filter((task) => {
              if (field(task, 'status', '') === 'done') return false
              const raw = field(task, 'due', '')
              if (!raw) return false
              const dueDate = parseWhen(raw)
              if (Number.isNaN(dueDate.getTime())) return false
              return isSameDay(dueDate, day)
            })
            return (
              <div key={`due-${day.toISOString()}`} className="min-h-[52px] space-y-1 border-b border-l border-line p-1">
                {due.map((task) => (
                  <Chip
                    key={task.id}
                    title={task.title}
                    tone={parseWhen(field(task, 'due', '')).getTime() < Date.now() ? 'warn' : 'task'}
                    onClick={() => openInspector(task.id)}
                  />
                ))}
              </div>
            )
          })}
          {HOURS.map((hour) => (
            <HourRow
              key={hour}
              hour={hour}
              days={week.days}
              events={events}
              onOpen={openInspector}
              onCreate={createAt}
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
  onCreate,
}: {
  hour: number
  days: Date[]
  events: SoftifyRecord[]
  onOpen: (id: string) => void
  onCreate: (day: Date, hour: number) => void
}) {
  return (
    <>
      <div className="border-b border-line px-2 py-3 text-right text-[11px] text-faint">{hour}:00</div>
      {days.map((day) => {
        const cellEvents = events.filter((event) => {
          const start = parseWhen(field(event, 'start', event.createdAt))
          if (Number.isNaN(start.getTime())) return false
          return isSameDay(start, day) && start.getHours() === hour
        })
        return (
          <div key={day.toISOString() + hour} className="relative min-h-[56px] space-y-1 border-b border-l border-line p-1">
            <button
              type="button"
              onClick={() => onCreate(day, hour)}
              className="absolute inset-0 hover:bg-bg-2/40"
              aria-label={`${hour}:00`}
            />
            {cellEvents.map((event) => (
              <Chip
                key={event.id}
                title={event.title}
                subtitle={field(event, 'location', '')}
                tone="event"
                onClick={() => onOpen(event.id)}
              />
            ))}
          </div>
        )
      })}
    </>
  )
}

function Chip({
  title,
  subtitle,
  tone,
  onClick,
}: {
  title: string
  subtitle?: string
  tone: 'event' | 'task' | 'warn'
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        'relative z-10 block w-full rounded-lg px-2 py-1 text-left text-[11px] leading-tight',
        tone === 'event' && 'bg-accent/18 text-ink',
        tone === 'task' && 'bg-bg-2 text-ink',
        tone === 'warn' && 'bg-danger/15 text-danger',
      )}
    >
      <div className="font-medium">{title}</div>
      {subtitle ? <div className="text-faint">{subtitle}</div> : null}
    </button>
  )
}
