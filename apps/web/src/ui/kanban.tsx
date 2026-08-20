import {
  DndContext,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { SoftifyRecord } from '@/kernel/types'
import { cn } from '@/lib/format'

export interface BoardColumn {
  id: string
  title: string
  tone?: string
}

export function Kanban({
  columns,
  items,
  columnOf,
  onMove,
  renderCard,
}: {
  columns: BoardColumn[]
  items: SoftifyRecord[]
  columnOf: (item: SoftifyRecord) => string
  onMove: (id: string, columnId: string) => void
  renderCard: (item: SoftifyRecord) => React.ReactNode
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    const overId = String(over.id)
    const column = columns.find((col) => col.id === overId)
    const overItem = items.find((item) => item.id === overId)
    const next = column?.id ?? (overItem ? columnOf(overItem) : null)
    if (next && next !== columnOf(items.find((item) => item.id === String(active.id))!)) {
      onMove(String(active.id), next)
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
      <div className="flex h-full min-h-0 gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {columns.map((column) => {
          const columnItems = items
            .filter((item) => columnOf(item) === column.id)
            .sort((a, b) => Number(a.fields.sort ?? 0) - Number(b.fields.sort ?? 0))
          return (
            <KanbanColumn key={column.id} column={column} ids={columnItems.map((item) => item.id)}>
              {columnItems.map((item) => (
                <SortableCard key={item.id} id={item.id}>
                  {renderCard(item)}
                </SortableCard>
              ))}
            </KanbanColumn>
          )
        })}
      </div>
    </DndContext>
  )
}

function KanbanColumn({
  column,
  ids,
  children,
}: {
  column: BoardColumn
  ids: string[]
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  return (
    <section
      ref={setNodeRef}
      className={cn(
        'flex w-[280px] shrink-0 flex-col rounded-2xl border border-line bg-bg/40',
        isOver && 'border-accent/40 bg-bg-1',
      )}
    >
      <header className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full" style={{ background: column.tone ?? 'var(--accent)' }} />
          <h3 className="text-xs font-semibold text-muted">{column.title}</h3>
        </div>
        <span className="text-[11px] text-faint">{ids.length}</span>
      </header>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-[120px] flex-1 flex-col gap-2 overflow-y-auto px-2 pb-3 scrollbar-thin">
          {children}
        </div>
      </SortableContext>
    </section>
  )
}

function SortableCard({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && 'opacity-70')}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  )
}
