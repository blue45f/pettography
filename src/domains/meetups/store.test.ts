import { beforeEach, describe, expect, it } from 'vitest'

import { SEED_MEETUPS, SEED_MENTORS } from './data'
import { attendeeCount, isFull, upcomingMeetups, type Meetup } from './schema'
import { useMeetupsStore } from './store'

const RESET = {
  meetups: [] as Meetup[],
  mentors: [],
  rsvpIds: {},
  ownMeetupIds: {},
  ownMentorIds: {},
  lastAuthor: '',
  seeded: false,
}

beforeEach(() => {
  localStorage.clear()
  useMeetupsStore.setState(RESET)
})

const makeMeetup = (over: Partial<Meetup> = {}): Meetup => ({
  id: 'm-1',
  title: '테스트 밋업',
  host: '호스트',
  region: 'songpa',
  datetime: new Date(Date.now() + 86_400_000).toISOString(),
  venue: '송파 카페',
  capacity: 10,
  description: '',
  baseAttendees: 3,
  createdAt: new Date().toISOString(),
  ...over,
})

describe('meetups store', () => {
  it('starts empty', () => {
    const s = useMeetupsStore.getState()
    expect(s.meetups).toHaveLength(0)
    expect(s.mentors).toHaveLength(0)
    expect(s.seeded).toBe(false)
  })

  it('hydrateSeed populates once and is idempotent', () => {
    useMeetupsStore.getState().hydrateSeed(SEED_MEETUPS, SEED_MENTORS)
    const first = useMeetupsStore.getState()
    expect(first.meetups).toHaveLength(SEED_MEETUPS.length)
    expect(first.mentors).toHaveLength(SEED_MENTORS.length)
    expect(first.seeded).toBe(true)

    // Second call must be a no-op even with different data.
    useMeetupsStore.getState().hydrateSeed([], [])
    const second = useMeetupsStore.getState()
    expect(second.meetups).toHaveLength(SEED_MEETUPS.length)
    expect(second.mentors).toHaveLength(SEED_MENTORS.length)
  })

  it('does not hydrate when meetups already exist', () => {
    useMeetupsStore.setState({ meetups: [makeMeetup()] })
    useMeetupsStore.getState().hydrateSeed(SEED_MEETUPS, SEED_MENTORS)
    expect(useMeetupsStore.getState().meetups).toHaveLength(1)
    expect(useMeetupsStore.getState().mentors).toHaveLength(0)
  })

  it('toggleRsvp adds then removes and returns the new state', () => {
    const m = makeMeetup()
    useMeetupsStore.setState({ meetups: [m] })

    const on = useMeetupsStore.getState().toggleRsvp(m.id)
    expect(on).toBe(true)
    expect(useMeetupsStore.getState().rsvpIds[m.id]).toBe(true)

    const off = useMeetupsStore.getState().toggleRsvp(m.id)
    expect(off).toBe(false)
    expect(useMeetupsStore.getState().rsvpIds[m.id]).toBeUndefined()
  })

  it('attendeeCount counts the local RSVP', () => {
    const m = makeMeetup({ baseAttendees: 5 })
    expect(attendeeCount(m, {})).toBe(5)
    expect(attendeeCount(m, { [m.id]: true })).toBe(6)
  })

  it('isFull reflects capacity including the local RSVP', () => {
    const m = makeMeetup({ baseAttendees: 9, capacity: 10 })
    expect(isFull(m, {})).toBe(false)
    expect(isFull(m, { [m.id]: true })).toBe(true)

    const atCap = makeMeetup({ baseAttendees: 10, capacity: 10 })
    expect(isFull(atCap, {})).toBe(true)
  })

  it('addMeetup prepends, marks ownership, sets baseAttendees 0, and stores lastAuthor', () => {
    const created = useMeetupsStore.getState().addMeetup({
      title: '새 밋업',
      host: '나',
      region: 'gangnam',
      datetime: new Date(Date.now() + 2 * 86_400_000).toISOString(),
      venue: '강남',
      capacity: 8,
      description: '설명',
    })
    const s = useMeetupsStore.getState()
    expect(s.meetups[0].id).toBe(created.id)
    expect(s.meetups[0].baseAttendees).toBe(0)
    expect(s.ownMeetupIds[created.id]).toBe(true)
    expect(s.lastAuthor).toBe('나')
  })

  it('removeMeetup deletes only own meetups and clears its RSVP', () => {
    const own = useMeetupsStore.getState().addMeetup({
      title: 'mine',
      host: '나',
      region: 'songpa',
      datetime: new Date(Date.now() + 86_400_000).toISOString(),
      venue: 'v',
      capacity: 5,
      description: '',
    })
    const foreign = makeMeetup({ id: 'foreign' })
    useMeetupsStore.setState((prev) => ({ meetups: [...prev.meetups, foreign] }))
    useMeetupsStore.getState().toggleRsvp(own.id)

    // Not owned -> no-op.
    useMeetupsStore.getState().removeMeetup('foreign')
    expect(useMeetupsStore.getState().meetups.some((m) => m.id === 'foreign')).toBe(true)

    // Owned -> removed, RSVP cleared.
    useMeetupsStore.getState().removeMeetup(own.id)
    const s = useMeetupsStore.getState()
    expect(s.meetups.some((m) => m.id === own.id)).toBe(false)
    expect(s.ownMeetupIds[own.id]).toBeUndefined()
    expect(s.rsvpIds[own.id]).toBeUndefined()
  })

  it('addMentor prepends, marks ownership, and stores lastAuthor', () => {
    const created = useMeetupsStore.getState().addMentor({
      name: '멘토나',
      focus: ['reptile', 'amphibian'],
      region: 'online',
      years: 4,
      bio: '소개',
      contact: 'a@b.com',
    })
    const s = useMeetupsStore.getState()
    expect(s.mentors[0].id).toBe(created.id)
    expect(s.mentors[0].focus).toEqual(['reptile', 'amphibian'])
    expect(s.ownMentorIds[created.id]).toBe(true)
    expect(s.lastAuthor).toBe('멘토나')
  })

  it('removeMentor deletes only own mentors', () => {
    const own = useMeetupsStore.getState().addMentor({
      name: '나',
      focus: ['bird'],
      region: 'jamsil',
      years: 2,
      bio: 'b',
      contact: 'c',
    })
    useMeetupsStore.setState((prev) => ({
      mentors: [...prev.mentors, { ...own, id: 'foreign-mentor' }],
    }))

    useMeetupsStore.getState().removeMentor('foreign-mentor')
    expect(useMeetupsStore.getState().mentors.some((m) => m.id === 'foreign-mentor')).toBe(true)

    useMeetupsStore.getState().removeMentor(own.id)
    const s = useMeetupsStore.getState()
    expect(s.mentors.some((m) => m.id === own.id)).toBe(false)
    expect(s.ownMentorIds[own.id]).toBeUndefined()
  })

  it('upcomingMeetups filters out past events and sorts ascending', () => {
    const now = Date.now()
    const past = makeMeetup({ id: 'past', datetime: new Date(now - 86_400_000).toISOString() })
    const soon = makeMeetup({ id: 'soon', datetime: new Date(now + 86_400_000).toISOString() })
    const later = makeMeetup({
      id: 'later',
      datetime: new Date(now + 5 * 86_400_000).toISOString(),
    })

    const result = upcomingMeetups([later, past, soon], now)
    expect(result.map((m) => m.id)).toEqual(['soon', 'later'])
  })
})
