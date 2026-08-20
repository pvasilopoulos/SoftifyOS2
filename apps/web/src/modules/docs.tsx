import { useEffect } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { useT } from '@/i18n'
import { useKernel, useRecords } from '@/kernel/store'
import { field } from '@/kernel/types'
import { cn } from '@/lib/format'

export function DocsModule() {
  const t = useT()
  const { docId } = useParams()
  const docs = useRecords('doc')
  const updateRecord = useKernel((s) => s.updateRecord)
  const navigate = useNavigate()
  const active = docs.find((d) => d.id === docId) ?? docs[0]

  useEffect(() => {
    if (active && !docId) navigate(`/docs/${active.id}`, { replace: true })
  }, [active, docId, navigate])

  return (
    <div className="flex h-full min-h-0 flex-col md:flex-row">
      <div className="flex gap-1 overflow-x-auto border-b border-line p-2 scrollbar-thin md:hidden">
        {docs.map((doc) => (
          <NavLink
            key={doc.id}
            to={`/docs/${doc.id}`}
            className={({ isActive }) =>
              cn('shrink-0 rounded-full px-3 py-1.5 text-sm', isActive && 'bg-bg-2 font-medium')
            }
          >
            {field(doc, 'emoji', '◈')} {doc.title}
          </NavLink>
        ))}
      </div>
      <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-line p-3 scrollbar-thin md:block">
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
        <article className="mx-auto w-full max-w-2xl overflow-y-auto px-4 py-6 scrollbar-thin md:px-10 md:py-10">
          <div className="text-4xl">{field(active, 'emoji', '◈')}</div>
          <input
            value={active.title}
            onChange={(e) => updateRecord(active.id, { title: e.target.value })}
            className="mt-4 w-full bg-transparent text-3xl font-semibold tracking-tight outline-none md:text-4xl"
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
