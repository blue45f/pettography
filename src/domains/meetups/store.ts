import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { SEED_MEETUPS, SEED_MENTORS } from './data'

import type { Meetup, MeetupRegion, Mentor } from './schema'
import type { SpeciesCategory } from '@domains/species'

interface MeetupsState {
  meetups: Meetup[]
  mentors: Mentor[]
  rsvpIds: Record<string, true>
  ownMeetupIds: Record<string, true>
  ownMentorIds: Record<string, true>
  lastAuthor: string
  seeded: boolean
  hydrateSeed: (meetups: Meetup[], mentors: Mentor[]) => void
  addMeetup: (input: {
    title: string
    host: string
    region: MeetupRegion
    datetime: string
    venue: string
    capacity: number
    description: string
  }) => Meetup
  removeMeetup: (id: string) => void
  toggleRsvp: (id: string) => boolean
  addMentor: (input: {
    name: string
    focus: SpeciesCategory[]
    region: MeetupRegion
    years: number
    bio: string
    contact: string
  }) => Mentor
  removeMentor: (id: string) => void
}

export const useMeetupsStore = create<MeetupsState>()(
  persist(
    (set, get) => ({
      meetups: [],
      mentors: [],
      rsvpIds: {},
      ownMeetupIds: {},
      ownMentorIds: {},
      lastAuthor: '',
      seeded: false,
      hydrateSeed: (meetups, mentors) => {
        if (get().seeded || get().meetups.length > 0 || get().mentors.length > 0) return
        set({ meetups, mentors, seeded: true })
      },
      addMeetup: (input) => {
        const meetup: Meetup = {
          id: crypto.randomUUID(),
          title: input.title,
          host: input.host,
          region: input.region,
          datetime: new Date(input.datetime).toISOString(),
          venue: input.venue,
          capacity: input.capacity,
          description: input.description,
          baseAttendees: 0,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          meetups: [meetup, ...state.meetups],
          ownMeetupIds: { ...state.ownMeetupIds, [meetup.id]: true },
          lastAuthor: input.host,
        }))
        return meetup
      },
      removeMeetup: (id) =>
        set((state) => {
          if (!state.ownMeetupIds[id]) return {}
          const nextOwn = { ...state.ownMeetupIds }
          delete nextOwn[id]
          const nextRsvp = { ...state.rsvpIds }
          delete nextRsvp[id]
          return {
            meetups: state.meetups.filter((m) => m.id !== id),
            ownMeetupIds: nextOwn,
            rsvpIds: nextRsvp,
          }
        }),
      toggleRsvp: (id) => {
        const next = !get().rsvpIds[id]
        set((state) => {
          const rsvpIds = { ...state.rsvpIds }
          if (next) rsvpIds[id] = true
          else delete rsvpIds[id]
          return { rsvpIds }
        })
        return next
      },
      addMentor: (input) => {
        const mentor: Mentor = {
          id: crypto.randomUUID(),
          name: input.name,
          focus: input.focus,
          region: input.region,
          years: input.years,
          bio: input.bio,
          contact: input.contact,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          mentors: [mentor, ...state.mentors],
          ownMentorIds: { ...state.ownMentorIds, [mentor.id]: true },
          lastAuthor: input.name,
        }))
        return mentor
      },
      removeMentor: (id) =>
        set((state) => {
          if (!state.ownMentorIds[id]) return {}
          const nextOwn = { ...state.ownMentorIds }
          delete nextOwn[id]
          return {
            mentors: state.mentors.filter((m) => m.id !== id),
            ownMentorIds: nextOwn,
          }
        }),
    }),
    {
      name: 'pettography.meetups',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export { SEED_MEETUPS, SEED_MENTORS }
