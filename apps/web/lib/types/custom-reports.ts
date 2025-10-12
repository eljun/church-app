/**
 * Custom Reports Types
 * Type definitions for custom report builder
 */

export type ReportType = 'members' | 'transfers' | 'statistics'

export type MemberField =
  | 'full_name'
  | 'sp'
  | 'birthday'
  | 'age'
  | 'gender'
  | 'date_of_baptism'
  | 'baptized_by'
  | 'physical_condition'
  | 'illness_description'
  | 'spiritual_condition'
  | 'status'
  | 'church_name'
  | 'created_at'

export interface CustomReportFilters {
  church_id?: string
  status?: string[]
  spiritual_condition?: string[]
  physical_condition?: string[]
  gender?: string[]
  has_baptism_date?: boolean
  baptism_date_from?: string
  baptism_date_to?: string
  age_from?: number
  age_to?: number
  birthday_month?: number
}

export interface CustomReportConfig {
  reportType: ReportType
  fields: MemberField[]
  filters: CustomReportFilters
}

export interface MemberReportRow {
  id: string
  full_name?: string
  sp?: string | null
  birthday?: string
  age?: number
  gender?: string | null
  date_of_baptism?: string | null
  baptized_by?: string | null
  physical_condition?: string
  illness_description?: string | null
  spiritual_condition?: string
  status?: string
  church_name?: string
  created_at?: string
}

export const MEMBER_FIELD_LABELS: Record<MemberField, string> = {
  full_name: 'Full Name',
  sp: 'SP Number',
  birthday: 'Birthday',
  age: 'Age',
  gender: 'Gender',
  date_of_baptism: 'Date of Baptism',
  baptized_by: 'Baptized By',
  physical_condition: 'Physical Condition',
  illness_description: 'Illness Description',
  spiritual_condition: 'Spiritual Condition',
  status: 'Status',
  church_name: 'Church',
  created_at: 'Date Added',
}

export const REPORT_TEMPLATES: Record<string, CustomReportConfig> = {
  'active-members': {
    reportType: 'members',
    fields: ['full_name', 'age', 'gender', 'church_name', 'spiritual_condition'],
    filters: {
      status: ['active'],
      spiritual_condition: ['active'],
    },
  },
  'inactive-members': {
    reportType: 'members',
    fields: ['full_name', 'age', 'church_name', 'spiritual_condition', 'status'],
    filters: {
      status: ['active'],
      spiritual_condition: ['inactive'],
    },
  },
  'new-members': {
    reportType: 'members',
    fields: ['full_name', 'birthday', 'age', 'church_name', 'created_at'],
    filters: {
      status: ['active'],
    },
  },
  'gender-report': {
    reportType: 'members',
    fields: ['full_name', 'age', 'gender', 'church_name'],
    filters: {
      status: ['active'],
    },
  },
  'unbaptized': {
    reportType: 'members',
    fields: ['full_name', 'age', 'gender', 'church_name', 'spiritual_condition'],
    filters: {
      status: ['active'],
      has_baptism_date: false,
    },
  },
  'contact-directory': {
    reportType: 'members',
    fields: ['full_name', 'birthday', 'age', 'gender', 'church_name', 'sp'],
    filters: {
      status: ['active'],
    },
  },
}
