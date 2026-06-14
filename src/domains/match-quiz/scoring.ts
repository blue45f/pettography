import type {
  ActivityPattern,
  Difficulty,
  HandlingTolerance,
  SpaceNeed,
  Species,
} from '@domains/species'

export type ExperienceLevel = 'novice' | Difficulty
export type DifficultyAppetite = 'easy-only' | 'moderate' | 'any-challenge'
export type NoiseSensitivity = 'quiet-required' | 'tolerant' | 'no-preference'
export type LifespanCommitment = 'short' | 'medium' | 'long'

export interface QuizAnswers {
  experience: ExperienceLevel
  difficultyAppetite: DifficultyAppetite
  space: SpaceNeed
  handling: HandlingTolerance
  activity: ActivityPattern | 'no-preference'
  noiseSensitivity: NoiseSensitivity
  lifespanCommitment: LifespanCommitment
  budget: 'low' | 'medium' | 'high'
}

export interface QuizMatch {
  species: Species
  score: number
  breakdown: {
    experience: number
    difficultyAppetite: number
    space: number
    handling: number
    activity: number
    noise: number
    lifespan: number
    budget: number
  }
}

const DIFFICULTY_RANK: Record<Difficulty, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
}

const EXPERIENCE_RANK: Record<ExperienceLevel, number> = {
  novice: -1,
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

function scoreExperience(answer: ExperienceLevel, species: Difficulty): number {
  const gap = DIFFICULTY_RANK[species] - EXPERIENCE_RANK[answer]
  if (gap <= 0) return 30
  if (gap === 1) return answer === 'novice' ? 20 : 15
  if (gap === 2) return answer === 'novice' ? 5 : 0
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

const APPETITE_SCORE: Record<DifficultyAppetite, Record<Difficulty, number>> = {
  'easy-only': { beginner: 25, intermediate: 5, advanced: 0 },
  moderate: { beginner: 22, intermediate: 22, advanced: 8 },
  'any-challenge': { beginner: 18, intermediate: 22, advanced: 25 },
}

function scoreDifficultyAppetite(answer: DifficultyAppetite, species: Difficulty): number {
  return APPETITE_SCORE[answer][species]
}

const QUIET_TAGS = new Set(['저소음', '소음없음'])
const NOISY_TAGS = new Set(['음성모방', '사회성'])

function scoreNoise(answer: NoiseSensitivity, species: Species): number {
  const isQuiet =
    species.tags.some((tag) => QUIET_TAGS.has(tag)) ||
    (species.category !== 'bird' && species.category !== 'mammal')
  const isNoisy = species.tags.some((tag) => NOISY_TAGS.has(tag))
  switch (answer) {
    case 'quiet-required':
      if (isQuiet) return 15
      if (isNoisy) return 0
      return 8
    case 'tolerant':
      return 10
    case 'no-preference':
    default:
      return 10
  }
}

function scoreLifespan(answer: LifespanCommitment, species: Species): number {
  const max = species.lifespanMaxYears
  switch (answer) {
    case 'short':
      if (max <= 10) return 15
      if (max <= 20) return 7
      return 0
    case 'medium':
      if (max <= 7) return 6
      if (max <= 20) return 15
      return 8
    case 'long':
      if (max >= 20) return 15
      if (max >= 10) return 10
      return 4
  }
}

export function scoreSpecies(species: Species, answers: QuizAnswers): QuizMatch {
  const breakdown = {
    experience: scoreExperience(answers.experience, species.difficulty),
    difficultyAppetite: scoreDifficultyAppetite(answers.difficultyAppetite, species.difficulty),
    space: scoreSpace(answers.space, species.spaceNeed),
    handling: scoreHandling(answers.handling, species.handlingTolerance),
    activity: scoreActivity(answers.activity, species.activityPattern),
    noise: scoreNoise(answers.noiseSensitivity, species),
    lifespan: scoreLifespan(answers.lifespanCommitment, species),
    budget: scoreBudget(answers.budget, species),
  }
  const score =
    breakdown.experience +
    breakdown.difficultyAppetite +
    breakdown.space +
    breakdown.handling +
    breakdown.activity +
    breakdown.noise +
    breakdown.lifespan +
    breakdown.budget
  return { species, score, breakdown }
}

export function rankSpecies(speciesList: Species[], answers: QuizAnswers): QuizMatch[] {
  return speciesList.map((s) => scoreSpecies(s, answers)).sort((a, b) => b.score - a.score)
}
