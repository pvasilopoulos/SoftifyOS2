export type Locale = 'el' | 'en'
export type Theme = 'dark' | 'light'
export type Density = 'comfortable' | 'compact'

export type RecordType =
  | 'company'
  | 'contact'
  | 'deal'
  | 'project'
  | 'task'
  | 'doc'
  | 'event'
  | 'inbox'
  | 'activity'

export type DealStage =
  | 'lead'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost'

export type TaskStatus = 'backlog' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export type RelationKind = Exclude<RecordType, 'activity' | 'inbox'>

export interface Relation {
  kind: RelationKind
  id: string
}

export interface SoftifyRecord {
  id: string
  type: RecordType
  title: string
  fields: Record<string, unknown>
  relations: Relation[]
  createdAt: string
  updatedAt: string
}

export interface Member {
  id: string
  name: string
  email: string
  role: string
  hue: number
}

export interface Org {
  id: string
  name: string
  plan: string
}

export interface Design {
  id: string
  moduleId: string
  name: string
  objectType: string | null
  kind: string | null
  isSystem: boolean
  isDefault: boolean
  schema: Record<string, unknown>
}

export const DEAL_STAGES: DealStage[] = [
  'lead',
  'qualified',
  'proposal',
  'negotiation',
  'won',
  'lost',
]

export const TASK_STATUSES: TaskStatus[] = [
  'backlog',
  'in_progress',
  'review',
  'done',
]

export function field(record: SoftifyRecord, key: string, fallback: string): string
export function field(record: SoftifyRecord, key: string, fallback: number): number
export function field<T>(record: SoftifyRecord, key: string, fallback: T): T
export function field(record: SoftifyRecord, key: string, fallback: unknown) {
  const value = record.fields[key]
  return value ?? fallback
}

export function relatedIds(record: SoftifyRecord, kind: RelationKind) {
  return record.relations.filter((rel) => rel.kind === kind).map((rel) => rel.id)
}
