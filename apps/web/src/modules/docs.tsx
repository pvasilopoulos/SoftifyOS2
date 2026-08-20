import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { useT } from '@/i18n'
import { useKernel } from '@/kernel/store'
import { field } from '@/kernel/types'
import { cn } from '@/lib/format'

export function DocsModule() {
  const t = useT()
  const { docId } = useParams()
  const docs = useKernel((s) => s.records.filter((r) => r.type === 'doc'))
  const updateRecord = useKernel((s) => s.updateRecord)
  const navigate = useNavigate()
  const active = docs.find((d) => d.id === docId) ?? docs[0]

  if (active && !docId) {
    navigate(`/docs/${active.id}`, { replace: true })
  }

  return (
    <div className="flex h-full min-h-0">
      <aside className="w-64 shrink-0 overflow-y-auto border-r border-line p-3 scrollbar-thin">
        {docs.map((doc) => (
          <NavLink
            key={doc.id}
            to={`/docs/${doc.id}`}
            className={({ isActive }) =>
              cn('mb-1 flex items-center gap-2 rounded-xl px-3 py-2 text-sm', isActive && 'bg-bg-2')
            }
          >
            <span>{field(doc, 'emoji', '◈')}</span>
            <span className="truncate">{doc.title}</span>
          </NavLink>
        ))}
      </aside>
      {active ? (
        <article className="mx-auto w-full max-w-2xl overflow-y-auto px-10 py-10 scrollbar-thin">
          <div className="text-4xl">{field(active, 'emoji', '◈')}</div>
          <input
            value={active.title}
            onChange={(e) => updateRecord(active.id, { title: e.target.value })}
            className="mt-4 w-full bg-transparent font-serif text-4xl tracking-tight outline-none"
          />
          <p className="mt-2 text-sm text-faint">{t.docs.hint}</p>
          <textarea
            value={field(active, 'body', '')}
            onChange={(e) => updateRecord(active.id, { fields: { body: e.target.value } })}
            className="mt-8 min-h-[50vh] w-full resize-none bg-transparent text-[15px] leading-7 text-ink/90 outline-none"
          />
        </article>
      ) : (
        <div className="grid flex-1 place-items-center text-sm text-muted">{t.empty}</div>
      )}
    </div>
  )
}
