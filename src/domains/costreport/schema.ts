import { z } from 'zod'

/**
 * Persisted view preference for the cost report. `selectedYear` of null means
 * the "all time" (전체 기간) view across every recorded year.
 */
export const costReportPrefsSchema = z.object({
  selectedYear: z.number().int().nullable(),
})

export type CostReportPrefs = z.infer<typeof costReportPrefsSchema>
