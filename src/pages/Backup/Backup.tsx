import Button from '@components/common/Button'
import { useToast } from '@components/common/Toast'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import styles from './Backup.module.css'
import {
  BACKUP_FORMAT_VERSION,
  createBackupEnvelope,
  isBackupData,
  verifyBackupEnvelope,
  type BackupEnvelope,
} from './backupEnvelope'

import type { ChangeEvent } from 'react'

const BACKUP_KEY_PREFIXES = ['pettography.', 'onboarding-store']
const MAX_BACKUP_FILE_BYTES = 2 * 1024 * 1024
const MAX_BACKUP_KEY_COUNT = 500

type Operation = 'idle' | 'exporting' | 'reading' | 'restoring' | 'wiping'

interface PendingRestore {
  exportedAt: string
  data: Record<string, string>
  checksum?: string
}

class BackupMutationError extends Error {
  constructor(readonly rolledBack: boolean) {
    super('Backup storage mutation failed')
  }
}

function isBackupKey(key: string): boolean {
  return BACKUP_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))
}

function getBackupKeys(): string[] {
  const keys: string[] = []
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)
    if (key && isBackupKey(key)) keys.push(key)
  }
  return keys.sort()
}

function collectBackupData(): Record<string, string> {
  const data: Record<string, string> = {}
  getBackupKeys().forEach((key) => {
    const value = localStorage.getItem(key)
    if (value !== null) data[key] = value
  })
  return data
}

function replaceBackupData(nextData: Record<string, string>): void {
  const previousData = collectBackupData()
  try {
    getBackupKeys().forEach((key) => localStorage.removeItem(key))
    Object.entries(nextData).forEach(([key, value]) => localStorage.setItem(key, value))
  } catch {
    try {
      getBackupKeys().forEach((key) => localStorage.removeItem(key))
      Object.entries(previousData).forEach(([key, value]) => localStorage.setItem(key, value))
      throw new BackupMutationError(true)
    } catch {
      throw new BackupMutationError(false)
    }
  }
}

function isBackupEnvelope(value: unknown): value is BackupEnvelope {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const candidate = value as Record<string, unknown>
  return (
    candidate.app === 'pettography' &&
    (candidate.version === 1 || candidate.version === BACKUP_FORMAT_VERSION) &&
    typeof candidate.exportedAt === 'string' &&
    !Number.isNaN(Date.parse(candidate.exportedAt)) &&
    isBackupData(candidate.data) &&
    (candidate.version === BACKUP_FORMAT_VERSION ? typeof candidate.checksum === 'string' : true)
  )
}

function focusById(id: string): void {
  globalThis.requestAnimationFrame(() => document.getElementById(id)?.focus())
}

