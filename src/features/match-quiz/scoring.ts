import type {
  ActivityPattern,
  Difficulty,
  HandlingTolerance,
  SpaceNeed,
  Species,
} from '@features/species'

export interface QuizAnswers {
  experience: Difficulty
  space: SpaceNeed
  handling: HandlingTolerance
  activity: ActivityPattern | 'no-preference'
  budget: 'low' | 'medium' | 'high'
}

export interface QuizMatch {
  species: Species
  score: number
  breakdown: {
    experience: number
    space: number
    handling: number
    activity: number
    budget: number
  }
}

const DIFFICULTY_RANK: Record<Difficulty, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
}

const SPACE_RANK: Record<SpaceNeed, number> = {
  small: 0,
  medium: 1,
  large: 2,
}

const HANDLING_RANK: Record<HandlingTolerance, number> = {
  low: 0,
  medium: 1,
  high: 2,
}

function scoreExperience(answer: Difficulty, species: Difficulty): number {
  const gap = DIFFICULTY_RANK[species] - DIFFICULTY_RANK[answer]
  if (gap <= 0) return 30
  if (gap === 1) return 15
  return 0
}

function scoreSpace(answer: SpaceNeed, species: SpaceNeed): number {
  const gap = SPACE_RANK[species] - SPACE_RANK[answer]
  if (gap <= 0) return 25
  if (gap === 1) return 10
  return 0
}

function scoreHandling(answer: HandlingTolerance, species: HandlingTolerance): number {
  if (answer === species) return 20
  const diff = Math.abs(HANDLING_RANK[answer] - HANDLING_RANK[species])
  return diff === 1 ? 10 : 0
}

function scoreActivity(
  answer: ActivityPattern | 'no-preference',
  species: ActivityPattern
): number {
  if (answer === 'no-preference') return 12
  if (answer === species) return 15
  if (species === 'mixed') return 12
  return 4
}

function scoreBudget(answer: QuizAnswers['budget'], species: Species): number {
  const ceiling = { low: 25000, medium: 50000, high: Number.POSITIVE_INFINITY }[answer]
  if (species.monthlyBudgetKrw <= ceiling) return 10
  const over = species.monthlyBudgetKrw - ceiling
  if (over <= 15000) return 5
  return 0
}

export function scoreSpecies(species: Species, answers: QuizAnswers): QuizMatch {
  const breakdown = {
    experience: scoreExperience(answers.experience, species.difficulty),
    space: scoreSpace(answers.space, species.spaceNeed),
    handling: scoreHandling(answers.handling, species.handlingTolerance),
    activity: scoreActivity(answers.activity, species.activityPattern),
    budget: scoreBudget(answers.budget, species),
  }
  const score =
    breakdown.experience +
    breakdown.space +
    breakdown.handling +
    breakdown.activity +
    breakdown.budget
  return { species, score, breakdown }
}

export function rankSpecies(speciesList: Species[], answers: QuizAnswers): QuizMatch[] {
  return speciesList.map((s) => scoreSpecies(s, answers)).sort((a, b) => b.score - a.score)
}
