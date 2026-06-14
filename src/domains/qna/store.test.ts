import { beforeEach, describe, expect, it } from 'vitest'

import { SEED_ANSWERS, SEED_QUESTIONS } from './data'
import { answersFor, isOwnQuestion, useQnaStore, voteCountA, voteCountQ } from './store'

const INITIAL = {
  questions: [],
  answers: [],
  votedQ: {},
  votedA: {},
  ownQ: {},
  ownA: {},
  lastAuthor: '',
  seeded: false,
}

beforeEach(() => {
  localStorage.clear()
  useQnaStore.setState(INITIAL, false)
})

describe('qna store — questions & answers', () => {
  it('adds a question, marks ownership, and prefills lastAuthor', () => {
    const q = useQnaStore.getState().addQuestion({
      title: '볼파이톤 거식',
      body: '한 달째 안 먹어요',
      author: '뱀집사',
      speciesId: 'sp-ball-python',
      category: 'reptile',
      tags: ['거식'],
    })
    const state = useQnaStore.getState()
    expect(state.questions).toHaveLength(1)
    expect(state.questions[0].id).toBe(q.id)
    expect(state.questions[0].baseVotes).toBe(0)
    expect(state.ownQ[q.id]).toBe(true)
    expect(isOwnQuestion(state.ownQ, q.id)).toBe(true)
    expect(state.lastAuthor).toBe('뱀집사')
  })

  it('adds an answer linked to a question and tracks ownership', () => {
    const q = useQnaStore.getState().addQuestion({ title: 'T', body: 'B', author: 'A' })
    const a = useQnaStore.getState().addAnswer({
      questionId: q.id,
      body: '이렇게 해보세요',
      author: '전문가',
    })
    const state = useQnaStore.getState()
    expect(state.answers).toHaveLength(1)
    expect(state.answers[0].questionId).toBe(q.id)
    expect(state.answers[0].accepted).toBe(false)
    expect(state.ownA[a.id]).toBe(true)
    expect(state.lastAuthor).toBe('전문가')
    expect(answersFor(state.answers, q.id)).toHaveLength(1)
  })
})

describe('qna store — voting', () => {
  it('toggles a question vote on and off', () => {
    const q = useQnaStore.getState().addQuestion({ title: 'T', body: 'B', author: 'A' })
    expect(voteCountQ(useQnaStore.getState().questions[0])).toBe(0)

    const on = useQnaStore.getState().toggleVoteQuestion(q.id)
    expect(on).toBe(true)
    expect(useQnaStore.getState().questions[0].baseVotes).toBe(1)
    expect(useQnaStore.getState().votedQ[q.id]).toBe(true)

    const off = useQnaStore.getState().toggleVoteQuestion(q.id)
    expect(off).toBe(false)
    expect(useQnaStore.getState().questions[0].baseVotes).toBe(0)
    expect(useQnaStore.getState().votedQ[q.id]).toBeUndefined()
  })

  it('toggles an answer vote on and off', () => {
    const q = useQnaStore.getState().addQuestion({ title: 'T', body: 'B', author: 'A' })
    const a = useQnaStore.getState().addAnswer({ questionId: q.id, body: 'x', author: 'B' })

    useQnaStore.getState().toggleVoteAnswer(a.id)
    expect(voteCountA(useQnaStore.getState().answers[0])).toBe(1)
    expect(useQnaStore.getState().votedA[a.id]).toBe(true)

    useQnaStore.getState().toggleVoteAnswer(a.id)
    expect(useQnaStore.getState().answers[0].baseVotes).toBe(0)
    expect(useQnaStore.getState().votedA[a.id]).toBeUndefined()
  })

  it('never lets a vote count go below zero', () => {
    useQnaStore.setState({ ...INITIAL, seeded: true }, false)
    useQnaStore.getState().hydrateSeed(SEED_QUESTIONS, SEED_ANSWERS)
    // seeded guard blocked it; seed manually for the floor check
    useQnaStore.setState(
      {
        questions: [{ ...SEED_QUESTIONS[0], baseVotes: 0 }],
        ownQ: { [SEED_QUESTIONS[0].id]: true },
      },
      false
    )
    const id = SEED_QUESTIONS[0].id
    // pretend the user had voted, so toggling removes a vote from a 0 floor
    useQnaStore.setState({ votedQ: { [id]: true } }, false)
    useQnaStore.getState().toggleVoteQuestion(id)
    expect(useQnaStore.getState().questions[0].baseVotes).toBe(0)
  })
})

