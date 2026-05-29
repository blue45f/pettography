import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Select from '@components/common/Select'
import Tabs from '@components/common/Tabs'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import {
  attendeeCount,
  dDay,
  isExternalUrl,
  isFull,
  MEETUP_REGIONS,
  meetupFormSchema,
  mentorFormSchema,
  upcomingMeetups,
  useMeetupsStore,
  SEED_MEETUPS,
  SEED_MENTORS,
  type Meetup,
  type MeetupFormInputValues,
  type MeetupFormValues,
  type MeetupRegion,
  type Mentor,
  type MentorFormInputValues,
  type MentorFormValues,
} from '@features/meetups'
import { useOnboardingStore } from '@features/onboarding'
import { SPECIES_CATEGORIES, type SpeciesCategory } from '@features/species'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import styles from './Meetups.module.css'

function Meetups() {
  const { t } = useTranslation()
  useDocumentTitle(t('meetups.title'))

  const hydrateSeed = useMeetupsStore((s) => s.hydrateSeed)
  // Seed once on first mount without triggering setState-in-effect.
  useState(() => {
    hydrateSeed(SEED_MEETUPS, SEED_MENTORS)
    return null
  })

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('meetups.title')}</h1>
        <p className={styles.subtitle}>{t('meetups.subtitle')}</p>
      </header>

      <Tabs
        tabs={[
          { id: 'meetups', label: t('meetups.tabMeetups'), content: <MeetupsTab /> },
          { id: 'mentors', label: t('meetups.tabMentors'), content: <MentorsTab /> },
        ]}
      />
    </section>
  )
}

