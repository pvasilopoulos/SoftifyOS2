import { Trash2, X } from 'lucide-react'
import { useT } from '@/i18n'
import { useKernel, useMember, useRecord } from '@/kernel/store'
import {
  DEAL_STAGES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  field,
  type DealStage,
  type Relation,
  type RelationKind,
  type TaskPriority,
  type TaskStatus,
} from '@/kernel/types'
import { formatDate, formatRelative } from '@/lib/format'
import { Badge } from '@/ui/primitives'

const HEALTH = ['strong', 'ok', 'risk'] as const
const PROJECT_STATUS = ['planning', 'active', 'done'] as const

export function Inspector() {
  const t = useT()
  const locale = useKernel((s) => s.ui.locale)
  const id = useKernel((s) => s.ui.inspectorId)
  const record = useRecord(id)
  const records = useKernel((s) => s.records)
  const members = useKernel((s) => s.members)
  const close = useKernel((s) => s.openInspector)
  const updateRecord = useKernel((s) => s.updateRecord)
  const patchFields = useKernel((s) => s.patchFields)
  const setRelations = useKernel((s) => s.setRelations)
  const deleteRecord = useKernel((s) => s.deleteRecord)
  const owner = useMember(record ? field(record, 'ownerId', '') : '')

  if (!record) return null

  const related = record.relations
    .map((rel) => records.find((item) => item.id === rel.id))
    .filter(Boolean)
  const activity = records
    .filter((item) => item.type === 'activity' && item.relations.some((rel) => rel.id === record.id))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  const companies = records.filter((item) => item.type === 'company')
  const projects = records.filter((item) => item.type === 'project')
  const contacts = records.filter((item) => item.type === 'contact')

  const stage = field<DealStage | ''>(record, 'stage', '')
  const status = field<TaskStatus | ''>(record, 'status', '')
  const priority = field<TaskPriority | ''>(record, 'priority', '')
  const amount = field<number>(record, 'amount', NaN)
  const health = field<string>(record, 'health', '')
  const relatedOf = (kind: RelationKind) => record.relations.find((rel) => rel.kind === kind)?.id ?? ''

  function setRelated(kind: RelationKind, nextId: string) {
    const rest = record!.relations.filter((rel) => rel.kind !== kind)
    const relations: Relation[] = nextId ? [...rest, { kind, id: nextId }] : rest
    setRelations(record!.id, relations)
  }

  return (
    <div className="fixed inset-x-0 top-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 flex w-full flex-col border-line bg-bg-1 shadow-[var(--shadow)] md:absolute md:inset-y-0 md:right-0 md:bottom-auto md:top-auto md:z-20 md:w-[420px] md:max-w-full md:border-l">
      <header className="flex items-start gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0 flex-1">
          <Badge tone="accent">{t.types[record.type]}</Badge>
          <input
            value={record.title}
            onChange={(e) => updateRecord(record.id, { title: e.target.value })}
            className="mt-2 w-full bg-transparent text-lg font-semibold outline-none"
          />
        </div>
        <button type="button" onClick={() => close(null)} className="mt-1 text-muted hover:text-ink">
          <X className="size-4" />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          {record.type === 'deal' || record.type === 'task' || record.type === 'project' ? (
            <Field label={t.crm.owner}>
              <select
                value={field(record, 'ownerId', owner?.id ?? '')}
                onChange={(e) => patchFields(record.id, { ownerId: e.target.value })}
                className={selectClass}
              >
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
          {record.type === 'deal' ? (
            <>
              <Field label="Stage">
                <select
                  value={stage}
                  onChange={(e) => patchFields(record.id, { stage: e.target.value })}
                  className={selectClass}
                >
                  {DEAL_STAGES.map((item) => (
                    <option key={item} value={item}>
                      {t.stages[item]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t.crm.amount}>
                <input
                  inputMode="numeric"
                  value={Number.isFinite(amount) ? String(amount) : ''}
                  onChange={(e) => patchFields(record.id, { amount: Number(e.target.value) || 0 })}
                  className={inputClass}
                />
              </Field>
              <Field label={t.inspector.probability}>
                <input
                  inputMode="numeric"
                  value={String(field(record, 'probability', 0))}
                  onChange={(e) => patchFields(record.id, { probability: Number(e.target.value) || 0 })}
                  className={inputClass}
                />
              </Field>
              <Field label={t.types.company}>
                <select
                  value={relatedOf('company')}
                  onChange={(e) => setRelated('company', e.target.value)}
                  className={selectClass}
                >
                  <option value="">{t.inspector.none}</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.title}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t.types.contact}>
                <select
                  value={relatedOf('contact')}
                  onChange={(e) => setRelated('contact', e.target.value)}
                  className={selectClass}
                >
                  <option value="">{t.inspector.none}</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.title}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          ) : null}
          {record.type === 'task' ? (
            <>
              <Field label="Status">
                <select
                  value={status}
                  onChange={(e) => patchFields(record.id, { status: e.target.value })}
                  className={selectClass}
                >
                  {TASK_STATUSES.map((item) => (
                    <option key={item} value={item}>
                      {t.taskStatus[item]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Priority">
                <select
                  value={priority}
                  onChange={(e) => patchFields(record.id, { priority: e.target.value })}
                  className={selectClass}
                >
                  {TASK_PRIORITIES.map((item) => (
                    <option key={item} value={item}>
                      {t.priority[item]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t.inspector.due}>
                <input
                  type="date"
                  value={field(record, 'due', '').slice(0, 10)}
                  onChange={(e) => patchFields(record.id, { due: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label={t.types.project}>
                <select
                  value={relatedOf('project')}
                  onChange={(e) => setRelated('project', e.target.value)}
                  className={selectClass}
                >
                  <option value="">{t.inspector.none}</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          ) : null}
          {record.type === 'company' ? (
            <>
              <Field label={t.crm.industry}>
                <input
                  value={field(record, 'industry', '')}
                  onChange={(e) => patchFields(record.id, { industry: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label={t.crm.health}>
                <select
                  value={health || 'ok'}
                  onChange={(e) => patchFields(record.id, { health: e.target.value })}
                  className={selectClass}
                >
                  {HEALTH.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="City">
                <input
                  value={field(record, 'city', '')}
                  onChange={(e) => patchFields(record.id, { city: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Domain">
                <input
                  value={field(record, 'domain', '')}
                  onChange={(e) => patchFields(record.id, { domain: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </>
          ) : null}
          {record.type === 'contact' ? (
            <>
              <Field label="Email">
                <input
                  value={field(record, 'email', '')}
                  onChange={(e) => patchFields(record.id, { email: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label={t.inspector.role}>
                <input
                  value={field(record, 'role', '')}
                  onChange={(e) => patchFields(record.id, { role: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label={t.types.company}>
                <select
                  value={relatedOf('company')}
                  onChange={(e) => setRelated('company', e.target.value)}
                  className={selectClass}
                >
                  <option value="">{t.inspector.none}</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.title}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          ) : null}
          {record.type === 'project' ? (
            <>
              <Field label="Status">
                <select
                  value={field(record, 'status', 'planning')}
                  onChange={(e) => patchFields(record.id, { status: e.target.value })}
                  className={selectClass}
                >
                  {PROJECT_STATUS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t.work.target}>
                <input
                  type="date"
                  value={field(record, 'target', '').slice(0, 10)}
                  onChange={(e) => patchFields(record.id, { target: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </>
          ) : null}
        </dl>

        {related.length ? (
          <section className="mt-6">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-faint">
              {t.inspector.related}
            </h3>
            <ul className="mt-2 space-y-1">
              {related.map((item) =>
                item ? (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => close(item.id)}
                      className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-sm hover:bg-bg-2"
                    >
                      <span>{item.title}</span>
                      <span className="text-xs text-faint">{t.types[item.type]}</span>
                    </button>
                  </li>
                ) : null,
              )}
            </ul>
          </section>
        ) : null}

        <section className="mt-6">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-faint">
            {t.inspector.activity}
          </h3>
          {activity.length === 0 ? (
            <p className="mt-2 text-sm text-muted">{t.inspector.empty}</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {activity.map((item) => {
                const actor = members.find((m) => m.id === field(item, 'actorId', ''))
                return (
                  <li key={item.id} className="rounded-xl border border-line px-3 py-2 text-sm">
                    <div className="text-ink">
                      {actor?.name.split(' ')[0]} {item.title}
                    </div>
                    <div className="text-[11px] text-faint">{formatRelative(item.createdAt, locale)}</div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
        <p className="mt-6 text-[11px] text-faint">{formatDate(record.updatedAt, locale, true)}</p>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(t.inspector.confirmDelete)) deleteRecord(record.id)
          }}
          className="mt-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-danger hover:bg-danger/10"
        >
          <Trash2 className="size-3.5" />
          {t.inspector.delete}
        </button>
      </div>
    </div>
  )
}

const inputClass =
  'mt-1 w-full rounded-lg border border-line bg-bg px-2 py-1.5 text-sm text-ink outline-none focus:border-accent'
const selectClass = inputClass

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-bg px-3 py-2">
      <dt className="text-[10px] font-medium uppercase tracking-wider text-faint">{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}