describe('qna store — acceptAnswer', () => {
  it('accepts exactly one answer when the question owner accepts', () => {
    const q = useQnaStore.getState().addQuestion({ title: 'T', body: 'B', author: 'A' })
    const a1 = useQnaStore.getState().addAnswer({ questionId: q.id, body: '1', author: 'X' })
    const a2 = useQnaStore.getState().addAnswer({ questionId: q.id, body: '2', author: 'Y' })

    useQnaStore.getState().acceptAnswer(q.id, a1.id)
    let answers = useQnaStore.getState().answers
    expect(answers.find((a) => a.id === a1.id)?.accepted).toBe(true)
    expect(answers.find((a) => a.id === a2.id)?.accepted).toBe(false)

    // accepting a different answer is exclusive
    useQnaStore.getState().acceptAnswer(q.id, a2.id)
    answers = useQnaStore.getState().answers
    expect(answers.find((a) => a.id === a1.id)?.accepted).toBe(false)
    expect(answers.find((a) => a.id === a2.id)?.accepted).toBe(true)
  })

  it('toggles acceptance off when accepting the same answer twice', () => {
    const q = useQnaStore.getState().addQuestion({ title: 'T', body: 'B', author: 'A' })
    const a1 = useQnaStore.getState().addAnswer({ questionId: q.id, body: '1', author: 'X' })

    useQnaStore.getState().acceptAnswer(q.id, a1.id)
    expect(useQnaStore.getState().answers[0].accepted).toBe(true)
    useQnaStore.getState().acceptAnswer(q.id, a1.id)
    expect(useQnaStore.getState().answers[0].accepted).toBe(false)
  })

  it('does nothing when a non-owner tries to accept', () => {
    const q = useQnaStore.getState().addQuestion({ title: 'T', body: 'B', author: 'A' })
    const a1 = useQnaStore.getState().addAnswer({ questionId: q.id, body: '1', author: 'X' })
    // strip ownership to simulate a different visitor
    useQnaStore.setState({ ownQ: {} }, false)
    useQnaStore.getState().acceptAnswer(q.id, a1.id)
    expect(useQnaStore.getState().answers[0].accepted).toBe(false)
  })
})

describe('qna store — deletion', () => {
  it('removes a question and cascades its answers and vote maps', () => {
    const q = useQnaStore.getState().addQuestion({ title: 'T', body: 'B', author: 'A' })
    const other = useQnaStore.getState().addQuestion({ title: 'T2', body: 'B2', author: 'A' })
    const a1 = useQnaStore.getState().addAnswer({ questionId: q.id, body: '1', author: 'X' })
    useQnaStore.getState().addAnswer({ questionId: other.id, body: '2', author: 'Y' })
    useQnaStore.getState().toggleVoteAnswer(a1.id)

    useQnaStore.getState().removeQuestion(q.id)
    const state = useQnaStore.getState()
    expect(state.questions.map((x) => x.id)).toEqual([other.id])
    expect(state.answers.every((a) => a.questionId === other.id)).toBe(true)
    expect(state.votedA[a1.id]).toBeUndefined()
    expect(state.ownA[a1.id]).toBeUndefined()
    expect(state.ownQ[q.id]).toBeUndefined()
  })

  it('only removes a question the visitor owns', () => {
    const q = useQnaStore.getState().addQuestion({ title: 'T', body: 'B', author: 'A' })
    useQnaStore.setState({ ownQ: {} }, false)
    useQnaStore.getState().removeQuestion(q.id)
    expect(useQnaStore.getState().questions).toHaveLength(1)
  })

  it('only removes an answer the visitor owns', () => {
    const q = useQnaStore.getState().addQuestion({ title: 'T', body: 'B', author: 'A' })
    const a1 = useQnaStore.getState().addAnswer({ questionId: q.id, body: '1', author: 'X' })
    useQnaStore.setState({ ownA: {} }, false)
    useQnaStore.getState().removeAnswer(a1.id)
    expect(useQnaStore.getState().answers).toHaveLength(1)
  })
})

describe('qna store — hydrateSeed idempotency', () => {
  it('hydrates seed data only when the store is empty', () => {
    useQnaStore.getState().hydrateSeed(SEED_QUESTIONS, SEED_ANSWERS)
    expect(useQnaStore.getState().questions).toHaveLength(SEED_QUESTIONS.length)
    expect(useQnaStore.getState().answers).toHaveLength(SEED_ANSWERS.length)
    expect(useQnaStore.getState().seeded).toBe(true)

    // second call is a no-op even with different data
    useQnaStore.getState().hydrateSeed([], [])
    expect(useQnaStore.getState().questions).toHaveLength(SEED_QUESTIONS.length)
  })

  it('does not hydrate when questions already exist', () => {
    useQnaStore.getState().addQuestion({ title: 'T', body: 'B', author: 'A' })
    useQnaStore.getState().hydrateSeed(SEED_QUESTIONS, SEED_ANSWERS)
    expect(useQnaStore.getState().questions).toHaveLength(1)
  })

  it('seeds accepted answers correctly and answersFor pins them first', () => {
    useQnaStore.getState().hydrateSeed(SEED_QUESTIONS, SEED_ANSWERS)
    const list = answersFor(useQnaStore.getState().answers, 'seed-q-1')
    expect(list.length).toBeGreaterThan(1)
    expect(list[0].accepted).toBe(true)
  })
})
