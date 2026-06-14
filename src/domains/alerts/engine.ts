import { ALERT_SEVERITIES, type AlertItem, type AlertSeverity } from './schema'

/** Lower rank = more urgent (sorts first). */
export function severityRank(severity: AlertSeverity): number {
  const i = ALERT_SEVERITIES.indexOf(severity)
  return i === -1 ? ALERT_SEVERITIES.length : i
}

/**
 * Sort alerts by urgency (overdue → due → soon → info), then by the soonest
 * relevant date, then by id for stability. Pure, non-mutating.
 */
export function sortAlerts(items: AlertItem[]): AlertItem[] {
  return [...items].sort((a, b) => {
    const rank = severityRank(a.severity) - severityRank(b.severity)
    if (rank !== 0) return rank
    const da = a.dateISO ?? ''
    const db = b.dateISO ?? ''
    if (da && db && da !== db) return da.localeCompare(db)
    if (da !== db) return da ? -1 : 1 // items with a date come first within a tier
    return a.id.localeCompare(b.id)
  })
}

/** Count items per severity for summary badges. */
export function countBySeverity(items: AlertItem[]): Record<AlertSeverity, number> {
  const out: Record<AlertSeverity, number> = { overdue: 0, due: 0, soon: 0, info: 0 }
  for (const item of items) out[item.severity] += 1
  return out
}

/** Number of items that genuinely need action (everything but plain info). */
export function actionableCount(items: AlertItem[]): number {
  return items.filter((i) => i.severity !== 'info').length
}
