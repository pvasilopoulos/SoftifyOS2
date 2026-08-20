import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid } from '@/lib/format'
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

export interface UiState {
  theme: Theme
  locale: Locale
  density: Density
  booted: boolean
  commandOpen: boolean
  aiOpen: boolean
  inspectorId: string | null
  createType: RecordType | null
}

interface KernelState {
  org: Org
  members: Member[]
  currentUserId: string
  records: SoftifyRecord[]
  ui: UiState
  boot: () => void
  setTheme: (theme: Theme) => void
  setLocale: (locale: Locale) => void
  setDensity: (density: Density) => void
  setCommandOpen: (open: boolean) => void
  setAiOpen: (open: boolean) => void
  toggleAi: () => void
  openInspector: (id: string | null) => void
  setCreateType: (type: RecordType | null) => void
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

const defaultUi: UiState = {
  theme: 'dark',
  locale: 'el',
  density: 'comfortable',
  booted: false,
  commandOpen: false,
  aiOpen: true,
  inspectorId: null,
  createType: null,
}

export const useKernel = create<KernelState>()(
  persist(
    (set, get) => ({
      org: ORG,
      members: MEMBERS,
      currentUserId: CURRENT_USER_ID,
      records: DEMO_RECORDS,
      ui: defaultUi,
      boot: () => set((s) => ({ ui: { ...s.ui, booted: true } })),
      setTheme: (theme) => set((s) => ({ ui: { ...s.ui, theme } })),
      setLocale: (locale) => set((s) => ({ ui: { ...s.ui, locale } })),
      setDensity: (density) => set((s) => ({ ui: { ...s.ui, density } })),
      setCommandOpen: (commandOpen) => set((s) => ({ ui: { ...s.ui, commandOpen } })),
      setAiOpen: (aiOpen) => set((s) => ({ ui: { ...s.ui, aiOpen } })),
      toggleAi: () => set((s) => ({ ui: { ...s.ui, aiOpen: !s.ui.aiOpen } })),
      openInspector: (inspectorId) => set((s) => ({ ui: { ...s.ui, inspectorId } })),
      setCreateType: (createType) => set((s) => ({ ui: { ...s.ui, createType } })),
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
      version: 1,
      partialize: (state) => ({
        records: state.records,
        ui: {
          theme: state.ui.theme,
          locale: state.ui.locale,
          density: state.ui.density,
          aiOpen: state.ui.aiOpen,
        },
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<KernelState> | undefined
        return {
          ...current,
          records: p?.records ?? current.records,
          ui: {
            ...current.ui,
            ...(p?.ui ?? {}),
            booted: false,
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
