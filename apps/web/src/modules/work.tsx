import { useMemo } from 'react'
import { NavLink, Outlet, useParams } from 'react-router-dom'
import { useT } from '@/i18n'
import { useKernel } from '@/kernel/store'
import { TASK_STATUSES, field } from '@/kernel/types'
import { cn, formatDate } from '@/lib/format'
import { Kanban } from '@/ui/kanban'
import { Avatar, Badge, Surface } from '@/ui/primitives'

export function WorkLayout() {
  const t = useT()
  const projects = useKernel((s) => s.records.filter((r) => r.type === 'project'))
  const tasks = useKernel((s) => s.records.filter((r) => r.type === 'task'))
  return (
    <div className="flex h-full min-h-0">
      <aside className="w-64 shrink-0 overflow-y-auto border-r border-line p-3 scrollbar-thin">
        <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-faint">
          {t.work.projects}
        </div>
        <NavLink
          to="/work"
          end
          className={({ isActive }) =>
            cn('mb-1 block rounded-xl px-3 py-2 text-sm', isActive ? 'bg-bg-2 font-medium' : 'text-muted hover:text-ink')
          }
        >
          {t.work.all}
        </NavLink>
        {projects.map((project) => {
          const pts = tasks.filter((task) => task.relations.some((rel) => rel.id === project.id))
          const done = pts.filter((task) => field(task, 'status', '') === 'done').length
          return (
            <NavLink
              key={project.id}
              to={`/work/${project.id}`}
              className={({ isActive }) =>
                cn('mb-1 block rounded-xl px-3 py-2 text-sm', isActive ? 'bg-bg-2 font-medium' : 'hover:bg-bg-2/70')
              }
            >
              <div className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{ background: field(project, 'color', '#8aa2ff') }}
                />
                <span className="truncate">{project.title}</span>
              </div>
              <div className="mt-1 pl-4 text-[11px] text-faint">
                {done}/{pts.length}
              </div>
            </NavLink>
          )
        })}
      </aside>
      <div className="min-w-0 flex-1 p-4">
        <Outlet />
      </div>
    </div>
  )
}

export function WorkBoard() {
  const { projectId } = useParams()
  const t = useT()
  const locale = useKernel((s) => s.ui.locale)
  const records = useKernel((s) => s.records)
  const members = useKernel((s) => s.members)
  const patchFields = useKernel((s) => s.patchFields)
  const openInspector = useKernel((s) => s.openInspector)
  const project = records.find((r) => r.id === projectId)
  const tasks = useMemo(
    () =>
      records.filter(
        (r) =>
          r.type === 'task' && (projectId ? r.relations.some((rel) => rel.id === projectId) : true),
      ),
    [projectId, records],
  )

  const columns = TASK_STATUSES.map((status) => ({
    id: status,
    title: t.taskStatus[status],
    tone:
      status === 'done'
        ? 'var(--ok)'
        : status === 'in_progress'
          ? 'var(--accent)'
          : status === 'review'
            ? 'var(--ai)'
            : 'var(--muted)',
  }))

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex items-end justify-between px-1">
        <div>
          <h1 className="text-lg font-semibold">{project?.title ?? t.work.all}</h1>
          {project ? (
            <p className="text-xs text-muted">
              {t.work.target} {formatDate(field(project, 'target', project.updatedAt), locale)} ·{' '}
              {field(project, 'status', '')}
            </p>
          ) : null}
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <Kanban
          columns={columns}
          items={tasks}
          columnOf={(item) => field(item, 'status', 'backlog')}
          onMove={(id, columnId) => patchFields(id, { status: columnId })}
          renderCard={(task) => {
            const owner = members.find((m) => m.id === field(task, 'ownerId', ''))
            const priority = field(task, 'priority', 'medium')
            return (
              <button
                type="button"
                onClick={() => openInspector(task.id)}
                className="w-full rounded-xl border border-line bg-bg-1 p-3 text-left hover:border-line-strong"
              >
                <div className="text-sm font-medium leading-snug">{task.title}</div>
                <div className="mt-2 flex items-center justify-between">
                  <Badge tone={priority === 'urgent' || priority === 'high' ? 'warn' : 'muted'}>
                    {t.priority[priority as keyof typeof t.priority]}
                  </Badge>
                  {owner ? <Avatar name={owner.name} hue={owner.hue} size="sm" /> : null}
                </div>
              </button>
            )
          }}
        />
      </div>
    </div>
  )
}

export function WorkProjects() {
  const t = useT()
  const locale = useKernel((s) => s.ui.locale)
  const projects = useKernel((s) => s.records.filter((r) => r.type === 'project'))
  const tasks = useKernel((s) => s.records.filter((r) => r.type === 'task'))
  const openInspector = useKernel((s) => s.openInspector)
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => {
        const pts = tasks.filter((task) => task.relations.some((rel) => rel.id === project.id))
        const done = pts.filter((task) => field(task, 'status', '') === 'done').length
        const pct = pts.length ? Math.round((done / pts.length) * 100) : 0
        return (
          <Surface key={project.id} className="p-4">
            <button type="button" onClick={() => openInspector(project.id)} className="w-full text-left">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ background: field(project, 'color', '#8aa2ff') }} />
                <h2 className="font-semibold">{project.title}</h2>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-bg-2">
                <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted">
                <span>
                  {t.work.progress} {pct}%
                </span>
                <span>{formatDate(field(project, 'target', project.updatedAt), locale)}</span>
              </div>
            </button>
            <NavLink to={`/work/${project.id}`} className="mt-3 inline-block text-xs text-accent hover:underline">
              {t.open} →
            </NavLink>
          </Surface>
        )
      })}
    </div>
  )
}
