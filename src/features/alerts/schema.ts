/** Cross-feature "needs attention" aggregation types. Derived at render time
 *  from the other feature stores — no persistence of its own. */

export type AlertSeverity = 'overdue' | 'due' | 'soon' | 'info'

export const ALERT_SEVERITIES: readonly AlertSeverity[] = [
  'overdue',
  'due',
  'soon',
  'info',
] as const

export interface AlertItem {
  /** Stable id (source + entity id) for React keys + dedupe. */
  id: string
  /** Originating feature, used for the icon. */
  source: string
  severity: AlertSeverity
  /** i18n key for the alert title. */
  titleKey: string
  /** Interpolation params for the title (already-resolved strings/numbers). */
  params?: Record<string, string | number>
  /** Relevant date (YYYY-MM-DD) if any, for sorting + display. */
  dateISO?: string | null
  /** Route to the feature page. */
  route: string
}
