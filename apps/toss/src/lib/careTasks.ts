/**
 * 종별 케어 체크리스트 태스크 파생.
 * 케어 가이드(careGuidesMock)가 있는 종은 가이드 섹션을, 없는 종은 종 정보
 * (환경/먹이/입문 팁/주의점)로 일반 태스크를 만들어요 — 전 종 커버, 서버 불필요.
 */
import { careGuidesMock } from '@app/domains/care-guides/mockData'

import type { Species } from './api'

export interface CareTask {
  id: string
  title: string
  detail: string
}

export function getCareTasks(species: Species): CareTask[] {
  const guide = careGuidesMock.find((g) => g.speciesId === species.id)
  const tasks: CareTask[] = guide
    ? guide.sections.map((section, i) => ({
        id: `guide-${i}`,
        title: section.title,
        detail: section.body,
      }))
    : [
        { id: 'env', title: '사육 환경 세팅', detail: species.environment },
        { id: 'diet', title: '먹이 루틴 준비', detail: species.diet },
      ]
  tasks.push(
    { id: 'tip', title: '입문 팁 숙지', detail: species.beginnerTip },
    { id: 'watch', title: '주의 신호 점검', detail: species.commonProblem }
  )
  return tasks
}

/** 완료 개수 / 전체 개수. */
export function getTaskProgress(
  species: Species,
  done: Record<string, boolean>
): { completed: number; total: number } {
  const tasks = getCareTasks(species)
  const completed = tasks.filter((task) => done[task.id]).length
  return { completed, total: tasks.length }
}
