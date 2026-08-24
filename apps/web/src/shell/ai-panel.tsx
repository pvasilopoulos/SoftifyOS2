import { useMemo, useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { useT } from '@/i18n'
import { useKernel } from '@/kernel/store'
import { DEAL_STAGES, field, type DealStage } from '@/kernel/types'
import { formatCurrency } from '@/lib/format'

interface Chat {
  role: 'user' | 'ai'
  text: string
}

function brief(locale: 'el' | 'en', records: ReturnType<typeof useKernel.getState>['records']) {
  const deals = records.filter((r) => r.type === 'deal')
  const open = deals.filter((d) => !['won', 'lost'].includes(field(d, 'stage', '')))
  const overdue = records.filter(
    (r) => r.type === 'task' && field(r, 'status', '') !== 'done' && new Date(field(r, 'due', '')).getTime() < Date.now(),
  )
  const amount = open.reduce((sum, d) => sum + field(d, 'amount', 0), 0)
  const negotiation = open.filter((d) => field(d, 'stage', '') === 'negotiation')
  if (locale === 'el') {
    return `Σήμερα έχεις ${open.length} ανοιχτά deals (${formatCurrency(amount, 'el')}). ${negotiation.length} σε negotiation — το Helios Core είναι το πιο ζεστό. ${overdue.length} tasks είναι καθυστερημένα. Πρότεινε: κλείσε το follow-up με τη Sofia πριν το board και καθάρισε τα overdue του Helios portal.`
  }
  return `You have ${open.length} open deals (${formatCurrency(amount, 'en')}). ${negotiation.length} in negotiation — Helios Core is the hottest. ${overdue.length} tasks are overdue. Suggest: lock Sofia’s follow-up before the board, then clear Helios portal overdue work.`
}

function answer(prompt: string, locale: 'el' | 'en') {
  const records = useKernel.getState().records
  const q = prompt.toLowerCase()
  const deals = records.filter((r) => r.type === 'deal')
  if (q.includes('pipeline') || q.includes('deal') || q.includes('συμφων') || q.includes('pipeline')) {
    const lines = DEAL_STAGES.map((stage: DealStage) => {
      const list = deals.filter((d) => field(d, 'stage', '') === stage)
      const sum = list.reduce((s, d) => s + field(d, 'amount', 0), 0)
      return `${stage}: ${list.length} · ${formatCurrency(sum, locale)}`
    })
    return (locale === 'el' ? 'Pipeline τώρα:\n' : 'Pipeline now:\n') + lines.join('\n')
  }
  if (q.includes('overdue') || q.includes('task') || q.includes('καθυσ') || q.includes('εργασ')) {
    const overdue = records.filter(
      (r) =>
        r.type === 'task' &&
        field(r, 'status', '') !== 'done' &&
        field(r, 'due', '') &&
        new Date(field(r, 'due', '')).getTime() < Date.now(),
    )
    if (!overdue.length) return locale === 'el' ? 'Κανένα overdue task.' : 'No overdue tasks.'
    return overdue.map((t) => `• ${t.title}`).join('\n')
  }
  if (q.includes('helios') || q.includes('follow')) {
    return locale === 'el'
      ? 'Follow-up Helios:\nSofia — επιβεβαίωσε δημόσιο beta πριν τις 12 Οκτ. Στείλε role matrix + ημερομηνία portal. Owner: Μαρία. Deal σε Negotiation, €84k, 70%.'
      : 'Helios follow-up:\nSofia — confirm public beta before 12 Oct. Send role matrix + portal date. Owner: Maria. Deal in Negotiation, €84k, 70%.'
  }
  return brief(locale, records)
}

export function AiPanel() {
  const t = useT()
  const locale = useKernel((s) => s.ui.locale)
  const open = useKernel((s) => s.ui.aiOpen)
  const setAiOpen = useKernel((s) => s.setAiOpen)
  const records = useKernel((s) => s.records)
  const [input, setInput] = useState('')
  const [chat, setChat] = useState<Chat[]>([])

  const opening = useMemo(() => brief(locale, records), [locale, records])

  if (!open) return null

  function send(text: string) {
    const prompt = text.trim()
    if (!prompt) return
    setChat((c) => [...c, { role: 'user', text: prompt }, { role: 'ai', text: answer(prompt, locale) }])
    setInput('')
  }

  return (
    <aside className="fixed inset-x-0 top-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 flex w-full flex-col border-line bg-bg-1 md:static md:inset-auto md:z-auto md:w-[340px] md:shrink-0 md:border-l">
      <header className="flex h-12 items-center gap-2 border-b border-line px-4 md:h-14">
        <Sparkles className="size-4 text-ai" />
        <div className="flex-1 text-sm font-semibold">{t.ai.title}</div>
        <button type="button" onClick={() => setAiOpen(false)} className="text-muted hover:text-ink md:hidden">
          <X className="size-4" />
        </button>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm scrollbar-thin">
        <div className="rounded-2xl border border-line bg-bg px-3.5 py-3 leading-relaxed text-muted">
          {opening}
        </div>
        {chat.map((msg, i) => (
          <div
            key={i}
            className={
              msg.role === 'user'
                ? 'ml-6 rounded-2xl bg-accent/15 px-3.5 py-2.5'
                : 'rounded-2xl border border-line bg-bg px-3.5 py-3 whitespace-pre-wrap text-muted'
            }
          >
            {msg.text}
          </div>
        ))}
        <div className="flex flex-wrap gap-1.5 pt-2">
          {t.ai.suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="rounded-full border border-line px-2.5 py-1 text-[11px] text-muted hover:border-accent hover:text-ink"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <form
        className="border-t border-line p-3"
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.ai.placeholder}
          className="h-10 w-full rounded-xl border border-line bg-bg px-3 text-sm outline-none placeholder:text-faint focus:border-accent"
        />
        <p className="mt-2 px-0.5 text-[10px] text-faint">{t.ai.hint}</p>
      </form>
    </aside>
  )
}
