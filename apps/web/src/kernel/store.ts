import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid } from '@/lib/format'
import { verifyLogin } from './auth'
import { CURRENT_USER_ID, DEMO_RECORDS, MEMBERS, ORG } from './demo-data'
import type {
  Density,
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

interface KernelState {
  authenticated: boolean
  org: Org
  members: Member[]
  currentUserId: string
  records: SoftifyRecord[]
  tabs: WorkspaceTab[]
  activeTabId: string
  ui: UiState
  login: (username: string, password: string) => boolean
  logout: () => void
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
  openTab: (path: string) => void
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
  aiOpen: true,
  inspectorId: null,
  createType: null,
  multitabs: false,
}

export const useKernel = create<KernelState>()(
  persist(
    (set, get) => ({
      authenticated: false,
      org: ORG,
      members: MEMBERS,
      currentUserId: CURRENT_USER_ID,
      records: DEMO_RECORDS,
      tabs: [firstTab],
      activeTabId: firstTab.id,
      ui: defaultUi,
      login: (username, password) => {
        if (!verifyLogin(username, password)) return false
        const tab = newTab('/')
        set((s) => ({
          authenticated: true,
          tabs: [tab],
          activeTabId: tab.id,
          ui: { ...s.ui, booted: false, commandOpen: false, inspectorId: null, createType: null },
        }))
        return true
      },
      logout: () =>
        set((s) => ({
          authenticated: false,
          ui: { ...s.ui, booted: false, commandOpen: false, inspectorId: null, createType: null },
        })),
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
      openTab: (path) => {
        const tab = newTab(path)
        set((s) => ({ tabs: [...s.tabs, tab], activeTabId: tab.id }))
      },
      closeTab: (id) =>
        set((s) => {
          const remaining = s.tabs.filter((tab) => tab.id !== id)
          const tabs = remaining.length ? remaining : [newTab('/')]
          const activeTabId =
            s.activeTabId === id ? tabs[tabs.length - 1]!.id : s.activeTabId
          return { tabs, activeTabId }
        }),
      setActiveTab: (activeTabId) => set({ activeTabId }),
      syncTabPath: (path) =>
        set((s) => ({
          tabs: s.tabs.map((tab) => (tab.id === s.activeTabId ? { ...tab, path } : tab)),
        })),
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
        return record
      },
      updateRecord: (id, patch) =>
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
        })),
      patchFields: (id, fields) => get().updateRecord(id, { fields }),
      resetDemo: () =>
        set({
          records: DEMO_RECORDS,
          ui: { ...get().ui, inspectorId: null, createType: null },
        }),
    }),
    {
      name: 'softifyos-kernel',
      version: 2,
      partialize: (state) => ({
        authenticated: state.authenticated,
        records: state.records,
        ui: {
          theme: state.ui.theme,
          locale: state.ui.locale,
          density: state.ui.density,
          aiOpen: state.ui.aiOpen,
          multitabs: state.ui.multitabs,
        },
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<KernelState> | undefined
        const authenticated = p?.authenticated ?? false
        return {
          ...current,
          authenticated,
          records: p?.records ?? current.records,
          ui: {
            ...current.ui,
            ...(p?.ui ?? {}),
            booted: authenticated,
            commandOpen: false,
            inspectorId: null,
            createType: null,
          },
        }
      },
    },
  ),
)

export function useRecords(type?: RecordType) {
  return useKernel((s) =>
    type ? s.records.filter((record) => record.type === type) : s.records,
  )
}

export function useRecord(id: string | null) {
  return useKernel((s) => s.records.find((record) => record.id === id) ?? null)
}

export function useMember(id: string | undefined | null) {
  return useKernel((s) => s.members.find((member) => member.id === id) ?? null)
}

export function useCurrentUser() {
  return useKernel((s) => s.members.find((member) => member.id === s.currentUserId)!)
}
