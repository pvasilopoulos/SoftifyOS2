import { useEffect, useMemo, useState } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { Columns3, FormInput, LayoutTemplate, Plus, Trash2 } from 'lucide-react'
import { useT } from '@/i18n'
import { useKernel } from '@/kernel/store'
import type { Design } from '@/kernel/types'
import { cn } from '@/lib/format'
import { Surface } from '@/ui/primitives'
import { ViewCanvas } from '@/ui/view-canvas'

type Kind = 'layouts' | 'views' | 'forms'

const FIELD_TYPES = ['text', 'money', 'number', 'select', 'date', 'people', 'textarea'] as const
const VIEW_TYPES = ['board', 'table'] as const
const PRESETS = [
  { id: 'split', label: 'Split' },
  { id: 'board', label: 'Board' },
  { id: 'stack', label: 'Stack' },
  { id: 'dashboard', label: 'Dashboard' },
]

export function StudioHub() {
  const t = useT()
  const cards: { to: string; key: Kind; icon: typeof LayoutTemplate }[] = [
    { to: '/studio/layouts', key: 'layouts', icon: LayoutTemplate },
    { to: '/studio/views', key: 'views', icon: Columns3 },
    { to: '/studio/forms', key: 'forms', icon: FormInput },
  ]
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-faint">Studio</p>
        <h1 className="mt-1 font-serif text-4xl tracking-tight">{t.studio.title}</h1>
        <p className="mt-2 text-sm text-muted">{t.studio.hint}</p>
      </header>
      <div className="grid gap-3 md:grid-cols-3">
        {cards.map((card) => (
          <NavLink key={card.to} to={card.to} className="group">
            <Surface className="h-full p-5 transition group-hover:border-accent">
              <card.icon className="size-5 text-accent" />
              <h2 className="mt-4 text-lg font-semibold">{t.studio[card.key]}</h2>
              <p className="mt-1 text-sm text-muted">{t.studio[`${card.key}Hint`]}</p>
            </Surface>
          </NavLink>
        ))}
      </div>
    </div>
  )
}

export function StudioDesigner() {
  const { kind = 'views', id } = useParams<{ kind: Kind; id?: string }>()
  const table = (['layouts', 'views', 'forms'].includes(kind) ? kind : 'views') as Kind
  const t = useT()
  const navigate = useNavigate()
  const items = useKernel((s) => s[table])
  const saveDesign = useKernel((s) => s.saveDesign)
  const deleteDesign = useKernel((s) => s.deleteDesign)
  const selected = items.find((item) => item.id === id) ?? items[0]
  const [draft, setDraft] = useState<Design | null>(selected ?? null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDraft(selected ?? null)
    if (!id && selected) navigate(`/studio/${table}/${selected.id}`, { replace: true })
  }, [id, navigate, selected, table])

  if (!draft) {
    return (
      <EmptyDesigner
        table={table}
        onCreate={() =>
          void createNew(table, saveDesign).then((item) => navigate(`/studio/${table}/${item.id}`))
        }
      />
    )
  }

  return (
    <div className="flex h-full min-h-0">
      <aside className="w-64 shrink-0 overflow-y-auto border-r border-line p-3 scrollbar-thin">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-faint">
            {t.studio[table]}
          </span>
          <button
            type="button"
            className="grid size-7 place-items-center rounded-lg text-muted hover:bg-bg-2"
            onClick={() =>
              void createNew(table, saveDesign).then((item) => navigate(`/studio/${table}/${item.id}`))
            }
          >
            <Plus className="size-3.5" />
          </button>
        </div>
        {items.map((item) => (
          <NavLink
            key={item.id}
            to={`/studio/${table}/${item.id}`}
            className={({ isActive }) =>
              cn('mb-1 block rounded-xl px-3 py-2 text-sm', isActive && 'bg-bg-2 font-medium')
            }
          >
            <div className="truncate">{item.name}</div>
            <div className="text-[11px] text-faint">
              {item.moduleId} · {item.kind || item.objectType}
            </div>
          </NavLink>
        ))}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-line px-4 py-3">
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="flex-1 bg-transparent text-lg font-semibold outline-none"
          />
          <select
            value={draft.moduleId}
            onChange={(e) => setDraft({ ...draft, moduleId: e.target.value })}
            className="rounded-xl border border-line bg-bg px-2 py-1.5 text-sm"
          >
            <option value="crm">CRM</option>
            <option value="work">Work</option>
            <option value="docs">Docs</option>
          </select>
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              setSaving(true)
              void saveDesign(table, draft).then((item) => {
                setDraft(item)
                setSaving(false)
                navigate(`/studio/${table}/${item.id}`)
              })
            }}
            className="rounded-xl bg-accent px-3 py-1.5 text-sm font-semibold text-bg"
          >
            {t.studio.save}
          </button>
          {!draft.isSystem ? (
            <button
              type="button"
              onClick={() =>
                void deleteDesign(table, draft.id).then(() => navigate(`/studio/${table}`))
              }
              className="grid size-9 place-items-center rounded-xl text-muted hover:text-danger"
            >
              <Trash2 className="size-4" />
            </button>
          ) : null}
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 scrollbar-thin">
          {table === 'layouts' ? <LayoutEditor draft={draft} onChange={setDraft} /> : null}
          {table === 'views' ? <ViewEditor draft={draft} onChange={setDraft} /> : null}
          {table === 'forms' ? <FormEditor draft={draft} onChange={setDraft} /> : null}
        </div>
      </div>
    </div>
  )
}