function formatDateTime(iso: string, language: string): string {
  return new Date(iso).toLocaleString(language.startsWith('ko') ? 'ko' : 'en', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/* ------------------------------- 밋업 tab ------------------------------- */

function MeetupsTab() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const meetups = useMeetupsStore((s) => s.meetups)
  const rsvpIds = useMeetupsStore((s) => s.rsvpIds)
  const ownMeetupIds = useMeetupsStore((s) => s.ownMeetupIds)
  const toggleRsvp = useMeetupsStore((s) => s.toggleRsvp)
  const removeMeetup = useMeetupsStore((s) => s.removeMeetup)

  const [region, setRegion] = useState<MeetupRegion | 'all'>('all')

  const upcoming = upcomingMeetups(meetups)
  const visible = region === 'all' ? upcoming : upcoming.filter((m) => m.region === region)

  return (
    <div className={styles.page}>
      <div role="radiogroup" aria-label={t('meetups.regionFilterLabel')} className={styles.filters}>
        <FilterChip active={region === 'all'} onClick={() => setRegion('all')}>
          {t('meetups.filterAll')}
        </FilterChip>
        {MEETUP_REGIONS.map((r) => (
          <FilterChip key={r} active={region === r} onClick={() => setRegion(r)}>
            {t(`meetups.regions.${r}`)}
          </FilterChip>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon="📅"
          title={t('meetups.emptyMeetups')}
          description={t('meetups.emptyMeetupsHint')}
        />
      ) : (
        <ul className={styles.grid}>
          {visible.map((meetup) => (
            <li key={meetup.id}>
              <MeetupCard
                meetup={meetup}
                rsvped={Boolean(rsvpIds[meetup.id])}
                full={isFull(meetup, rsvpIds)}
                count={attendeeCount(meetup, rsvpIds)}
                owned={Boolean(ownMeetupIds[meetup.id])}
                onToggleRsvp={() => {
                  const now = toggleRsvp(meetup.id)
                  toast(now ? t('meetups.rsvpOnToast') : t('meetups.rsvpOffToast'), 'success')
                }}
                onRemove={() => {
                  removeMeetup(meetup.id)
                  toast(t('meetups.meetupRemovedToast'), 'success')
                }}
              />
            </li>
          ))}
        </ul>
      )}

      <MeetupComposer onCreated={() => toast(t('meetups.meetupCreatedToast'), 'success')} />
    </div>
  )
}

interface MeetupCardProps {
  meetup: Meetup
  rsvped: boolean
  full: boolean
  count: number
  owned: boolean
  onToggleRsvp: () => void
  onRemove: () => void
}

function MeetupCard({
  meetup,
  rsvped,
  full,
  count,
  owned,
  onToggleRsvp,
  onRemove,
}: MeetupCardProps) {
  const { t, i18n } = useTranslation()
  const days = dDay(meetup.datetime)
  const dLabel = days <= 0 ? t('meetups.dDayToday') : t('meetups.dDay', { count: days })

  return (
    <Card padding="md" className={styles.itemCard}>
      <Card.Body className={styles.cardBody}>
        <div className={styles.cardTopRow}>
          <div className={styles.badgeRow}>
            <Badge variant="primary">{dLabel}</Badge>
            <Badge variant="default">{t(`meetups.regions.${meetup.region}`)}</Badge>
          </div>
          {full && <Badge variant="error">{t('meetups.full')}</Badge>}
        </div>

        <h3 className={styles.cardTitle}>{meetup.title}</h3>

        <div className={styles.meta}>
          <span className={styles.metaLine}>
            <span aria-hidden="true" className={styles.metaIcon}>
              🧑
            </span>
            {t('meetups.hostedBy', { host: meetup.host })}
          </span>
          <span className={styles.metaLine}>
            <span aria-hidden="true" className={styles.metaIcon}>
              🕒
            </span>
            {formatDateTime(meetup.datetime, i18n.language)}
          </span>
          <span className={styles.metaLine}>
            <span aria-hidden="true" className={styles.metaIcon}>
              📍
            </span>
            {meetup.venue}
          </span>
        </div>

        {meetup.description && <p className={styles.description}>{meetup.description}</p>}

        <p className={styles.attendees}>
          {t('meetups.attendeeCount', { count, capacity: meetup.capacity })}
        </p>

        <div className={styles.cardFooter}>
          <Button
            type="button"
            variant={rsvped ? 'outline' : 'primary'}
            size="sm"
            disabled={full && !rsvped}
            aria-pressed={rsvped}
            onClick={onToggleRsvp}
          >
            {rsvped ? t('meetups.rsvpCancel') : t('meetups.rsvpJoin')}
          </Button>
          {owned && (
            <button type="button" className={styles.dangerLink} onClick={onRemove}>
              {t('meetups.delete')}
            </button>
          )}
        </div>
      </Card.Body>
    </Card>
  )
}

interface MeetupComposerProps {
  onCreated: () => void
}

function MeetupComposer({ onCreated }: MeetupComposerProps) {
  const { t } = useTranslation()
  const profile = useOnboardingStore((s) => s.profile)
  const lastAuthor = useMeetupsStore((s) => s.lastAuthor)
  const addMeetup = useMeetupsStore((s) => s.addMeetup)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<MeetupFormInputValues, unknown, MeetupFormValues>({
    resolver: zodResolver(meetupFormSchema),
    defaultValues: {
      title: '',
      host: lastAuthor,
      region: regionForProfile(profile.location?.presetId),
      datetime: '',
      venue: '',
      capacity: 12,
      description: '',
    },
  })

  useEffect(() => {
    if (!dirtyFields.host) setValue('host', lastAuthor)
  }, [lastAuthor, dirtyFields.host, setValue])

  const onSubmit = handleSubmit((values) => {
    addMeetup(values)
    onCreated()
    reset({
      title: '',
      host: values.host,
      region: values.region,
      datetime: '',
      venue: '',
      capacity: 12,
      description: '',
    })
  })

  return (
    <Card padding="lg" className={styles.composerCard}>
      <Card.Body>
        <h2 className={styles.composerTitle}>{t('meetups.createMeetupTitle')}</h2>
        <form onSubmit={onSubmit} className={styles.composerForm} noValidate>
          <Input
            label={t('meetups.fieldTitle')}
            placeholder={t('meetups.fieldTitlePlaceholder')}
            error={errors.title?.message ? t(errors.title.message) : undefined}
            {...register('title')}
          />
          <div className={styles.composerRow}>
            <Input
              label={t('meetups.fieldHost')}
              placeholder={t('meetups.fieldHostPlaceholder')}
              error={errors.host?.message ? t(errors.host.message) : undefined}
              {...register('host')}
            />
            <Select
              label={t('meetups.fieldRegion')}
              options={MEETUP_REGIONS.map((r) => ({ value: r, label: t(`meetups.regions.${r}`) }))}
              error={errors.region?.message ? t(errors.region.message) : undefined}
              {...register('region')}
            />
          </div>
          <div className={styles.composerRow}>
            <Input
              type="datetime-local"
              label={t('meetups.fieldDatetime')}
              error={errors.datetime?.message ? t(errors.datetime.message) : undefined}
              {...register('datetime')}
            />
            <Input
              type="number"
              min={2}
              max={200}
              label={t('meetups.fieldCapacity')}
              error={errors.capacity?.message ? t(errors.capacity.message) : undefined}
              {...register('capacity', { valueAsNumber: true })}
            />
          </div>
          <Input
            label={t('meetups.fieldVenue')}
            placeholder={t('meetups.fieldVenuePlaceholder')}
            error={errors.venue?.message ? t(errors.venue.message) : undefined}
            {...register('venue')}
          />
          <Textarea
            label={t('meetups.fieldDescription')}
            rows={3}
            placeholder={t('meetups.fieldDescriptionPlaceholder')}
            error={errors.description?.message ? t(errors.description.message) : undefined}
            {...register('description')}
          />
          <div className={styles.composerActions}>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {t('meetups.createMeetupSubmit')}
            </Button>
          </div>
        </form>
      </Card.Body>
    </Card>
  )
}

/* ------------------------------ 멘토 tab ------------------------------ */

function MentorsTab() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const mentors = useMeetupsStore((s) => s.mentors)
  const ownMentorIds = useMeetupsStore((s) => s.ownMentorIds)
  const removeMentor = useMeetupsStore((s) => s.removeMentor)

  const [focus, setFocus] = useState<SpeciesCategory | 'all'>('all')
  const visible = focus === 'all' ? mentors : mentors.filter((m) => m.focus.includes(focus))

  return (
    <div className={styles.page}>
      <div role="radiogroup" aria-label={t('meetups.focusFilterLabel')} className={styles.filters}>
        <FilterChip active={focus === 'all'} onClick={() => setFocus('all')}>
          {t('meetups.filterAll')}
        </FilterChip>
        {SPECIES_CATEGORIES.map((c) => (
          <FilterChip key={c} active={focus === c} onClick={() => setFocus(c)}>
            {t(`categories.${c}`)}
          </FilterChip>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon="🤝"
          title={t('meetups.emptyMentors')}
          description={t('meetups.emptyMentorsHint')}
        />
      ) : (
        <ul className={styles.grid}>
          {visible.map((mentor) => (
            <li key={mentor.id}>
              <MentorCard
                mentor={mentor}
                owned={Boolean(ownMentorIds[mentor.id])}
                onRemove={() => {
                  removeMentor(mentor.id)
                  toast(t('meetups.mentorRemovedToast'), 'success')
                }}
              />
            </li>
          ))}
        </ul>
      )}

      <MentorComposer onCreated={() => toast(t('meetups.mentorCreatedToast'), 'success')} />
    </div>
  )
}

interface MentorCardProps {
  mentor: Mentor
  owned: boolean
  onRemove: () => void
}

function MentorCard({ mentor, owned, onRemove }: MentorCardProps) {
  const { t } = useTranslation()
  const external = isExternalUrl(mentor.contact)

  return (
    <Card padding="md" className={styles.itemCard}>
      <Card.Body className={styles.cardBody}>
        <div className={styles.cardTopRow}>
          <h3 className={styles.cardTitle}>{mentor.name}</h3>
          <Badge variant="success">{t('meetups.yearsBadge', { count: mentor.years })}</Badge>
        </div>

        <div className={styles.badgeRow}>
          {mentor.focus.map((c) => (
            <Badge key={c} variant="primary">
              {t(`categories.${c}`)}
            </Badge>
          ))}
        </div>

        <span className={styles.metaLine}>
          <span aria-hidden="true" className={styles.metaIcon}>
            📍
          </span>
          {t(`meetups.regions.${mentor.region}`)}
        </span>

        <p className={styles.bio}>{mentor.bio}</p>

        <div className={styles.cardFooter}>
          {external ? (
            <a
              className={styles.contactLink}
              href={mentor.contact}
              target="_blank"
              rel="noreferrer"
            >
              {t('meetups.contactCta')} <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <span className={styles.contactText}>
              {t('meetups.contactLabel')}: {mentor.contact}
            </span>
          )}
          {owned && (
            <button type="button" className={styles.dangerLink} onClick={onRemove}>
              {t('meetups.delete')}
            </button>
          )}
        </div>
      </Card.Body>
    </Card>
  )
}

interface MentorComposerProps {
  onCreated: () => void
}

function MentorComposer({ onCreated }: MentorComposerProps) {
  const { t } = useTranslation()
  const profile = useOnboardingStore((s) => s.profile)
  const lastAuthor = useMeetupsStore((s) => s.lastAuthor)
  const addMentor = useMeetupsStore((s) => s.addMentor)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<MentorFormInputValues, unknown, MentorFormValues>({
    resolver: zodResolver(mentorFormSchema),
    defaultValues: {
      name: lastAuthor,
      focus: profile.category ? [profile.category] : [],
      region: regionForProfile(profile.location?.presetId),
      years: 1,
      bio: '',
      contact: '',
    },
  })

  useEffect(() => {
    if (!dirtyFields.name) setValue('name', lastAuthor)
  }, [lastAuthor, dirtyFields.name, setValue])

  const onSubmit = handleSubmit((values) => {
    addMentor(values)
    onCreated()
    reset({
      name: values.name,
      focus: [],
      region: values.region,
      years: 1,
      bio: '',
      contact: '',
    })
  })

  return (
    <Card padding="lg" className={styles.composerCard}>
      <Card.Body>
        <h2 className={styles.composerTitle}>{t('meetups.createMentorTitle')}</h2>
        <form onSubmit={onSubmit} className={styles.composerForm} noValidate>
          <div className={styles.composerRow}>
            <Input
              label={t('meetups.fieldName')}
              placeholder={t('meetups.fieldNamePlaceholder')}
              error={errors.name?.message ? t(errors.name.message) : undefined}
              {...register('name')}
            />
            <Select
              label={t('meetups.fieldRegion')}
              options={MEETUP_REGIONS.map((r) => ({ value: r, label: t(`meetups.regions.${r}`) }))}
              error={errors.region?.message ? t(errors.region.message) : undefined}
              {...register('region')}
            />
          </div>

          <div>
            <span className={styles.fieldLabel}>{t('meetups.fieldFocus')}</span>
            <Controller
              control={control}
              name="focus"
              render={({ field }) => (
                <div className={styles.checkGroup}>
                  {SPECIES_CATEGORIES.map((c) => {
                    const checked = field.value.includes(c)
                    return (
                      <label
                        key={c}
                        className={[styles.checkChip, checked ? styles.checkChipActive : '']
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            field.onChange(
                              e.target.checked
                                ? [...field.value, c]
                                : field.value.filter((v) => v !== c),
                            )
                          }}
                        />
                        {t(`categories.${c}`)}
                      </label>
                    )
                  })}
                </div>
              )}
            />
            {errors.focus?.message && (
              <p className={styles.fieldError}>{t(errors.focus.message)}</p>
            )}
          </div>

          <Input
            type="number"
            min={0}
            max={50}
            label={t('meetups.fieldYears')}
            error={errors.years?.message ? t(errors.years.message) : undefined}
            {...register('years', { valueAsNumber: true })}
          />
          <Textarea
            label={t('meetups.fieldBio')}
            rows={3}
            placeholder={t('meetups.fieldBioPlaceholder')}
            error={errors.bio?.message ? t(errors.bio.message) : undefined}
            {...register('bio')}
          />
          <Input
            label={t('meetups.fieldContact')}
            placeholder={t('meetups.fieldContactPlaceholder')}
            helperText={t('meetups.fieldContactHelper')}
            error={errors.contact?.message ? t(errors.contact.message) : undefined}
            {...register('contact')}
          />
          <div className={styles.composerActions}>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {t('meetups.createMentorSubmit')}
            </Button>
          </div>
        </form>
      </Card.Body>
    </Card>
  )
}

/* ------------------------------ shared ------------------------------ */

function regionForProfile(presetId: string | null | undefined): MeetupRegion {
  if (presetId && (MEETUP_REGIONS as readonly string[]).includes(presetId)) {
    return presetId as MeetupRegion
  }
  return 'songpa'
}

interface FilterChipProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}

function FilterChip({ active, onClick, children }: FilterChipProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      className={[styles.filterChip, active ? styles.filterActive : ''].filter(Boolean).join(' ')}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export default Meetups