function Backup() {
  const { t, i18n } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('backup.title'))

  const [keys, setKeys] = useState<string[]>(() => getBackupKeys())
  const [pendingRestore, setPendingRestore] = useState<PendingRestore | null>(null)
  const [wipeOpen, setWipeOpen] = useState(false)
  const [operation, setOperation] = useState<Operation>('idle')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const restoreDialogRef = useRef<HTMLDivElement>(null)
  const wipeDialogRef = useRef<HTMLDivElement>(null)
  const isBusy = operation !== 'idle'

  useEffect(() => {
    const activeDialog = pendingRestore
      ? restoreDialogRef.current
      : wipeOpen
        ? wipeDialogRef.current
        : null
    if (!activeDialog) return
    activeDialog.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || isBusy) return
      if (pendingRestore) {
        setPendingRestore(null)
        focusById('backup-import-trigger')
      } else {
        setWipeOpen(false)
        focusById('backup-wipe-trigger')
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isBusy, pendingRestore, wipeOpen])

  const formatDate = (value: string) => {
    const date = new Date(value)
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleString(i18n.resolvedLanguage ?? i18n.language)
  }

  const handleExport = async () => {
    if (keys.length === 0 || isBusy) return
    setOperation('exporting')
    try {
      const envelope = await createBackupEnvelope(collectBackupData())
      const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `pettography-backup-${envelope.exportedAt.slice(0, 10)}.json`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      toast(t('backup.exportedToast'), 'success')
    } catch {
      toast(t('backup.exportFailedToast'), 'error')
    } finally {
      setOperation('idle')
    }
  }

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || isBusy) return
    if (file.size > MAX_BACKUP_FILE_BYTES) {
      toast(t('backup.fileTooLargeToast'), 'error')
      return
    }

    setOperation('reading')
    try {
      const parsed: unknown = JSON.parse(await file.text())
      if (!isBackupEnvelope(parsed)) throw new Error('Invalid backup envelope')

      const filteredEntries = Object.entries(parsed.data).filter(([key]) => isBackupKey(key))

      if (
        filteredEntries.length === 0 ||
        filteredEntries.length > MAX_BACKUP_KEY_COUNT ||
        (parsed.version === BACKUP_FORMAT_VERSION && !(await verifyBackupEnvelope(parsed)))
      ) {
        throw new Error('Invalid backup contents')
      }

      setWipeOpen(false)
      setPendingRestore({
        exportedAt: parsed.exportedAt,
        data: Object.fromEntries(filteredEntries),
        checksum: parsed.version === BACKUP_FORMAT_VERSION ? parsed.checksum : undefined,
      })
    } catch {
      toast(t('backup.invalidFileToast'), 'error')
    } finally {
      setOperation('idle')
    }
  }

  const cancelRestore = () => {
    setPendingRestore(null)
    focusById('backup-import-trigger')
  }

  const confirmRestore = () => {
    if (!pendingRestore || isBusy) return
    setOperation('restoring')
    try {
      replaceBackupData(pendingRestore.data)
      setKeys(Object.keys(pendingRestore.data).sort())
      setPendingRestore(null)
      toast(t('backup.importedToast'), 'success')
      globalThis.setTimeout(() => globalThis.location.reload(), 600)
    } catch (error) {
      const messageKey =
        error instanceof BackupMutationError && !error.rolledBack
          ? 'backup.rollbackFailedToast'
          : 'backup.restoreFailedToast'
      toast(t(messageKey), 'error')
      setOperation('idle')
    }
  }

  const cancelWipe = () => {
    setWipeOpen(false)
    focusById('backup-wipe-trigger')
  }

  const confirmWipe = () => {
    if (isBusy) return
    setOperation('wiping')
    try {
      replaceBackupData({})
      setKeys([])
      setWipeOpen(false)
      toast(t('backup.wipedToast'), 'success')
      globalThis.setTimeout(() => globalThis.location.reload(), 600)
    } catch (error) {
      const messageKey =
        error instanceof BackupMutationError && !error.rolledBack
          ? 'backup.rollbackFailedToast'
          : 'backup.wipeFailedToast'
      toast(t(messageKey), 'error')
      setOperation('idle')
    }
  }

  return (
    <section className={styles.page} aria-busy={isBusy}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{t('backup.formatNote')}</p>
        <h1>{t('backup.title')}</h1>
        <p className={styles.subtitle}>{t('backup.subtitle')}</p>
        <p className={styles.storageCount} role="status">
          {keys.length > 0 ? t('backup.storedCount', { count: keys.length }) : t('backup.empty')}
        </p>
      </header>

      <div className={styles.workspace}>
        <section className={styles.actionSection} aria-labelledby="backup-export-heading">
          <div className={styles.sectionCopy}>
            <span className={styles.step} aria-hidden="true">
              01
            </span>
            <div>
              <h2 id="backup-export-heading">{t('backup.exportTitle')}</h2>
              <p>{t('backup.exportDesc')}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="primary"
            onClick={handleExport}
            disabled={keys.length === 0 || isBusy}
            isLoading={operation === 'exporting'}
          >
            {t('backup.exportButton')}
          </Button>
        </section>

        <section className={styles.actionSection} aria-labelledby="backup-import-heading">
          <div className={styles.sectionCopy}>
            <span className={styles.step} aria-hidden="true">
              02
            </span>
            <div>
              <h2 id="backup-import-heading">{t('backup.importTitle')}</h2>
              <p>{t('backup.importDesc')}</p>
              <span className={styles.fileHint}>{t('backup.fileHint')}</span>
            </div>
          </div>
          <input
            ref={fileInputRef}
            className={styles.fileInput}
            type="file"
            accept=".json,application/json"
            onChange={handleImportFile}
          />
          <Button
            id="backup-import-trigger"
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy}
            isLoading={operation === 'reading'}
          >
            {t('backup.importButton')}
          </Button>
        </section>

        {pendingRestore && (
          <div
            ref={restoreDialogRef}
            className={styles.confirmPanel}
            role="alertdialog"
            aria-labelledby="backup-restore-title"
            aria-describedby="backup-restore-description"
            tabIndex={-1}
          >
            <div className={styles.confirmHead}>
              <span className={styles.confirmLabel}>SHA-256</span>
              <h2 id="backup-restore-title">{t('backup.confirmTitle')}</h2>
            </div>
            <dl className={styles.restoreMeta}>
              <div>
                <dt>{t('backup.confirmBackupDate', { date: '' }).replace(': ', '')}</dt>
                <dd>{formatDate(pendingRestore.exportedAt)}</dd>
              </div>
              <div>
                <dt>
                  {t('backup.confirmIncludes', { count: Object.keys(pendingRestore.data).length })}
                </dt>
                <dd>{Object.keys(pendingRestore.data).length}</dd>
              </div>
            </dl>
            {pendingRestore.checksum && (
              <code className={styles.checksum}>
                {t('backup.confirmChecksum', { hash: pendingRestore.checksum })}
              </code>
            )}
            <ul
              className={styles.keyList}
              aria-label={t('backup.confirmIncludes', {
                count: Object.keys(pendingRestore.data).length,
              })}
            >
              {Object.keys(pendingRestore.data)
                .sort()
                .map((key) => (
                  <li key={key}>{key}</li>
                ))}
            </ul>
            <div id="backup-restore-description" className={styles.warningCopy}>
              <p>{t('backup.confirmWarning')}</p>
              <p>{t('backup.rollbackNote')}</p>
            </div>
            <div className={styles.confirmActions}>
              <Button
                type="button"
                variant="primary"
                onClick={confirmRestore}
                isLoading={operation === 'restoring'}
              >
                {t('backup.confirmRestore')}
              </Button>
              <Button type="button" variant="outline" onClick={cancelRestore} disabled={isBusy}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        )}

        <section
          className={`${styles.actionSection} ${styles.dangerSection}`}
          aria-labelledby="backup-wipe-heading"
        >
          <div className={styles.sectionCopy}>
            <span className={styles.step} aria-hidden="true">
              03
            </span>
            <div>
              <h2 id="backup-wipe-heading">{t('backup.wipeTitle')}</h2>
              <p>{t('backup.wipeDesc')}</p>
            </div>
          </div>
          <Button
            id="backup-wipe-trigger"
            type="button"
            variant="outline"
            className={styles.dangerTrigger}
            onClick={() => {
              setPendingRestore(null)
              setWipeOpen(true)
            }}
            disabled={keys.length === 0 || isBusy}
          >
            {t('backup.wipeButton')}
          </Button>
        </section>

        {wipeOpen && (
          <div
            ref={wipeDialogRef}
            className={`${styles.confirmPanel} ${styles.wipePanel}`}
            role="region"
            aria-labelledby="backup-wipe-confirm-title"
            aria-describedby="backup-wipe-confirm-description"
            tabIndex={-1}
          >
            <h2 id="backup-wipe-confirm-title">{t('backup.wipeTitle')}</h2>
            <p id="backup-wipe-confirm-description">{t('backup.wipeConfirm')}</p>
            <div className={styles.confirmActions}>
              <Button type="button" variant="outline" onClick={cancelWipe} disabled={isBusy}>
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                variant="primary"
                className={styles.dangerButton}
                onClick={confirmWipe}
                isLoading={operation === 'wiping'}
              >
                {t('backup.wipeButton')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default Backup
