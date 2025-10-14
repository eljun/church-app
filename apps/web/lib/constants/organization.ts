/**
 * Organization Structure Constants
 * Defines the hierarchical structure of the organization
 */

export const COUNTRIES = [
  { value: 'Philippines', label: 'Philippines' },
] as const

export const FIELDS = [
  { value: 'Luzon', label: 'Luzon Field' },
  { value: 'Visayas', label: 'Visayas Field' },
  { value: 'Mindanao', label: 'Mindanao Field' },
] as const

export type Country = typeof COUNTRIES[number]['value']
export type Field = typeof FIELDS[number]['value']

export const EVENT_SCOPE_LABELS = {
  national: 'National (Country-wide)',
  field: 'Field Level',
  district: 'District Level',
  church: 'Church Level',
} as const

export type EventScope = keyof typeof EVENT_SCOPE_LABELS