function EmptyDesigner({ table, onCreate }: { table: Kind; onCreate: () => void }) {
  const t = useT()
  return (
    <div className="grid h-full place-items-center">
      <button type="button" onClick={onCreate} className="text-sm text-accent hover:underline">
        {t.studio.create} {t.studio[table]}
      </button>
    </div>
  )
}

async function createNew(
  table: Kind,
  save: KernelState['saveDesign'],
): Promise<Design> {
  const defaults: Record<Kind, Partial<Design> & { schema: Record<string, unknown> }> = {
    layouts: {
      name: 'New layout',
      moduleId: 'crm',
      kind: 'split',
      schema: {
        preset: 'split',
        zones: [
          { id: 'main', slot: 'primary', flex: 1 },
          { id: 'inspector', slot: 'inspector', width: 380 },
        ],
      },
    },
    views: {
      name: 'New view',
      moduleId: 'crm',
      objectType: 'deal',
      kind: 'board',
      schema: {
        type: 'board',
        columnField: 'stage',
        columns: ['lead', 'qualified', 'proposal', 'won'],
        titleField: 'title',
      },
    },
    forms: {
      name: 'New form',
      moduleId: 'crm',
      objectType: 'deal',
      kind: 'modal',
      schema: {
        surface: 'modal',
        sections: [
          {
            id: 'main',
            title: 'Details',
            fields: [{ key: 'title', label: 'Title', type: 'text', required: true, width: 2 }],
          },
        ],
      },
    },
  }
  return save(table, defaults[table])
}

type KernelState = ReturnType<typeof useKernel.getState>

