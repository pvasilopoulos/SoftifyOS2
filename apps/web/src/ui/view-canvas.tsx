import { useKernel } from '@/kernel/store'
import type { Design, SoftifyRecord } from '@/kernel/types'
import { field } from '@/kernel/types'
import { formatCurrency } from '@/lib/format'
import { Kanban } from '@/ui/kanban'
import { Badge, Surface } from '@/ui/primitives'

export function ViewCanvas({ view }: { view: Design }) {
  const records = useKernel((s) => s.records)
  const locale = useKernel((s) => s.ui.locale)
  const patchFields = useKernel((s) => s.patchFields)
  const openInspector = useKernel((s) => s.openInspector)
  const objectType = view.objectType ?? 'deal'
  const items = records.filter((record) => record.type === objectType)
  const kind = (view.schema.type as string) || view.kind || 'table'
  const columns = (view.schema.columns as string[] | undefined) ?? []
  const columnField = (view.schema.columnField as string) || 'stage'

  if (kind === 'board') {
    return (
      <div className="h-full min-h-[420px]">
        <Kanban
          columns={columns.map((col) => ({ id: col, title: col.replaceAll('_', ' ') }))}
          items={items}
          columnOf={(item) => field(item, columnField, columns[0] ?? '')}
          onMove={(id, columnId) => patchFields(id, { [columnField]: columnId })}
          renderCard={(item) => (
            <Card record={item} metric={view.schema.metricField as string | undefined} locale={locale} onOpen={openInspector} />
          )}
        />
      </div>
    )
  }

  return (
    <Surface className="overflow-hidden">
      <table className="w-full text-sm">
        <thead className="text-left text-[11px] uppercase tracking-wider text-faint">
          <tr className="border-b border-line">
            {(columns.length ? columns : ['title']).map((col) => (
              <th key={col} className="px-4 py-3 font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              onClick={() => openInspector(item.id)}
              className="cursor-pointer border-b border-line last:border-0 hover:bg-bg-2/60"
            >
              {(columns.length ? columns : ['title']).map((col) => (
                <td key={col} className="px-4 py-3">
                  {col === 'title' ? item.title : String(item.fields[col] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Surface>
  )
}

function Card({
  record,
  metric,
  locale,
  onOpen,
}: {
  record: SoftifyRecord
  metric?: string
  locale: string
  onOpen: (id: string) => void
}) {
  const amount = metric ? field(record, metric, NaN) : NaN
  return (
    <button
      type="button"
      onClick={() => onOpen(record.id)}
      className="w-full rounded-xl border border-line bg-bg-1 p-3 text-left hover:border-line-strong"
    >
      <div className="text-sm font-medium leading-snug">{record.title}</div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted">
        {Number.isFinite(amount) ? <span>{formatCurrency(amount, locale)}</span> : <Badge>{record.type}</Badge>}
      </div>
    </button>
  )
}
