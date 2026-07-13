import type { RegistryFiling } from '@pettography/shared'

export { registryFilingSchema } from '@pettography/shared'
export type { RegistryFiling } from '@pettography/shared'

export const REGISTRY_FILINGS: readonly RegistryFiling[] = [
  'keeping',
  'transfer',
  'death',
  'microchip',
] as const

export const REGULATED_CATEGORIES = ['reptile', 'amphibian', 'bird', 'mammal'] as const
export type RegulatedCategory = (typeof REGULATED_CATEGORIES)[number]

export function isRegulated(category: string | null | undefined): category is RegulatedCategory {
  return !!category && (REGULATED_CATEGORIES as readonly string[]).includes(category)
}

export const REGISTRY_LINKS = {
  wildlifeRegistry: 'https://www.wildlife.go.kr/',
  animalRegistry: 'https://www.animal.go.kr/',
  envMinistry: 'https://www.me.go.kr/',
  law: 'https://www.law.go.kr/법령/야생생물보호및관리에관한법률',
} as const
