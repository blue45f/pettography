import Button from '@components/common/Button'
import Card from '@components/common/Card'
import Input from '@components/common/Input'
import Select from '@components/common/Select'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import {
  CAFE_EMOJI_CHOICES,
  cafeFormSchema,
  useCafesStore,
  type CafeFormValues,
} from '@domains/cafes'
import { useSpeciesList } from '@domains/species'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'

import styles from './CafeCreate.module.css'

function CafeCreate() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const navigate = useNavigate()
  useDocumentTitle(t('cafes.createTitle'))

  const { data: speciesList = [], isLoading } = useSpeciesList({})
  const createCafe = useCafesStore((s) => s.createCafe)
  const lastNickname = useCafesStore((s) => s.lastNickname)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CafeFormValues>({
    resolver: zodResolver(cafeFormSchema),
    defaultValues: {
      name: '',
      description: '',
      speciesId: '',
      createdBy: lastNickname,
      emoji: CAFE_EMOJI_CHOICES[0],
    },
  })

  // watch() 는 React Compiler 와 호환되지 않아(eslint incompatible-library) 구독형 useWatch 사용
  const selectedEmoji = useWatch({ control, name: 'emoji' })

  const onSubmit = handleSubmit((values) => {
    const species = speciesList.find((sp) => sp.id === values.speciesId)
    if (!species) {
      toast(t('cafes.errors.speciesRequired'), 'error')
      return
    }
    const cafe = createCafe({
      name: values.name,
      description: values.description,
      speciesId: species.id,
      speciesName: species.koreanName,
      category: species.category,
      emoji: values.emoji,
      createdBy: values.createdBy,
    })
    toast(t('cafes.createdToast'), 'success')
    void navigate(`/cafes/${cafe.id}`)
  })

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.backRow}>
          <Link to="/cafes" className={styles.backLink}>
            ← {t('cafes.backToList')}
          </Link>
        </p>
        <h1>{t('cafes.createTitle')}</h1>
        <p className={styles.subtitle}>{t('cafes.createSubtitle')}</p>
      </header>

      <Card padding="lg" className={styles.formCard}>
        <Card.Body>
          <form onSubmit={onSubmit} className={styles.form} noValidate>
            <Select
              label={t('cafes.speciesLabel')}
              options={[
                { value: '', label: t('cafes.speciesPlaceholder') },
                ...speciesList.map((sp) => ({
                  value: sp.id,
                  label: `${sp.koreanName} (${t(`categories.${sp.category}`)})`,
                })),
              ]}
              disabled={isLoading}
              error={errors.speciesId?.message ? t(errors.speciesId.message) : undefined}
              {...register('speciesId')}
            />
            <Input
              label={t('cafes.nameLabel')}
              placeholder={t('cafes.namePlaceholder')}
              error={errors.name?.message ? t(errors.name.message) : undefined}
              {...register('name')}
            />
            <Textarea
              rows={4}
              label={t('cafes.descriptionLabel')}
              placeholder={t('cafes.descriptionPlaceholder')}
              error={errors.description?.message ? t(errors.description.message) : undefined}
              {...register('description')}
            />
            <Input
              label={t('cafes.nicknameLabel')}
              placeholder={t('cafes.nicknamePlaceholder')}
              error={errors.createdBy?.message ? t(errors.createdBy.message) : undefined}
              {...register('createdBy')}
            />

            <fieldset className={styles.emojiFieldset}>
              <legend className={styles.emojiLegend}>{t('cafes.emojiLabel')}</legend>
              <div role="radiogroup" aria-label={t('cafes.emojiLabel')} className={styles.emojiRow}>
                {CAFE_EMOJI_CHOICES.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    role="radio"
                    aria-checked={selectedEmoji === emoji}
                    aria-label={emoji}
                    className={[
                      styles.emojiChip,
                      selectedEmoji === emoji ? styles.emojiActive : '',
                    ].join(' ')}
                    onClick={() => setValue('emoji', emoji, { shouldDirty: true })}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className={styles.formActions}>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                {t('cafes.submit')}
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>
    </section>
  )
}

export default CafeCreate
