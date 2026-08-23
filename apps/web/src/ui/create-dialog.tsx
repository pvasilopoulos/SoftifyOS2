import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useT } from '@/i18n'
import { useKernel } from '@/kernel/store'
import type { RecordType, Relation } from '@/kernel/types'
import { cn } from '@/lib/format'

const TYPE_DEFAULTS: Partial<Record<RecordType, Record<string, unknown>>> = {
  deal: { stage: 'lead', amount: 0, probability: 10, sort: 0 },
  task: { status: 'backlog', priority: 'medium', sort: 0 },
  project: { status: 'planning', color: '#8aa2ff' },
  company: { industry: 'Other', city: '', health: 'ok' },
  contact: { role: '', email: '' },
  doc: { emoji: '◈', body: '' },
}

export function CreateDialog() {
  const t = useT()
  const location = useLocation()
  const type = useKernel((s) => s.ui.createType)
  const prefill = useKernel((s) => s.ui.createPrefill)
  const setCreateType = useKernel((s) => s.setCreateType)
  const createRecord = useKernel((s) => s.createRecord)
  const currentUserId = useKernel((s) => s.currentUserId)
  const records = useKernel((s) => s.records)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('12000')
  const [email, setEmail] = useState('')
  const [companyId, setCompanyId] = useState('')
  const pathProject = location.pathname.match(/^\/work\/([^/]+)/)?.[1] ?? ''
  const [projectOverride, setProjectOverride] = useState<string | null>(null)
  const projectId = projectOverride ?? pathProject

  useEffect(() => {
    if (!type) {
      setTitle('')
      setEmail('')
      setAmount('12000')
      setCompanyId('')
      setProjectOverride(null)
    }
  }, [type])

  if (!type) return null

  const labels: Partial<Record<RecordType, string>> = {
    deal: t.create.deal,
    task: t.create.task,
    contact: t.create.contact,
    company: t.create.company,
    doc: t.create.doc,
    project: t.create.project,
  }
  const companies = records.filter((item) => item.type === 'company')
  const projects = records.filter((item) => item.type === 'project')

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!type || !title.trim()) return
    const fields: Record<string, unknown> = {
      ...(TYPE_DEFAULTS[type] ?? {}),
      ownerId: currentUserId,
      ...(prefill?.fields ?? {}),
    }
    if (type === 'deal') fields.amount = Number(amount) || 0
    if (type === 'contact' && email) fields.email = email
    const relations: Relation[] = [...(prefill?.relations ?? [])]
    const workProject = projectId
    if ((type === 'deal' || type === 'contact') && companyId) {
      relations.push({ kind: 'company', id: companyId })
    }
    if (type === 'task' && workProject) {
      relations.push({ kind: 'project', id: workProject })
    }
    createRecord({ type, title: title.trim(), fields, relations })
    setTitle('')
    setEmail('')
    setAmount('12000')
    setCompanyId('')
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
        {type === 'contact' ? (
          <label className="mt-3 block text-xs font-medium text-muted">
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
            />
          </label>
        ) : null}
        {(type === 'deal' || type === 'contact') && companies.length ? (
          <label className="mt-3 block text-xs font-medium text-muted">
            {t.types.company}
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
            >
              <option value="">{t.inspector.none}</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {type === 'task' && projects.length ? (
          <label className="mt-3 block text-xs font-medium text-muted">
            {t.types.project}
            <select
              value={projectId}
              onChange={(e) => setProjectOverride(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
            >
              <option value="">{t.inspector.none}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
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
