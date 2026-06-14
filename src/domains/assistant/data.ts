import type { AssistantData, SymptomTopic, TopicDecision } from './schema'

/**
 * Rule-based Care Assistant decision tree.
 *
 * This module holds ONLY ids + structure (severity / advice keys / emergency
 * flags). All display text lives in i18n under `assistant.*`:
 *   - topic label   → `assistant.topics.<topicId>.label`
 *   - question text  → `assistant.topics.<topicId>.question`
 *   - option label  → `assistant.topics.<topicId>.options.<optionId>`
 *   - advice body   → `assistant.advice.<adviceKey>`
 *   - category note  → `assistant.categoryNotes.<key>`
 */

export const SYMPTOM_TOPICS: readonly SymptomTopic[] = [
  { id: 'anorexia', icon: '🍽️' },
  { id: 'sheddingIssue', icon: '🦎' },
  { id: 'respiratory', icon: '🫁' },
  { id: 'lethargy', icon: '😴' },
  { id: 'injury', icon: '🩹' },
  { id: 'tempHumidity', icon: '🌡️' },
  { id: 'behavior', icon: '🔄' },
] as const

/**
 * One follow-up question per topic, each with 2-3 options that map to a
 * triage outcome. Red flags carry `emergency: true` + `severity: 'urgent'`.
 */
export const TOPIC_DECISIONS: readonly TopicDecision[] = [
  {
    topicId: 'anorexia',
    questions: [
      {
        id: 'duration',
        options: [
          { id: 'recent', severity: 'info', adviceKey: 'anorexiaRecent' },
          { id: 'weeks', severity: 'caution', adviceKey: 'anorexiaWeeks' },
          { id: 'weightLoss', severity: 'urgent', adviceKey: 'anorexiaWeightLoss' },
        ],
      },
    ],
  },
  {
    topicId: 'sheddingIssue',
    questions: [
      {
        id: 'retained',
        options: [
          { id: 'inProgress', severity: 'info', adviceKey: 'sheddingInProgress' },
          { id: 'stuckPatches', severity: 'caution', adviceKey: 'sheddingStuckPatches' },
          {
            id: 'toesOrEyes',
            severity: 'urgent',
            adviceKey: 'sheddingToesOrEyes',
            emergency: true,
          },
        ],
      },
    ],
  },
  {
    topicId: 'respiratory',
    questions: [
      {
        id: 'signs',
        options: [
          { id: 'mildWheeze', severity: 'caution', adviceKey: 'respiratoryMildWheeze' },
          {
            id: 'openMouth',
            severity: 'urgent',
            adviceKey: 'respiratoryOpenMouth',
            emergency: true,
          },
          {
            id: 'mucusBubbles',
            severity: 'urgent',
            adviceKey: 'respiratoryMucusBubbles',
            emergency: true,
          },
        ],
      },
    ],
  },
  {
    topicId: 'lethargy',
    questions: [
      {
        id: 'severity',
        options: [
          { id: 'slightlyQuiet', severity: 'info', adviceKey: 'lethargySlightlyQuiet' },
          { id: 'notMoving', severity: 'caution', adviceKey: 'lethargyNotMoving' },
          {
            id: 'unresponsive',
            severity: 'urgent',
            adviceKey: 'lethargyUnresponsive',
            emergency: true,
          },
        ],
      },
    ],
  },
  {
    topicId: 'injury',
    questions: [
      {
        id: 'bleeding',
        options: [
          { id: 'minorScrape', severity: 'caution', adviceKey: 'injuryMinorScrape' },
          {
            id: 'activeBleeding',
            severity: 'urgent',
            adviceKey: 'injuryActiveBleeding',
            emergency: true,
          },
          { id: 'prolapse', severity: 'urgent', adviceKey: 'injuryProlapse', emergency: true },
        ],
      },
    ],
  },
  {
    topicId: 'tempHumidity',
    questions: [
      {
        id: 'reading',
        options: [
          { id: 'slightlyOff', severity: 'info', adviceKey: 'tempHumiditySlightlyOff' },
          { id: 'wayOff', severity: 'caution', adviceKey: 'tempHumidityWayOff' },
          {
            id: 'burnOrHeatStress',
            severity: 'urgent',
            adviceKey: 'tempHumidityBurnOrHeatStress',
            emergency: true,
          },
        ],
      },
    ],
  },
  {
    topicId: 'behavior',
    questions: [
      {
        id: 'kind',
        options: [
          { id: 'newRoutine', severity: 'info', adviceKey: 'behaviorNewRoutine' },
          { id: 'hiding', severity: 'caution', adviceKey: 'behaviorHiding' },
          {
            id: 'aggressionOrTremor',
            severity: 'caution',
            adviceKey: 'behaviorAggressionOrTremor',
          },
        ],
      },
    ],
  },
] as const

/**
 * Red-flag combos (topicId + optionId) that MUST surface emergency routing.
 * Kept as an explicit allowlist for transparency and tests; it stays in sync
 * with the `emergency: true` options above.
 */
export const RED_FLAGS: readonly { topicId: string; optionId: string }[] = [
  { topicId: 'sheddingIssue', optionId: 'toesOrEyes' },
  { topicId: 'respiratory', optionId: 'openMouth' },
  { topicId: 'respiratory', optionId: 'mucusBubbles' },
  { topicId: 'lethargy', optionId: 'unresponsive' },
  { topicId: 'injury', optionId: 'activeBleeding' },
  { topicId: 'injury', optionId: 'prolapse' },
  { topicId: 'tempHumidity', optionId: 'burnOrHeatStress' },
] as const

/**
 * Category-specific framing notes. Maps `categoryNotes[topicId][category]` to
 * an i18n key under `assistant.categoryNotes.<key>`. Returns null when there
 * is no special note for that pairing.
 */
export const CATEGORY_NOTES: AssistantData['categoryNotes'] = {
  anorexia: {
    arthropod: 'anorexiaArthropod',
    reptile: 'anorexiaReptile',
    amphibian: 'anorexiaAmphibian',
  },
  sheddingIssue: {
    arthropod: 'sheddingArthropod',
    reptile: 'sheddingReptile',
  },
  respiratory: {
    amphibian: 'respiratoryAmphibian',
    bird: 'respiratoryBird',
  },
  lethargy: {
    reptile: 'lethargyReptile',
    arthropod: 'lethargyArthropod',
  },
  tempHumidity: {
    amphibian: 'tempHumidityAmphibian',
    reptile: 'tempHumidityReptile',
  },
}

/** Bundled rule base passed to the engine. */
export const ASSISTANT_DATA: AssistantData = {
  topics: SYMPTOM_TOPICS,
  decisions: TOPIC_DECISIONS,
  categoryNotes: CATEGORY_NOTES,
}
