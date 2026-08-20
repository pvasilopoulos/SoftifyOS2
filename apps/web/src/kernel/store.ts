import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import { api, getToken, setToken } from '@/kernel/api'
import { uid } from '@/lib/format'
import { CURRENT_USER_ID, DEMO_RECORDS, MEMBERS, ORG } from './demo-data'
import type {
  Density,
  Design,
  Locale,
  Member,
  Org,
  RecordType,
  Relation,
  SoftifyRecord,
  Theme,
} from './types'

export interface WorkspaceTab {
  id: string
  path: string
}

export interface UiState {
  theme: Theme
  locale: Locale
  density: Density
  booted: boolean
  commandOpen: boolean
  aiOpen: boolean
  inspectorId: string | null
  createType: RecordType | null
  multitabs: boolean
}

interface Bootstrap {
  user: Member & { orgId: string }
  org: Org
  members: Member[]
  records: SoftifyRecord[]
  layouts: Design[]
  views: Design[]
  forms: Design[]
}

interface KernelState {
  authenticated: boolean
  hydrating: boolean
  org: Org
  members: Member[]
  currentUserId: string
  records: SoftifyRecord[]
  layouts: Design[]
  views: Design[]
  forms: Design[]
  activeViews: Record<string, string>
  tabs: WorkspaceTab[]
  activeTabId: string
  ui: UiState
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  hydrate: () => Promise<boolean>
  boot: () => void
  setTheme: (theme: Theme) => void
  setLocale: (locale: Locale) => void
  setDensity: (density: Density) => void
  setMultitabs: (multitabs: boolean) => void
  setCommandOpen: (open: boolean) => void
  setAiOpen: (open: boolean) => void
  toggleAi: () => void
  openInspector: (id: string | null) => void
  setCreateType: (type: RecordType | null) => void
  setActiveView: (moduleId: string, viewId: string) => void
  openTab: (path: string, currentPath?: string) => void
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  syncTabPath: (path: string) => void
  createRecord: (input: {
    type: RecordType
    title: string
    fields?: Record<string, unknown>
    relations?: Relation[]
  }) => SoftifyRecord
  updateRecord: (id: string, patch: Partial<Pick<SoftifyRecord, 'title' | 'fields'>>) => void
  patchFields: (id: string, fields: Record<string, unknown>) => void
  saveDesign: (table: 'layouts' | 'views' | 'forms', item: Partial<Design> & { schema: Record<string, unknown> }) => Promise<Design>
  deleteDesign: (table: 'layouts' | 'views' | 'forms', id: string) => Promise<void>
  resetDemo: () => void
}

function newTab(path: string): WorkspaceTab {
  return { id: uid('tab'), path }
}

const firstTab = newTab('/')

const defaultUi: UiState = {
  theme: 'dark',
  locale: 'el',
  density: 'comfortable',
  booted: false,
  commandOpen: false,
  aiOpen: false,
  inspectorId: null,
  createType: null,
  multitabs: false,
}

function applyBootstrap(data: Bootstrap) {
  const activeViews: Record<string, string> = {}
  for (const view of data.views) {
    if (view.isDefault) activeViews[view.moduleId] = view.id
  }
  return {
    authenticated: true,
    org: data.org,
    members: data.members,
    currentUserId: data.user.id,
    records: data.records,
    layouts: data.layouts,
    views: data.views,
    forms: data.forms,
    activeViews,
  }
}

