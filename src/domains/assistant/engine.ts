import { RED_FLAGS } from './data'

import type {
  AssistantData,
  Severity,
  SpeciesCategory,
  SymptomTopic,
  TopicDecision,
  TriageOption,
  TriageResult,
} from './schema'

/** Ordinal rank for a severity, useful for sorting/comparison. */
export function severityRank(severity: Severity): number {
  switch (severity) {
    case 'info':
      return 0
    case 'caution':
      return 1
    case 'urgent':
      return 2
  }
}

/** True when severity is the most serious (urgent) level. */
export function isUrgent(severity: Severity): boolean {
  return severity === 'urgent'
}

/** Looks up the decision structure for a topic. */
export function decisionForTopic(topicId: string, data: AssistantData): TopicDecision | null {
  return data.decisions.find((d) => d.topicId === topicId) ?? null
}

/** Finds a specific option within a topic's (single) follow-up question. */
function findOption(decision: TopicDecision, optionId: string): TriageOption | null {
  for (const question of decision.questions) {
    const option = question.options.find((o) => o.id === optionId)
    if (option) return option
  }
  return null
}

/**
 * Whether a (topicId, optionId) pairing is a known red flag.
 * Cross-checked against the explicit RED_FLAGS allowlist for transparency.
 */
export function isRedFlag(topicId: string, optionId: string): boolean {
  return RED_FLAGS.some((f) => f.topicId === topicId && f.optionId === optionId)
}

/**
 * Resolves a topic + chosen option into a triage outcome.
 * Returns null for unknown topic or option ids.
 *
 * `emergency` is true when the option is flagged OR appears in RED_FLAGS,
 * so the two sources can never silently drift apart.
 */
export function resolveTriage(
  topicId: string,
  optionId: string,
  data: AssistantData,
): TriageResult | null {
  const decision = decisionForTopic(topicId, data)
  if (!decision) return null

  const option = findOption(decision, optionId)
  if (!option) return null

  const emergency = Boolean(option.emergency) || isRedFlag(topicId, optionId)

  return {
    severity: option.severity,
    adviceKey: option.adviceKey,
    emergency,
  }
}

/**
 * Returns the i18n key for a category-specific note, or null when none.
 * Key resolves to `assistant.categoryNotes.<returnValue>`.
 */
export function categoryNote(
  topicId: string,
  category: SpeciesCategory | null,
  data: AssistantData,
): string | null {
  if (!category) return null
  return data.categoryNotes[topicId]?.[category] ?? null
}

/**
 * Ordering/filtering of topics for a category. All topics apply broadly, so
 * this surfaces each category's most relevant concern first while keeping the
 * remaining topics in their canonical order.
 */
export function topicsForCategory(
  category: SpeciesCategory | null,
  data: AssistantData,
): readonly SymptomTopic[] {
  const topics = data.topics
  if (!category) return topics

  const priorityByCategory: Record<SpeciesCategory, string> = {
    reptile: 'tempHumidity',
    arthropod: 'sheddingIssue',
    bird: 'respiratory',
    amphibian: 'respiratory',
    mammal: 'lethargy',
  }

  const priorityId = priorityByCategory[category]
  const priority = topics.filter((tp) => tp.id === priorityId)
  if (priority.length === 0) return topics

  const rest = topics.filter((tp) => tp.id !== priorityId)
  return [...priority, ...rest]
}
