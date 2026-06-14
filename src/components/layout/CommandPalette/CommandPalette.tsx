import Modal from '@components/common/Modal'
import { useSpeciesList } from '@domains/species'
import { useMemo, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import styles from './CommandPalette.module.css'

import { ALL_TOOLS } from '@/config/toolCatalog'

interface CommandPaletteProps {
  onClose: () => void
}

interface CommandItem {
  id: string
  path: string
  emoji: string
  label: string
  hint: string
}

const MAX_SPECIES = 6

function CommandPalette({ onClose }: CommandPaletteProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: speciesList = [] } = useSpeciesList({})

  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)

  const { tools, species } = useMemo(() => {
    const q = query.trim().toLowerCase()
    const toolItems: CommandItem[] = ALL_TOOLS.map((tool) => ({
      id: `cmd-tool-${tool.path}`,
      path: tool.path,
      emoji: tool.emoji,
      label: t(`nav.${tool.navKey}`),
      hint: t(`tools.groups.${tool.groupId}`),
    })).filter((item) => !q || item.label.toLowerCase().includes(q) || item.path.includes(q))

    const speciesItems: CommandItem[] = q
      ? speciesList
          .filter(
            (sp) =>
              sp.koreanName.toLowerCase().includes(q) ||
              (sp.scientificName ?? '').toLowerCase().includes(q)
          )
          .slice(0, MAX_SPECIES)
          .map((sp) => ({
            id: `cmd-species-${sp.slug}`,
            path: `/species/${sp.slug}`,
            emoji: sp.heroEmoji ?? '🐾',
            label: sp.koreanName,
            hint: t('command.speciesGroup'),
          }))
      : []

    return { tools: toolItems, species: speciesItems }
  }, [query, speciesList, t])

  const flat = useMemo(() => [...tools, ...species], [tools, species])
  const activeIndex = flat.length === 0 ? -1 : Math.min(selected, flat.length - 1)
  const activeId = activeIndex >= 0 ? flat[activeIndex].id : undefined

  function go(item: CommandItem) {
    onClose()
    navigate(item.path)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected(activeIndex < 0 ? 0 : Math.min(activeIndex + 1, flat.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected(activeIndex <= 0 ? flat.length - 1 : activeIndex - 1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = flat[activeIndex]
      if (item) go(item)
    }
  }

  function renderOption(item: CommandItem, index: number) {
    const isActive = index === activeIndex
    return (
      <li key={item.id}>
        <button
          type="button"
          id={item.id}
          role="option"
          aria-selected={isActive}
          className={`${styles.option} ${isActive ? styles.optionActive : ''}`}
          onClick={() => go(item)}
          onMouseMove={() => setSelected(index)}
        >
          <span className={styles.optionEmoji} aria-hidden="true">
            {item.emoji}
          </span>
          <span className={styles.optionLabel}>{item.label}</span>
          <span className={styles.optionHint}>{item.hint}</span>
        </button>
      </li>
    )
  }

  return (
    <Modal isOpen onClose={onClose} size="lg">
      <div className={styles.palette}>
        <input
          type="search"
          className={styles.input}
          placeholder={t('command.placeholder')}
          aria-label={t('command.title')}
          role="combobox"
          aria-expanded="true"
          aria-controls="command-listbox"
          aria-activedescendant={activeId}
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setSelected(0)
          }}
          onKeyDown={onKeyDown}
        />

        {flat.length === 0 ? (
          <p className={styles.empty}>{t('command.empty')}</p>
        ) : (
          <ul
            className={styles.list}
            id="command-listbox"
            role="listbox"
            aria-label={t('command.title')}
          >
            {tools.length > 0 && (
              <li className={styles.groupLabel} role="presentation">
                {t('command.toolsGroup')}
              </li>
            )}
            {tools.map((item, i) => renderOption(item, i))}
            {species.length > 0 && (
              <li className={styles.groupLabel} role="presentation">
                {t('command.speciesGroup')}
              </li>
            )}
            {species.map((item, i) => renderOption(item, tools.length + i))}
          </ul>
        )}

        <p className={styles.footer}>
          <span>
            <kbd className={styles.kbd}>↑</kbd>
            <kbd className={styles.kbd}>↓</kbd> {t('command.navigate')}
          </span>
          <span>
            <kbd className={styles.kbd}>↵</kbd> {t('command.select')}
          </span>
          <span>
            <kbd className={styles.kbd}>esc</kbd> {t('command.close')}
          </span>
        </p>
      </div>
    </Modal>
  )
}

export default CommandPalette