export const useKernel = create<KernelState>()(
  persist(
    (set, get) => ({
      authenticated: false,
      hydrating: Boolean(getToken()),
      org: ORG,
      members: MEMBERS,
      currentUserId: CURRENT_USER_ID,
      records: DEMO_RECORDS,
      layouts: [],
      views: [],
      forms: [],
      activeViews: {},
      tabs: [firstTab],
      activeTabId: firstTab.id,
      ui: defaultUi,
      login: async (username, password) => {
        try {
          const data = await api<{ token: string }>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
          })
          setToken(data.token)
          const boot = await api<Bootstrap>('/api/bootstrap')
          const tab = newTab('/')
          set((s) => ({
            ...applyBootstrap(boot),
            hydrating: false,
            tabs: [tab],
            activeTabId: tab.id,
            ui: { ...s.ui, booted: false, commandOpen: false, inspectorId: null, createType: null },
          }))
          return true
        } catch {
          setToken(null)
          return false
        }
      },
      logout: () => {
        const token = getToken()
        if (token) void api('/api/auth/logout', { method: 'POST' }).catch(() => undefined)
        setToken(null)
        set((s) => ({
          authenticated: false,
          hydrating: false,
          ui: { ...s.ui, booted: false, commandOpen: false, inspectorId: null, createType: null },
        }))
      },
      hydrate: async () => {
        if (!getToken()) {
          if (get().hydrating || get().authenticated) {
            set({ hydrating: false, authenticated: false })
          }
          return false
        }
        try {
          const boot = await api<Bootstrap>('/api/bootstrap')
          set({ ...applyBootstrap(boot), hydrating: false })
          return true
        } catch {
          setToken(null)
          set({ hydrating: false, authenticated: false })
          return false
        }
      },
      boot: () => set((s) => ({ ui: { ...s.ui, booted: true } })),
      setTheme: (theme) => set((s) => ({ ui: { ...s.ui, theme } })),
      setLocale: (locale) => set((s) => ({ ui: { ...s.ui, locale } })),
      setDensity: (density) => set((s) => ({ ui: { ...s.ui, density } })),
      setMultitabs: (multitabs) =>
        set((s) => {
          const tab = s.tabs[0] ?? newTab('/')
          return {
            ui: { ...s.ui, multitabs },
            tabs: multitabs ? s.tabs : [tab],
            activeTabId: multitabs ? s.activeTabId : tab.id,
          }
        }),
      setCommandOpen: (commandOpen) => set((s) => ({ ui: { ...s.ui, commandOpen } })),
      setAiOpen: (aiOpen) => set((s) => ({ ui: { ...s.ui, aiOpen } })),
      toggleAi: () => set((s) => ({ ui: { ...s.ui, aiOpen: !s.ui.aiOpen } })),
      openInspector: (inspectorId) => set((s) => ({ ui: { ...s.ui, inspectorId } })),
      setCreateType: (createType) => set((s) => ({ ui: { ...s.ui, createType } })),
      setActiveView: (moduleId, viewId) =>
        set((s) => ({ activeViews: { ...s.activeViews, [moduleId]: viewId } })),
      openTab: (path, currentPath) => {
        const tab = newTab(path)
        set((s) => ({
          ui: { ...s.ui, multitabs: true },
          tabs: [
            ...s.tabs.map((item) =>
              currentPath && item.id === s.activeTabId ? { ...item, path: currentPath } : item,
            ),
            tab,
          ],
          activeTabId: tab.id,
        }))
      },
      closeTab: (id) =>
        set((s) => {
          const remaining = s.tabs.filter((tab) => tab.id !== id)
          const tabs = remaining.length ? remaining : [newTab('/')]
          const activeTabId = s.activeTabId === id ? tabs[tabs.length - 1]!.id : s.activeTabId
          return { tabs, activeTabId }
        }),
      setActiveTab: (activeTabId) => set({ activeTabId }),
      syncTabPath: (path) =>
        set((s) => {
          const current = s.tabs.find((tab) => tab.id === s.activeTabId)
          if (current?.path === path) return s
          return {
            tabs: s.tabs.map((tab) => (tab.id === s.activeTabId ? { ...tab, path } : tab)),
          }
        }),
      createRecord: (input) => {
        const record: SoftifyRecord = {
          id: uid(input.type.slice(0, 2)),
          type: input.type,
          title: input.title,
          fields: input.fields ?? {},
          relations: input.relations ?? [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((s) => ({
          records: [record, ...s.records],
          ui: { ...s.ui, createType: null, inspectorId: record.id },
        }))
        void api<{ record: SoftifyRecord }>('/api/records', {
          method: 'POST',
          body: JSON.stringify(record),
        })
          .then((data) =>
            set((s) => ({
              records: s.records.map((item) => (item.id === record.id ? data.record : item)),
              ui: { ...s.ui, inspectorId: data.record.id },
            })),
          )
          .catch(() => undefined)
        return record
      },
      updateRecord: (id, patch) => {
        set((s) => ({
          records: s.records.map((record) =>
            record.id === id
              ? {
                  ...record,
                  ...patch,
                  fields: patch.fields ? { ...record.fields, ...patch.fields } : record.fields,
                  updatedAt: new Date().toISOString(),
                }
              : record,
          ),
        }))
        const current = get().records.find((record) => record.id === id)
        void api(`/api/records/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ title: current?.title, fields: patch.fields ?? current?.fields }),
        }).catch(() => undefined)
      },
      patchFields: (id, fields) => get().updateRecord(id, { fields }),
      saveDesign: async (table, item) => {
        const path = item.id ? `/api/${table}/${item.id}` : `/api/${table}`
        const data = await api<{ item: Design }>(path, {
          method: item.id ? 'PATCH' : 'POST',
          body: JSON.stringify({
            id: item.id,
            name: item.name,
            moduleId: item.moduleId,
            objectType: item.objectType,
            kind: item.kind,
            isDefault: item.isDefault,
            schema: item.schema,
          }),
        })
        set((s) => {
          const list = s[table]
          const exists = list.some((row) => row.id === data.item.id)
          return { [table]: exists ? list.map((row) => (row.id === data.item.id ? data.item : row)) : [data.item, ...list] }
        })
        return data.item
      },
      deleteDesign: async (table, id) => {
        await api(`/api/${table}/${id}`, { method: 'DELETE' })
        set((s) => ({ [table]: s[table].filter((row) => row.id !== id) }))
      },
      resetDemo: () => void get().hydrate(),
    }),
    {
      name: 'softifyos-kernel',
      version: 4,
      partialize: (state) => ({
        ui: {
          theme: state.ui.theme,
          locale: state.ui.locale,
          density: state.ui.density,
          multitabs: state.ui.multitabs,
        },
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<KernelState> | undefined
        return {
          ...current,
          ui: {
            ...current.ui,
            ...(p?.ui ?? {}),
            booted: false,
            commandOpen: false,
            inspectorId: null,
            createType: null,
            aiOpen: false,
          },
        }
      },
    },
  ),
)

export function useRecords(type?: RecordType) {
  return useKernel(
    useShallow((s) => (type ? s.records.filter((record) => record.type === type) : s.records)),
  )
}

export function useModuleViews(moduleId: string) {
  return useKernel(useShallow((s) => s.views.filter((view) => view.moduleId === moduleId)))
}

export function useRecord(id: string | null) {
  return useKernel((s) => s.records.find((record) => record.id === id) ?? null)
}

export function useMember(id: string | undefined | null) {
  return useKernel((s) => s.members.find((member) => member.id === id) ?? null)
}

export function useCurrentUser() {
  return useKernel((s) => s.members.find((member) => member.id === s.currentUserId) ?? s.members[0]!)
}
