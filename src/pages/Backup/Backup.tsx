import Button from '@components/common/Button'
import { useToast } from '@components/common/Toast'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import styles from './Backup.module.css'

const BACKUP_KEY_PREFIXES = ['pettography.', 'onboarding-store']

interface BackupEnvelope {
  app: 'pettography'
  version: 1
  exportedAt: string
  data: Record<string, string>
}

interface PendingImport {
  exportedAt: string
  data: Record<string, string>
}

function collectKeys(): string[] {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (!k) continue
    if (isBackupKey(k)) {
      keys.push(k)
    }
  }
  return keys.sort()
}

function isBackupKey(key: string): boolean {
  return BACKUP_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))
}

function isBackupData(data: unknown): data is Record<string, unknown> {
  return typeof data === 'object' && data !== null && !Array.isArray(data)
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
  const [pending, setPending] = useState<PendingImport | null>(null)
  const confirmRef = useRef<HTMLDivElement | null>(null)

  // Move focus into the restore-confirmation dialog when it opens (WAI-ARIA alertdialog).
  useEffect(() => {
    if (pending) confirmRef.current?.focus()
  }, [pending])

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

  async function handleFile(file: File) {
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as Partial<BackupEnvelope>
      if (parsed.app !== 'pettography' || parsed.version !== 1 || !isBackupData(parsed.data)) {
        throw new Error('invalid')
      }
      const importable: Record<string, string> = {}
      for (const [k, v] of Object.entries(parsed.data)) {
        if (isBackupKey(k) && typeof v === 'string') importable[k] = v
      }
      setPending({
        exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : '',
        data: importable,
      })
    } catch {
      toast(t('backup.invalidFileToast'), 'error')
    }
  }

  function confirmImport() {
    if (!pending) return
    for (const k of collectKeys()) {
      localStorage.removeItem(k)
    }
    for (const [k, v] of Object.entries(pending.data)) {
      localStorage.setItem(k, v)
    }
    toast(t('backup.importedToast'), 'success')
    setPending(null)
    setTimeout(() => window.location.reload(), 600)
  }

  function cancelImport() {
    setPending(null)
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

  const pendingKeys = pending ? Object.keys(pending.data).sort() : []

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
              void handleFile(f)
              e.target.value = ''
            }
          }}
        />
        <Button variant="outline" onClick={() => fileInput.current?.click()}>
          {t('backup.importButton')}
        </Button>

        {pending && (
          <div
            ref={confirmRef}
            tabIndex={-1}
            className={styles.confirmPanel}
            role="alertdialog"
            aria-labelledby="restore-confirm-heading"
          >
            <h3 id="restore-confirm-heading" className={styles.confirmTitle}>
              {t('backup.confirmTitle')}
            </h3>
            {pending.exportedAt && (
              <p className={styles.confirmMeta}>
                {t('backup.confirmBackupDate', {
                  date: new Date(pending.exportedAt).toLocaleString(),
                })}
              </p>
            )}
            <p className={styles.confirmMeta}>
              {t('backup.confirmIncludes', { count: pendingKeys.length })}
            </p>
            <ul className={styles.confirmKeys}>
              {pendingKeys.map((k) => (
                <li key={k}>{k.replace('pettography.', '')}</li>
              ))}
            </ul>
            <p className={styles.confirmWarning}>
              <span aria-hidden="true">⚠️ </span>
              {t('backup.confirmWarning')}
            </p>
            <div className={styles.confirmActions}>
              <Button variant="primary" onClick={confirmImport}>
                {t('backup.confirmRestore')}
              </Button>
              <Button variant="ghost" onClick={cancelImport}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        )}
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
