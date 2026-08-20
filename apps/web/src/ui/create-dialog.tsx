import { useState } from 'react'
import { useT } from '@/i18n'
import { useKernel } from '@/kernel/store'
import type { RecordType } from '@/kernel/types'
import { cn } from '@/lib/format'

const TYPE_DEFAULTS: Partial<Record<RecordType, Record<string, unknown>>> = {
  deal: { stage: 'lead', amount: 0, probability: 10, ownerId: 'user_panos', sort: 0 },
  task: { status: 'backlog', priority: 'medium', ownerId: 'user_panos', sort: 0 },
  project: { status: 'planning', ownerId: 'user_panos', color: '#8aa2ff' },
  company: { industry: 'Other', city: '', health: 'ok' },
  contact: { role: '', email: '' },
  doc: { emoji: '◈', body: '' },
}

export function CreateDialog() {
  const t = useT()
  const type = useKernel((s) => s.ui.createType)
  const setCreateType = useKernel((s) => s.setCreateType)
  const createRecord = useKernel((s) => s.createRecord)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('12000')

  if (!type) return null

  const labels: Partial<Record<RecordType, string>> = {
    deal: t.create.deal,
    task: t.create.task,
    contact: t.create.contact,
    company: t.create.company,
    doc: t.create.doc,
    project: t.create.project,
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!type || !title.trim()) return
    const fields = { ...(TYPE_DEFAULTS[type] ?? {}) }
    if (type === 'deal') fields.amount = Number(amount) || 0
    createRecord({ type, title: title.trim(), fields })
    setTitle('')
  }

  return (
    <div
      className="fixed inset-0 z-50 grid items-end bg-black/50 p-0 md:place-items-center md:items-center md:p-4"
      onClick={() => setCreateType(null)}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md rounded-t-2xl border border-line-strong bg-bg-1 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-[var(--shadow)] md:rounded-2xl md:pb-5"
      >
        <h2 className="text-base font-semibold">{labels[type] ?? t.create.save}</h2>
        <label className="mt-4 block text-xs font-medium text-muted">
          {t.create.title}
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
          />
        </label>
        {type === 'deal' ? (
          <label className="mt-3 block text-xs font-medium text-muted">
            {t.create.amount}
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="numeric"
              className="mt-1.5 w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
            />
          </label>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setCreateType(null)}
            className="rounded-xl px-3 py-2 text-sm text-muted hover:bg-bg-2"
          >
            {t.create.cancel}
          </button>
          <button
            type="submit"
            className={cn(
              'rounded-xl bg-accent px-3.5 py-2 text-sm font-semibold text-bg',
              '[data-theme=light]:text-white',
            )}
          >
            {t.create.save}
          </button>
        </div>
      </form>
    </div>
  )
}
