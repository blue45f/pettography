import Button from '@components/common/Button'
import { useToast } from '@components/common/Toast'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import styles from './Backup.module.css'

const BACKUP_KEY_PREFIXES = ['pettography.', 'onboarding-store']

interface BackupEnvelope {
  app: 'pettography'
  version: 1
  exportedAt: string
  data: Record<string, string>
}

function collectKeys(): string[] {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (!k) continue
    if (BACKUP_KEY_PREFIXES.some((p) => k.startsWith(p) || k === p)) {
      keys.push(k)
    }
  }
  return keys.sort()
}

function buildEnvelope(): BackupEnvelope {
  const data: Record<string, string> = {}
  for (const k of collectKeys()) {
    const v = localStorage.getItem(k)
    if (v !== null) data[k] = v
  }
  return {
    app: 'pettography',
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  }
}

function Backup() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('backup.title'))

  const fileInput = useRef<HTMLInputElement | null>(null)
  const [keys, setKeys] = useState<string[]>(() => collectKeys())

  function handleExport() {
    const envelope = buildEnvelope()
    const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    a.download = `pettography-backup-${stamp}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast(t('backup.exportedToast'), 'success')
  }

  async function handleImport(file: File) {
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as Partial<BackupEnvelope>
      if (parsed.app !== 'pettography' || parsed.version !== 1 || !parsed.data) {
        throw new Error('invalid')
      }
      for (const k of collectKeys()) {
        localStorage.removeItem(k)
      }
      for (const [k, v] of Object.entries(parsed.data)) {
        if (typeof v === 'string') localStorage.setItem(k, v)
      }
      toast(t('backup.importedToast'), 'success')
      setTimeout(() => window.location.reload(), 600)
    } catch {
      toast(t('backup.invalidFileToast'), 'error')
    }
  }

  function handleWipe() {
    if (!window.confirm(t('backup.wipeConfirm'))) return
    for (const k of collectKeys()) {
      localStorage.removeItem(k)
    }
    setKeys([])
    toast(t('backup.wipedToast'), 'success')
    setTimeout(() => window.location.reload(), 600)
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('backup.title')}</h1>
        <p className={styles.subtitle}>{t('backup.subtitle')}</p>
      </header>

      <section className={styles.section} aria-labelledby="export-heading">
        <h2 id="export-heading" className={styles.sectionTitle}>
          {t('backup.exportTitle')}
        </h2>
        <p className={styles.sectionDesc}>{t('backup.exportDesc')}</p>
        <ul className={styles.keysList}>
          {keys.length === 0 ? (
            <li className={styles.empty}>{t('backup.empty')}</li>
          ) : (
            keys.map((k) => <li key={k}>{k}</li>)
          )}
        </ul>
        <Button variant="primary" onClick={handleExport} disabled={keys.length === 0}>
          {t('backup.exportButton')}
        </Button>
      </section>

      <section className={styles.section} aria-labelledby="import-heading">
        <h2 id="import-heading" className={styles.sectionTitle}>
          {t('backup.importTitle')}
        </h2>
        <p className={styles.sectionDesc}>{t('backup.importDesc')}</p>
        <input
          ref={fileInput}
          type="file"
          accept="application/json"
          className={styles.hiddenInput}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) {
              void handleImport(f)
              e.target.value = ''
            }
          }}
        />
        <Button variant="outline" onClick={() => fileInput.current?.click()}>
          {t('backup.importButton')}
        </Button>
      </section>

      <section className={styles.section} aria-labelledby="wipe-heading">
        <h2 id="wipe-heading" className={styles.sectionTitle}>
          {t('backup.wipeTitle')}
        </h2>
        <p className={styles.sectionDesc}>{t('backup.wipeDesc')}</p>
        <Button variant="ghost" onClick={handleWipe} disabled={keys.length === 0}>
          {t('backup.wipeButton')}
        </Button>
      </section>
    </section>
  )
}

export default Backup
