import { speciesCategorySchema } from '@features/species'
import { z } from 'zod'

/**
 * Triage severity. Mapped to UI severity Badge variants on the page:
 *   info → info, caution → warning, urgent → error.
 */
export const severitySchema = z.enum(['info', 'caution', 'urgent'])
export type Severity = z.infer<typeof severitySchema>

export type SpeciesCategory = z.infer<typeof speciesCategorySchema>

/** A single answer option within a topic's follow-up question. */
export const triageOptionSchema = z.object({
  id: z.string(),
  severity: severitySchema,
  /** Maps to the i18n key `assistant.advice.<adviceKey>`. */
  adviceKey: z.string(),
  /** When true the option is a red flag that surfaces emergency routing. */
  emergency: z.boolean().optional(),
})
export type TriageOption = z.infer<typeof triageOptionSchema>

/** The single follow-up question asked for a topic. */
export const triageQuestionSchema = z.object({
  id: z.string(),
  options: z.array(triageOptionSchema).min(2),
})
export type TriageQuestion = z.infer<typeof triageQuestionSchema>

/** A symptom topic shown in the step-1 chip grid. */
export const symptomTopicSchema = z.object({
  id: z.string(),
  icon: z.string(),
})
export type SymptomTopic = z.infer<typeof symptomTopicSchema>

/** The decision structure attached to a topic (1 follow-up question). */
export const topicDecisionSchema = z.object({
  topicId: z.string(),
  questions: z.array(triageQuestionSchema).min(1),
})
export type TopicDecision = z.infer<typeof topicDecisionSchema>

/** Resolved triage outcome returned by the engine. */
export interface TriageResult {
  severity: Severity
  adviceKey: string
  emergency: boolean
}

/** The full rule base consumed by the engine. */
export interface AssistantData {
  topics: readonly SymptomTopic[]
  decisions: readonly TopicDecision[]
  categoryNotes: Readonly<Record<string, Partial<Record<SpeciesCategory, string>>>>
}
