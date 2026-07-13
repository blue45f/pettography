export const BACKUP_FORMAT_VERSION = 2 as const

export interface BackupEnvelopeV1 {
  app: 'pettography'
  version: 1
  exportedAt: string
  data: Record<string, string>
  checksum?: undefined
}

export interface BackupEnvelopeV2 {
  app: 'pettography'
  version: typeof BACKUP_FORMAT_VERSION
  exportedAt: string
  data: Record<string, string>
  checksum: string
}

export type BackupEnvelope = BackupEnvelopeV1 | BackupEnvelopeV2

type BackupPayload = Omit<BackupEnvelopeV2, 'checksum'>

function sortData(data: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(data).sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
  )
}

function serializePayload(payload: BackupPayload): string {
  return JSON.stringify({
    app: payload.app,
    version: payload.version,
    exportedAt: payload.exportedAt,
    data: sortData(payload.data),
  })
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false
  let mismatch = 0
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return mismatch === 0
}

export function isBackupData(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  return Object.entries(value).every(
    ([key, item]) => typeof key === 'string' && typeof item === 'string'
  )
}

export async function createBackupEnvelope(
  data: Record<string, string>,
  exportedAt = new Date().toISOString()
): Promise<BackupEnvelopeV2> {
  const payload: BackupPayload = {
    app: 'pettography',
    version: BACKUP_FORMAT_VERSION,
    exportedAt,
    data: sortData(data),
  }
  return {
    ...payload,
    checksum: await sha256(serializePayload(payload)),
  }
}

export async function verifyBackupEnvelope(envelope: BackupEnvelopeV2): Promise<boolean> {
  if (!/^[a-f0-9]{64}$/.test(envelope.checksum)) return false
  const expected = await sha256(
    serializePayload({
      app: envelope.app,
      version: envelope.version,
      exportedAt: envelope.exportedAt,
      data: envelope.data,
    })
  )
  return constantTimeEqual(envelope.checksum, expected)
}
