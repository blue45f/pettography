import { useOnboardingStore } from '@domains/onboarding'
import { useSpeciesList } from '@domains/species'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import styles from './PetSwitcher.module.css'

function petLabel(name: string | null | undefined, speciesName: string | undefined): string {
  if (name && name.trim().length > 0) return name
  if (speciesName) return speciesName
  return '...'
}

function PetSwitcher() {
  const { t } = useTranslation()
  const pets = useOnboardingStore((s) => s.pets)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  const switchPet = useOnboardingStore((s) => s.switchPet)
  const addPet = useOnboardingStore((s) => s.addPet)
  const removePet = useOnboardingStore((s) => s.removePet)

  const { data: speciesList = [] } = useSpeciesList({})
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const active = pets.find((p) => p.id === activePetId) ?? pets[0]
  const activeSpecies = speciesList.find((s) => s.id === active?.speciesId)
  const activeLabel = petLabel(active?.petName, activeSpecies?.koreanName)
  const activeEmoji = activeSpecies?.heroEmoji ?? '🐾'

  if (pets.length === 0) return null

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true" className={styles.triggerEmoji}>
          {activeEmoji}
        </span>
        <span className={styles.triggerName}>{activeLabel}</span>
        <span aria-hidden="true" className={styles.triggerChevron}>
          ▾
        </span>
      </button>
      {open && (
        <div className={styles.menu} role="menu" aria-label={t('petSwitcher.menuLabel')}>
          <p className={styles.menuLabel}>{t('petSwitcher.title', { count: pets.length })}</p>
          <ul className={styles.list}>
            {pets.map((p) => {
              const sp = speciesList.find((s) => s.id === p.speciesId)
              const isActive = p.id === activePetId
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={isActive}
                    className={[styles.item, isActive ? styles.itemActive : ''].join(' ')}
                    onClick={() => {
                      switchPet(p.id)
                      setOpen(false)
                    }}
                  >
                    <span aria-hidden="true" className={styles.itemEmoji}>
                      {sp?.heroEmoji ?? '🐾'}
                    </span>
                    <span className={styles.itemBody}>
                      <span className={styles.itemName}>{petLabel(p.petName, sp?.koreanName)}</span>
                      {sp && <span className={styles.itemSub}>{sp.scientificName}</span>}
                    </span>
                    {pets.length > 1 && (
                      <button
                        type="button"
                        className={styles.itemRemove}
                        aria-label={t('petSwitcher.remove')}
                        onClick={(e) => {
                          e.stopPropagation()
                          removePet(p.id)
                        }}
                      >
                        ×
                      </button>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
          <button
            type="button"
            className={styles.addButton}
            onClick={() => {
              addPet()
              setOpen(false)
              if (typeof window !== 'undefined') {
                window.location.assign('/onboarding')
              }
            }}
          >
            + {t('petSwitcher.addNew')}
          </button>
        </div>
      )}
    </div>
  )
}

export default PetSwitcher
