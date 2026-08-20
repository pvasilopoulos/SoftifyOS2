import { useEffect } from 'react'
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CalendarModule } from '@/modules/calendar'
import { CrmCompanies, CrmContacts, CrmLayout, CrmPipeline } from '@/modules/crm'
import { DocsModule } from '@/modules/docs'
import { HomeModule } from '@/modules/home'
import { InboxModule } from '@/modules/inbox'
import { InsightsModule } from '@/modules/insights'
import { SettingsModule } from '@/modules/settings'
import { WorkBoard, WorkLayout } from '@/modules/work'
import { LoginScreen } from '@/shell/login'
import { OsShell } from '@/shell/os-shell'
import { useKernel } from '@/kernel/store'

export default function App() {
  const authenticated = useKernel((s) => s.authenticated)
  const theme = useKernel((s) => s.ui.theme)
  const density = useKernel((s) => s.ui.density)
  const locale = useKernel((s) => s.ui.locale)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.dataset.density = density
    document.documentElement.lang = locale
  }, [density, locale, theme])

  if (!authenticated) return <LoginScreen />

  return (
    <MemoryRouter>
      <Routes>
        <Route element={<OsShell />}>
          <Route index element={<HomeModule />} />
          <Route path="inbox" element={<InboxModule />} />
          <Route path="crm" element={<CrmLayout />}>
            <Route index element={<CrmPipeline />} />
            <Route path="companies" element={<CrmCompanies />} />
            <Route path="contacts" element={<CrmContacts />} />
          </Route>
          <Route path="work" element={<WorkLayout />}>
            <Route index element={<WorkBoard />} />
            <Route path=":projectId" element={<WorkBoard />} />
          </Route>
          <Route path="docs" element={<DocsModule />} />
          <Route path="docs/:docId" element={<DocsModule />} />
          <Route path="calendar" element={<CalendarModule />} />
          <Route path="insights" element={<InsightsModule />} />
          <Route path="settings" element={<SettingsModule />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}
