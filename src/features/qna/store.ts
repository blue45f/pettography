import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { parseTags } from './schema'

import type { QnaAnswer, QnaQuestion } from './schema'
import type { SpeciesCategory } from '@features/species'

interface AddQuestionInput {
  title: string
  body: string
  author: string
  speciesId?: string | null
  category?: SpeciesCategory | null
  tags?: string[]
}

interface AddAnswerInput {
  questionId: string
  body: string
  author: string
}

interface QnaState {
  questions: QnaQuestion[]
  answers: QnaAnswer[]
  votedQ: Record<string, true>
  votedA: Record<string, true>
  ownQ: Record<string, true>
  ownA: Record<string, true>
  lastAuthor: string
  seeded: boolean
  hydrateSeed: (questions: QnaQuestion[], answers: QnaAnswer[]) => void
  addQuestion: (input: AddQuestionInput) => QnaQuestion
  addAnswer: (input: AddAnswerInput) => QnaAnswer
  removeQuestion: (id: string) => void
  removeAnswer: (id: string) => void
  toggleVoteQuestion: (id: string) => boolean
  toggleVoteAnswer: (id: string) => boolean
  acceptAnswer: (questionId: string, answerId: string) => void
}

export const useQnaStore = create<QnaState>()(
  persist(
    (set, get) => ({
      questions: [],
      answers: [],
      votedQ: {},
      votedA: {},
      ownQ: {},
      ownA: {},
      lastAuthor: '',
      seeded: false,
      hydrateSeed: (questions, answers) => {
        if (get().seeded || get().questions.length > 0) return
        set({ questions, answers, seeded: true })
      },
      addQuestion: (input) => {
        const question: QnaQuestion = {
          id: crypto.randomUUID(),
          author: input.author,
          speciesId: input.speciesId ?? null,
          category: input.category ?? null,
          title: input.title,
          body: input.body,
          tags: input.tags ?? [],
          baseVotes: 0,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          questions: [question, ...state.questions],
          ownQ: { ...state.ownQ, [question.id]: true },
          lastAuthor: input.author,
        }))
        return question
      },
      addAnswer: (input) => {
        const answer: QnaAnswer = {
          id: crypto.randomUUID(),
          questionId: input.questionId,
          author: input.author,
          body: input.body,
          baseVotes: 0,
          accepted: false,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          answers: [...state.answers, answer],
          ownA: { ...state.ownA, [answer.id]: true },
          lastAuthor: input.author,
        }))
        return answer
      },
      removeQuestion: (id) =>
        set((state) => {
          if (!state.ownQ[id]) return {}
          const removedAnswerIds = new Set(
            state.answers.filter((a) => a.questionId === id).map((a) => a.id)
          )
          const nextVotedA = { ...state.votedA }
          const nextOwnA = { ...state.ownA }
          for (const answerId of removedAnswerIds) {
            delete nextVotedA[answerId]
            delete nextOwnA[answerId]
          }
          const nextVotedQ = { ...state.votedQ }
          delete nextVotedQ[id]
          const nextOwnQ = { ...state.ownQ }
          delete nextOwnQ[id]
          return {
            questions: state.questions.filter((q) => q.id !== id),
            answers: state.answers.filter((a) => a.questionId !== id),
            votedQ: nextVotedQ,
            votedA: nextVotedA,
            ownQ: nextOwnQ,
            ownA: nextOwnA,
          }
        }),
      removeAnswer: (id) =>
        set((state) => {
          if (!state.ownA[id]) return {}
          const nextVotedA = { ...state.votedA }
          delete nextVotedA[id]
          const nextOwnA = { ...state.ownA }
          delete nextOwnA[id]
          return {
            answers: state.answers.filter((a) => a.id !== id),
            votedA: nextVotedA,
            ownA: nextOwnA,
          }
        }),
      toggleVoteQuestion: (id) => {
        const voted = Boolean(get().votedQ[id])
        set((state) => {
          const questions = state.questions.map((q) =>
            q.id === id ? { ...q, baseVotes: Math.max(0, q.baseVotes + (voted ? -1 : 1)) } : q
          )
          const nextVoted = { ...state.votedQ }
          if (voted) delete nextVoted[id]
          else nextVoted[id] = true
          return { questions, votedQ: nextVoted }
        })
        return !voted
      },
      toggleVoteAnswer: (id) => {
        const voted = Boolean(get().votedA[id])
        set((state) => {
          const answers = state.answers.map((a) =>
            a.id === id ? { ...a, baseVotes: Math.max(0, a.baseVotes + (voted ? -1 : 1)) } : a
          )
          const nextVoted = { ...state.votedA }
          if (voted) delete nextVoted[id]
          else nextVoted[id] = true
          return { answers, votedA: nextVoted }
        })
        return !voted
      },
      acceptAnswer: (questionId, answerId) => {
        if (!get().ownQ[questionId]) return
        set((state) => {
          const target = state.answers.find((a) => a.id === answerId)
          if (!target || target.questionId !== questionId) return {}
          const turnOff = target.accepted
          const answers = state.answers.map((a) => {
            if (a.questionId !== questionId) return a
            return { ...a, accepted: turnOff ? false : a.id === answerId }
          })
          return { answers }
        })
      },
    }),
    {
      name: 'pettography.qna',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    }
  )
)

/** Resolved vote count for a question (currently the persisted base count). */
export function voteCountQ(question: QnaQuestion): number {
  return question.baseVotes
}

/** Resolved vote count for an answer. */
export function voteCountA(answer: QnaAnswer): number {
  return answer.baseVotes
}

/** All answers belonging to a question, accepted first then most-voted. */
export function answersFor(answers: readonly QnaAnswer[], questionId: string): QnaAnswer[] {
  return answers
    .filter((a) => a.questionId === questionId)
    .sort((a, b) => {
      if (a.accepted !== b.accepted) return a.accepted ? -1 : 1
      if (b.baseVotes !== a.baseVotes) return b.baseVotes - a.baseVotes
      return a.createdAt.localeCompare(b.createdAt)
    })
}

/** Whether the local visitor authored this question. */
export function isOwnQuestion(ownQ: Record<string, true>, id: string): boolean {
  return Boolean(ownQ[id])
}

/** Re-export for store consumers building tag lists from raw input. */
export { parseTags }
