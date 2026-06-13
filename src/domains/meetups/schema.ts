import { speciesCategorySchema } from '@domains/species'
import { z } from 'zod'

export const MEETUP_REGIONS = ['songpa', 'gangnam', 'jamsil', 'online', 'other'] as const
export type MeetupRegion = (typeof MEETUP_REGIONS)[number]
export const meetupRegionSchema = z.enum(MEETUP_REGIONS)

export const meetupSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(80),
  host: z.string().min(1).max(40),
  region: meetupRegionSchema,
  datetime: z.string(),
  venue: z.string().min(1).max(80),
  capacity: z.number().int().min(2).max(200),
  description: z.string().max(500),
  baseAttendees: z.number().int().nonnegative(),
  createdAt: z.string(),
})

export type Meetup = z.infer<typeof meetupSchema>

export const mentorSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(40),
  focus: z.array(speciesCategorySchema).min(1),
  region: meetupRegionSchema,
  years: z.number().int().min(0).max(50),
  bio: z.string().min(1).max(400),
  contact: z.string().min(1).max(120),
  createdAt: z.string(),
})

export type Mentor = z.infer<typeof mentorSchema>

export const meetupFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'meetups.errors.titleRequired')
    .max(80, 'meetups.errors.titleMax'),
  host: z.string().trim().min(1, 'meetups.errors.hostRequired').max(40, 'meetups.errors.hostMax'),
  region: meetupRegionSchema,
  datetime: z.string().trim().min(1, 'meetups.errors.datetimeRequired'),
  venue: z
    .string()
    .trim()
    .min(1, 'meetups.errors.venueRequired')
    .max(80, 'meetups.errors.venueMax'),
  capacity: z
    .number({ message: 'meetups.errors.capacityRange' })
    .int('meetups.errors.capacityRange')
    .min(2, 'meetups.errors.capacityRange')
    .max(200, 'meetups.errors.capacityRange'),
  description: z.string().trim().max(500, 'meetups.errors.descriptionMax'),
})

export type MeetupFormValues = z.infer<typeof meetupFormSchema>
export type MeetupFormInputValues = z.input<typeof meetupFormSchema>

export const mentorFormSchema = z.object({
  name: z.string().trim().min(1, 'meetups.errors.nameRequired').max(40, 'meetups.errors.nameMax'),
  focus: z.array(speciesCategorySchema).min(1, 'meetups.errors.focusRequired'),
  region: meetupRegionSchema,
  years: z
    .number({ message: 'meetups.errors.yearsRange' })
    .int('meetups.errors.yearsRange')
    .min(0, 'meetups.errors.yearsRange')
    .max(50, 'meetups.errors.yearsRange'),
  bio: z.string().trim().min(1, 'meetups.errors.bioRequired').max(400, 'meetups.errors.bioMax'),
  contact: z
    .string()
    .trim()
    .min(1, 'meetups.errors.contactRequired')
    .max(120, 'meetups.errors.contactMax'),
})

export type MentorFormValues = z.infer<typeof mentorFormSchema>
export type MentorFormInputValues = z.input<typeof mentorFormSchema>

/** Whole days remaining until the meetup datetime (0 == today, negative == past). */
export function dDay(datetime: string, nowMs: number = Date.now()): number {
  const target = new Date(datetime).getTime()
  return Math.ceil((target - nowMs) / 86_400_000)
}

/** baseAttendees plus 1 when the local keeper has RSVP'd. */
export function attendeeCount(meetup: Meetup, rsvpIds: Record<string, true>): number {
  return meetup.baseAttendees + (rsvpIds[meetup.id] ? 1 : 0)
}

export function isFull(meetup: Meetup, rsvpIds: Record<string, true>): boolean {
  return attendeeCount(meetup, rsvpIds) >= meetup.capacity
}

/** Future (or current) meetups sorted by soonest datetime first. */
export function upcomingMeetups(meetups: readonly Meetup[], nowMs: number = Date.now()): Meetup[] {
  return meetups
    .filter((m) => new Date(m.datetime).getTime() >= nowMs)
    .slice()
    .sort((a, b) => a.datetime.localeCompare(b.datetime))
}

export function isExternalUrl(contact: string): boolean {
  return /^https?:\/\//i.test(contact.trim())
}
