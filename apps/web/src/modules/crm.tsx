import { NavLink, Outlet } from 'react-router-dom'
import { useT } from '@/i18n'
import { useKernel } from '@/kernel/store'
import { DEAL_STAGES, field } from '@/kernel/types'
import { cn, formatCurrency, formatDate } from '@/lib/format'
import { Kanban } from '@/ui/kanban'
import { Avatar, Badge, Surface } from '@/ui/primitives'
import { ViewCanvas } from '@/ui/view-canvas'

export function CrmLayout() {
  const t = useT()
  const views = useKernel((s) => s.views.filter((view) => view.moduleId === 'crm'))
  const activeId = useKernel((s) => s.activeViews.crm)
  const setActiveView = useKernel((s) => s.setActiveView)
  const view = views.find((item) => item.id === activeId) ?? views[0]
  const tabs = [
    { to: '/crm', label: t.crm.pipeline, end: true },
    { to: '/crm/companies', label: t.crm.companies },
    { to: '/crm/contacts', label: t.crm.contacts },
  ]
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-1 px-6 pt-4">
        {views.length
          ? views.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveView('crm', item.id)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-sm text-muted hover:text-ink',
                  view?.id === item.id && 'bg-bg-2 text-ink',
                )}
              >
                {item.name}
              </button>
            ))
          : tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-3 py-1.5 text-sm text-muted hover:text-ink',
                    isActive && 'bg-bg-2 text-ink',
                  )
                }
              >
                {tab.label}
              </NavLink>
            ))}
        <NavLink to="/studio/views" className="ml-auto text-xs text-accent hover:underline">
          Studio
        </NavLink>
      </div>
      <div className="min-h-0 flex-1 p-4">{view ? <ViewCanvas view={view} /> : <Outlet />}</div>
    </div>
  )
}

export function CrmPipeline() {
  const t = useT()
  const locale = useKernel((s) => s.ui.locale)
  const deals = useKernel((s) => s.records.filter((r) => r.type === 'deal'))
  const members = useKernel((s) => s.members)
  const patchFields = useKernel((s) => s.patchFields)
  const openInspector = useKernel((s) => s.openInspector)
  const columns = DEAL_STAGES.map((stage) => ({
    id: stage,
    title: t.stages[stage],
    tone:
      stage === 'won'
        ? 'var(--ok)'
        : stage === 'lost'
          ? 'var(--danger)'
          : stage === 'negotiation'
            ? 'var(--accent)'
            : 'var(--muted)',
  }))

  return (
    <div className="h-full min-h-[520px]">
      <Kanban
        columns={columns}
        items={deals}
        columnOf={(item) => field(item, 'stage', 'lead')}
        onMove={(id, columnId) => patchFields(id, { stage: columnId })}
        renderCard={(deal) => {
          const owner = members.find((m) => m.id === field(deal, 'ownerId', ''))
          return (
            <button
              type="button"
              onClick={() => openInspector(deal.id)}
              className="w-full rounded-xl border border-line bg-bg-1 p-3 text-left shadow-sm transition hover:border-line-strong"
            >
              <div className="text-sm font-medium leading-snug">{deal.title}</div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted">
                <span>{formatCurrency(field(deal, 'amount', 0), locale)}</span>
                {owner ? <Avatar name={owner.name} hue={owner.hue} size="sm" /> : null}
              </div>
              <div className="mt-2 text-[11px] text-faint">
                {formatDate(field(deal, 'closeDate', deal.updatedAt), locale)}
              </div>
            </button>
          )
        }}
      />
    </div>
  )
}

export function CrmCompanies() {
  const t = useT()
  const companies = useKernel((s) => s.records.filter((r) => r.type === 'company'))
  const openInspector = useKernel((s) => s.openInspector)
  return (
    <Surface className="overflow-hidden">
      <table className="w-full text-sm">
        <thead className="text-left text-[11px] uppercase tracking-wider text-faint">
          <tr className="border-b border-line">
            <th className="px-4 py-3 font-medium">{t.crm.companies}</th>
            <th className="px-4 py-3 font-medium">{t.crm.industry}</th>
            <th className="px-4 py-3 font-medium">{t.crm.health}</th>
            <th className="px-4 py-3 font-medium">City</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => (
            <tr
              key={company.id}
              onClick={() => openInspector(company.id)}
              className="cursor-pointer border-b border-line last:border-0 hover:bg-bg-2/60"
            >
              <td className="px-4 py-3 font-medium">{company.title}</td>
              <td className="px-4 py-3 text-muted">{field(company, 'industry', '')}</td>
              <td className="px-4 py-3">
                <Health health={field(company, 'health', 'ok')} />
              </td>
              <td className="px-4 py-3 text-muted">{field(company, 'city', '')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Surface>
  )
}

export function CrmContacts() {
  const records = useKernel((s) => s.records)
  const openInspector = useKernel((s) => s.openInspector)
  const contacts = records.filter((r) => r.type === 'contact')
  return (
    <Surface className="overflow-hidden">
      <table className="w-full text-sm">
        <thead className="text-left text-[11px] uppercase tracking-wider text-faint">
          <tr className="border-b border-line">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Company</th>
            <th className="px-4 py-3 font-medium">Email</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => {
            const company = records.find((r) => r.id === contact.relations.find((rel) => rel.kind === 'company')?.id)
            return (
              <tr
                key={contact.id}
                onClick={() => openInspector(contact.id)}
                className="cursor-pointer border-b border-line last:border-0 hover:bg-bg-2/60"
              >
                <td className="px-4 py-3 font-medium">{contact.title}</td>
                <td className="px-4 py-3 text-muted">{field(contact, 'role', '')}</td>
                <td className="px-4 py-3 text-muted">{company?.title}</td>
                <td className="px-4 py-3 text-muted">{field(contact, 'email', '')}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Surface>
  )
}

function Health({ health }: { health: string }) {
  const tone = health === 'strong' ? 'ok' : health === 'risk' ? 'danger' : 'muted'
  return <Badge tone={tone}>{health}</Badge>
}
