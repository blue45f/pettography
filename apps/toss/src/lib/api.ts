// 데이터와 타입을 본 서비스(루트 web app)에서 그대로 재사용 — 복사/재선언 금지.
import { speciesMock } from '@app/domains/species/mockData'

import type { Species } from '@app/domains/species/schema'

export type { Species }
export function getSpecies(): Species[] {
  return speciesMock
}
export function getSpeciesBySlug(slug: string): Species | undefined {
  return speciesMock.find((s) => s.slug === slug || s.id === slug)
}

export const CATEGORY_LABEL: Record<string, string> = {
  reptile: '파충류',
  amphibian: '양서류',
  arthropod: '절지류',
  invertebrate: '무척추',
  fish: '관상어',
  mammal: '포유류',
  smallMammal: '소형 포유류',
  bird: '조류',
}
export const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: '입문',
  intermediate: '중급',
  advanced: '고급',
}
export const SPACE_LABEL: Record<string, string> = { small: '소형', medium: '중형', large: '대형' }
export const ACTIVITY_LABEL: Record<string, string> = {
  nocturnal: '야행성',
  diurnal: '주행성',
  crepuscular: '박명박모',
}
export const won = (n: number) => '₩' + n.toLocaleString('ko-KR')