function LayoutEditor({ draft, onChange }: { draft: Design; onChange: (d: Design) => void }) {
  const t = useT()
  const preset = String(draft.schema.preset ?? 'split')
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <Surface className="min-h-[360px] p-4">
        <div className="mb-3 text-xs font-medium uppercase tracking-wider text-faint">{t.studio.preview}</div>
        <div
          className={cn(
            'flex h-[320px] overflow-hidden rounded-xl border border-line bg-bg',
            preset === 'stack' && 'flex-col',
          )}
        >
          <div className="flex flex-1 items-center justify-center bg-accent/10 text-xs text-accent">main</div>
          {preset !== 'board' ? (
            <div
              className="flex items-center justify-center border-l border-line bg-bg-2 text-xs text-muted"
              style={{ width: preset === 'dashboard' ? '50%' : 160 }}
            >
              {preset === 'dashboard' ? 'widgets' : 'inspector'}
            </div>
          ) : null}
        </div>
      </Surface>
      <Surface className="p-4">
        <div className="text-xs font-medium uppercase tracking-wider text-faint">{t.studio.preset}</div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {PRESETS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange({ ...draft, kind: item.id, schema: { ...draft.schema, preset: item.id } })}
              className={cn(
                'rounded-xl border px-2 py-3 text-sm',
                preset === item.id ? 'border-accent bg-accent/10' : 'border-line',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Surface>
    </div>
  )
}

function ViewEditor({ draft, onChange }: { draft: Design; onChange: (d: Design) => void }) {
  const t = useT()
  const type = String(draft.schema.type ?? draft.kind ?? 'table')
  const columns = (draft.schema.columns as string[] | undefined) ?? []
  const preview = useMemo(() => draft, [draft])
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
      <div className="min-h-[280px]">
        <ViewCanvas view={preview} />
      </div>
      <Surface className="space-y-3 p-4">
        <label className="block text-xs text-muted">
          {t.studio.viewType}
          <select
            value={type}
            onChange={(e) =>
              onChange({ ...draft, kind: e.target.value, schema: { ...draft.schema, type: e.target.value } })
            }
            className="mt-1 w-full rounded-xl border border-line bg-bg px-2 py-2 text-sm text-ink"
          >
            {VIEW_TYPES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-muted">
          {t.studio.object}
          <input
            value={draft.objectType ?? ''}
            onChange={(e) => onChange({ ...draft, objectType: e.target.value })}
            className="mt-1 w-full rounded-xl border border-line bg-bg px-2 py-2 text-sm text-ink"
          />
        </label>
        <label className="block text-xs text-muted">
          {t.studio.columns}
          <input
            value={columns.join(', ')}
            onChange={(e) =>
              onChange({
                ...draft,
                schema: {
                  ...draft.schema,
                  columns: e.target.value.split(',').map((part) => part.trim()).filter(Boolean),
                },
              })
            }
            className="mt-1 w-full rounded-xl border border-line bg-bg px-2 py-2 text-sm text-ink"
          />
        </label>
      </Surface>
    </div>
  )
}

interface FormField {
  key: string
  label: string
  type: string
  required?: boolean
  width?: number
  options?: string[]
}

function FormEditor({ draft, onChange }: { draft: Design; onChange: (d: Design) => void }) {
  const t = useT()
  const sections = (draft.schema.sections as { id: string; title: string; fields: FormField[] }[]) ?? []
  const fields = sections[0]?.fields ?? []
  const [active, setActive] = useState(0)

  function updateFields(next: FormField[]) {
    const section = sections[0] ?? { id: 'main', title: 'Details', fields: [] }
    onChange({
      ...draft,
      schema: { ...draft.schema, sections: [{ ...section, fields: next }] },
    })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[200px_1fr_260px]">
      <Surface className="p-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-faint">{t.studio.palette}</div>
        <div className="mt-2 flex flex-col gap-1">
          {FIELD_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() =>
                updateFields([
                  ...fields,
                  { key: type + '_' + (fields.length + 1), label: type, type, width: 1 },
                ])
              }
              className="rounded-xl border border-line px-2 py-1.5 text-left text-sm hover:border-accent"
            >
              {type}
            </button>
          ))}
        </div>
      </Surface>
      <Surface className="p-5">
        <div className="grid grid-cols-2 gap-3">
          {fields.map((fieldItem, index) => (
            <button
              key={fieldItem.key + index}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                'rounded-xl border px-3 py-2 text-left',
                fieldItem.width === 2 && 'col-span-2',
                active === index ? 'border-accent' : 'border-line',
              )}
            >
              <div className="text-[11px] text-faint">{fieldItem.label}</div>
              <div className="mt-1 h-8 rounded-lg bg-bg-2" />
            </button>
          ))}
        </div>
      </Surface>
      <Surface className="p-4">
        {fields[active] ? (
          <div className="space-y-3 text-sm">
            <label className="block text-xs text-muted">
              Label
              <input
                value={fields[active].label}
                onChange={(e) => {
                  const next = fields.map((fieldItem, index) =>
                    index === active ? { ...fieldItem, label: e.target.value } : fieldItem,
                  )
                  updateFields(next)
                }}
                className="mt-1 w-full rounded-xl border border-line bg-bg px-2 py-2"
              />
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={Boolean(fields[active].required)}
                onChange={(e) => {
                  const next = fields.map((fieldItem, index) =>
                    index === active ? { ...fieldItem, required: e.target.checked } : fieldItem,
                  )
                  updateFields(next)
                }}
              />
              {t.studio.required}
            </label>
            <button
              type="button"
              className="text-xs text-danger"
              onClick={() => updateFields(fields.filter((_, index) => index !== active))}
            >
              {t.studio.removeField}
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted">{t.studio.pickField}</p>
        )}
      </Surface>
    </div>
  )
}
