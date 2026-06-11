const BACKUP_CHECKSUM_ALGORITHM = 'SHA-256'
const BACKUP_CHECKSUM_CANONICAL = 'pettography-backup-v1'

interface BackupChecksum {
  algorithm: typeof BACKUP_CHECKSUM_ALGORITHM
  canonical: typeof BACKUP_CHECKSUM_CANONICAL
  value: string
}

export interface BackupEnvelope {
  app: 'pettography'
  version: 1
  exportedAt: string
  data: Record<string, string>
  checksum?: BackupChecksum
}

type ChecksummedBackupEnvelope = BackupEnvelope & {
  checksum: BackupChecksum
}

export function isBackupData(data: unknown): data is Record<string, unknown> {
  return typeof data === 'object' && data !== null && !Array.isArray(data)
}

function isBackupChecksum(value: unknown): value is BackupChecksum {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const checksum = value as Partial<BackupChecksum>
  return (
    checksum.algorithm === BACKUP_CHECKSUM_ALGORITHM &&
    checksum.canonical === BACKUP_CHECKSUM_CANONICAL &&
    typeof checksum.value === 'string' &&
    /^[a-f0-9]{64}$/.test(checksum.value)
  )
}

function sortBackupData(data: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(data).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
}

function canonicalizeBackupPayload(envelope: Omit<BackupEnvelope, 'checksum'>): string {
  return JSON.stringify({
    app: envelope.app,
    version: envelope.version,
    exportedAt: envelope.exportedAt,
    data: sortBackupData(envelope.data),
  })
}

async function computeBackupChecksum(envelope: Omit<BackupEnvelope, 'checksum'>): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalizeBackupPayload(envelope))
  const digest = await globalThis.crypto.subtle.digest(BACKUP_CHECKSUM_ALGORITHM, bytes)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export async function createBackupEnvelope(
  data: Record<string, string>,
  exportedAt = new Date().toISOString(),
): Promise<ChecksummedBackupEnvelope> {
  const envelope = {
    app: 'pettography',
    version: 1,
    exportedAt,
    data: sortBackupData(data),
  } satisfies Omit<BackupEnvelope, 'checksum'>

  return {
    ...envelope,
    checksum: {
      algorithm: BACKUP_CHECKSUM_ALGORITHM,
      canonical: BACKUP_CHECKSUM_CANONICAL,
      value: await computeBackupChecksum(envelope),
    },
  }
}

export async function verifyBackupEnvelope(envelope: BackupEnvelope): Promise<boolean> {
  if (!envelope.checksum) return true
  if (!isBackupChecksum(envelope.checksum)) return false
  const expected = await computeBackupChecksum({
    app: envelope.app,
    version: envelope.version,
    exportedAt: envelope.exportedAt,
    data: envelope.data,
  })
  return envelope.checksum.value === expected
}
