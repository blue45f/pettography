import Button from '@components/common/Button'
import { useToast } from '@components/common/Toast'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import styles from './Backup.module.css'
import {
  type BackupEnvelope,
  createBackupEnvelope,
  isBackupData,
  verifyBackupEnvelope,
} from './backupEnvelope'

const BACKUP_KEY_PREFIXES = ['pettography.', 'onboarding-store']
const MAX_BACKUP_FILE_BYTES = 2 * 1024 * 1024

interface PendingImport {
  exportedAt: string
  data: Record<string, string>
  checksum?: string
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

async function buildEnvelope(): Promise<BackupEnvelope> {
  const data: Record<string, string> = {}
  for (const k of collectKeys()) {
    const v = localStorage.getItem(k)
    if (v !== null) data[k] = v
  }
  return createBackupEnvelope(data)
}

function Backup() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('backup.title'))

  const fileInput = useRef<HTMLInputElement | null>(null)
  const [keys, setKeys] = useState<string[]>(() => collectKeys())
  const [pending, setPending] = useState<PendingImport | null>(null)
  const [wipePending, setWipePending] = useState(false)
  const confirmRef = useRef<HTMLDivElement | null>(null)
  const wipeConfirmRef = useRef<HTMLDivElement | null>(null)

  // Move focus into the restore-confirmation dialog when it opens (WAI-ARIA alertdialog).
  useEffect(() => {
    if (pending) confirmRef.current?.focus()
  }, [pending])

  // Same focus handling for the wipe-confirmation dialog.
  useEffect(() => {
    if (wipePending) wipeConfirmRef.current?.focus()
  }, [wipePending])

  async function handleExport() {
    const envelope = await buildEnvelope()
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
      if (file.size > MAX_BACKUP_FILE_BYTES) {
        throw new Error('too-large')
      }
      const text = await file.text()
      const parsed = JSON.parse(text) as Partial<BackupEnvelope>
      if (parsed.app !== 'pettography' || parsed.version !== 1 || !isBackupData(parsed.data)) {
        throw new Error('invalid')
      }
      const envelope: BackupEnvelope = {
        app: parsed.app,
        version: parsed.version,
        exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : '',
        data: Object.fromEntries(
          Object.entries(parsed.data).filter(
            (entry): entry is [string, string] => typeof entry[1] === 'string'
          )
        ),
        checksum: parsed.checksum,
      }
      if (!(await verifyBackupEnvelope(envelope))) {
        throw new Error('checksum')
      }
      const importable: Record<string, string> = {}
      for (const [k, v] of Object.entries(envelope.data)) {
        if (isBackupKey(k) && typeof v === 'string') importable[k] = v
      }
      setPending({
        exportedAt: envelope.exportedAt,
        data: importable,
        checksum: envelope.checksum?.value,
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
    setTimeout(() => globalThis.location.reload(), 600)
  }

  function cancelImport() {
    setPending(null)
  }

  function confirmWipe() {
    for (const k of collectKeys()) {
      localStorage.removeItem(k)
    }
    setKeys([])
    setWipePending(false)
    toast(t('backup.wipedToast'), 'success')
    setTimeout(() => globalThis.location.reload(), 600)
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
        <Button variant="primary" onClick={() => void handleExport()} disabled={keys.length === 0}>
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
            {pending.checksum && (
              <p className={styles.confirmMeta}>
                {t('backup.confirmChecksum', { hash: pending.checksum.slice(0, 12) })}
              </p>
            )}
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
        <Button
          variant="ghost"
          onClick={() => setWipePending(true)}
          disabled={keys.length === 0 || wipePending}
        >
          {t('backup.wipeButton')}
        </Button>

        {wipePending && (
          <div
            ref={wipeConfirmRef}
            tabIndex={-1}
            className={styles.confirmPanel}
            role="alertdialog"
            aria-labelledby="wipe-confirm-heading"
          >
            <h3 id="wipe-confirm-heading" className={styles.confirmTitle}>
              {t('backup.wipeTitle')}
            </h3>
            <p className={styles.confirmWarning}>
              <span aria-hidden="true">⚠️ </span>
              {t('backup.wipeConfirm')}
            </p>
            <div className={styles.confirmActions}>
              <Button variant="primary" onClick={confirmWipe}>
                {t('backup.wipeButton')}
              </Button>
              <Button variant="ghost" onClick={() => setWipePending(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        )}
      </section>
    </section>
  )
}

export default Backup
