import { z } from 'zod'

export const routineCadenceSchema = z.enum(['daily', 'weekly', 'monthly'])
export type RoutineCadence = z.infer<typeof routineCadenceSchema>

export const ROUTINE_CADENCES: readonly RoutineCadence[] = ['daily', 'weekly', 'monthly'] as const

export const routineTaskSchema = z.object({
  id: z.string(),
  petId: z.string().nullable().optional(),
  label: z.string().min(1).max(60),
  cadence: routineCadenceSchema,
  category: z.string().optional(),
  builtIn: z.boolean().optional(),
})

export type RoutineTask = z.infer<typeof routineTaskSchema>

export const routineFormSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, 'routine.errors.labelRequired')
    .max(60, 'routine.errors.labelMax'),
  cadence: routineCadenceSchema,
})

export type RoutineFormValues = z.infer<typeof routineFormSchema>

export const BUILTIN_ROUTINES: Record<string, RoutineTask[]> = {
  reptile: [
    { id: 'reptile-uvb', label: 'UVB·보온등 점등 확인', cadence: 'daily', builtIn: true },
    { id: 'reptile-temp', label: '온도·습도 측정', cadence: 'daily', builtIn: true },
    { id: 'reptile-water', label: '식수·미스팅', cadence: 'daily', builtIn: true },
    { id: 'reptile-feed', label: '사료/곤충 급여', cadence: 'weekly', builtIn: true },
    { id: 'reptile-clean', label: '사육장 청소·배설물 제거', cadence: 'weekly', builtIn: true },
    { id: 'reptile-uvb-swap', label: 'UVB 램프 교체 점검', cadence: 'monthly', builtIn: true },
  ],
  amphibian: [
    { id: 'amphibian-temp', label: '수온·온도 측정', cadence: 'daily', builtIn: true },
    { id: 'amphibian-water', label: '식수·환수 점검', cadence: 'daily', builtIn: true },
    { id: 'amphibian-feed', label: '먹이 급여', cadence: 'weekly', builtIn: true },
    { id: 'amphibian-tank', label: '수조·바닥재 청소', cadence: 'weekly', builtIn: true },
  ],
  arthropod: [
    { id: 'arthropod-water', label: '미스팅·식수', cadence: 'daily', builtIn: true },
    { id: 'arthropod-feed', label: '먹이 (귀뚜라미·웜) 급여', cadence: 'weekly', builtIn: true },
    { id: 'arthropod-clean', label: '바닥재·배설물 정리', cadence: 'weekly', builtIn: true },
  ],
  bird: [
    { id: 'bird-water', label: '식수·먹이 보충', cadence: 'daily', builtIn: true },
    { id: 'bird-fly', label: '자유 비행 시간 (≥30분)', cadence: 'daily', builtIn: true },
    { id: 'bird-cage', label: '새장 청소', cadence: 'weekly', builtIn: true },
    { id: 'bird-vet', label: '발톱·부리 상태 점검', cadence: 'monthly', builtIn: true },
  ],
  mammal: [
    { id: 'mammal-water', label: '식수·사료 보충', cadence: 'daily', builtIn: true },
    { id: 'mammal-play', label: '교감·놀이 시간', cadence: 'daily', builtIn: true },
    { id: 'mammal-cage', label: '케이지·휠 청소', cadence: 'weekly', builtIn: true },
    { id: 'mammal-weight', label: '체중 측정', cadence: 'monthly', builtIn: true },
  ],
}
