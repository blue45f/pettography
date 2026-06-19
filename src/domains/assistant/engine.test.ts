import { describe, it, expect } from 'vitest'

import { ASSISTANT_DATA, RED_FLAGS, TOPIC_DECISIONS } from './data'
import {
  categoryNote,
  decisionForTopic,
  isRedFlag,
  isUrgent,
  resolveTriage,
  severityRank,
  topicsForCategory,
} from './engine'

describe('severityRank', () => {
  it('orders info < caution < urgent', () => {
    expect(severityRank('info')).toBeLessThan(severityRank('caution'))
    expect(severityRank('caution')).toBeLessThan(severityRank('urgent'))
  })

  it('isUrgent is true only for urgent', () => {
    expect(isUrgent('urgent')).toBe(true)
    expect(isUrgent('caution')).toBe(false)
    expect(isUrgent('info')).toBe(false)
  })
})

describe('resolveTriage — red flags', () => {
  it('every RED_FLAGS combo resolves to urgent + emergency', () => {
    for (const flag of RED_FLAGS) {
      const result = resolveTriage(flag.topicId, flag.optionId, ASSISTANT_DATA)
      expect(result).not.toBeNull()
      expect(result?.severity).toBe('urgent')
      expect(result?.emergency).toBe(true)
    }
  })

  it('respiratory open-mouth breathing is an emergency', () => {
    const result = resolveTriage('respiratory', 'openMouth', ASSISTANT_DATA)
    expect(result).toEqual({
      severity: 'urgent',
      adviceKey: 'respiratoryOpenMouth',
      emergency: true,
    })
  })

  it('injury active bleeding is an emergency', () => {
    const result = resolveTriage('injury', 'activeBleeding', ASSISTANT_DATA)
    expect(result?.emergency).toBe(true)
    expect(result?.severity).toBe('urgent')
  })
})

describe('resolveTriage — normal options', () => {
  it('recent anorexia is info and not an emergency', () => {
    const result = resolveTriage('anorexia', 'recent', ASSISTANT_DATA)
    expect(result).toEqual({
      severity: 'info',
      adviceKey: 'anorexiaRecent',
      emergency: false,
    })
  })

  it('weeks-long anorexia is caution', () => {
    const result = resolveTriage('anorexia', 'weeks', ASSISTANT_DATA)
    expect(result?.severity).toBe('caution')
    expect(result?.emergency).toBe(false)
  })

  it('minor scrape is caution, not emergency', () => {
    const result = resolveTriage('injury', 'minorScrape', ASSISTANT_DATA)
    expect(result?.severity).toBe('caution')
    expect(result?.emergency).toBe(false)
  })

  it('shedding in progress is info', () => {
    const result = resolveTriage('sheddingIssue', 'inProgress', ASSISTANT_DATA)
    expect(result?.severity).toBe('info')
    expect(result?.emergency).toBe(false)
  })
})

describe('resolveTriage — unknown ids', () => {
  it('unknown topic → null', () => {
    expect(resolveTriage('does-not-exist', 'recent', ASSISTANT_DATA)).toBeNull()
  })

  it('unknown option → null', () => {
    expect(resolveTriage('anorexia', 'does-not-exist', ASSISTANT_DATA)).toBeNull()
  })
})

describe('data integrity', () => {
  it('every emergency option is listed in RED_FLAGS and vice versa', () => {
    const emergencyOptions = new Set<string>()
    for (const decision of TOPIC_DECISIONS) {
      for (const question of decision.questions) {
        for (const option of question.options) {
          if (option.emergency) emergencyOptions.add(`${decision.topicId}/${option.id}`)
        }
      }
    }
    const redFlagKeys = new Set(RED_FLAGS.map((f) => `${f.topicId}/${f.optionId}`))
    expect(emergencyOptions).toEqual(redFlagKeys)
  })

  it('every emergency option is severity urgent', () => {
    for (const decision of TOPIC_DECISIONS) {
      for (const question of decision.questions) {
        for (const option of question.options) {
          if (option.emergency) expect(option.severity).toBe('urgent')
        }
      }
    }
  })

  it('isRedFlag matches the allowlist', () => {
    expect(isRedFlag('respiratory', 'openMouth')).toBe(true)
    expect(isRedFlag('anorexia', 'recent')).toBe(false)
  })

  it('every topic has a decision structure', () => {
    for (const topic of ASSISTANT_DATA.topics) {
      expect(decisionForTopic(topic.id, ASSISTANT_DATA)).not.toBeNull()
    }
  })
})

describe('categoryNote', () => {
  it('returns the mapped key for a known pairing', () => {
    expect(categoryNote('anorexia', 'arthropod', ASSISTANT_DATA)).toBe('anorexiaArthropod')
    expect(categoryNote('anorexia', 'reptile', ASSISTANT_DATA)).toBe('anorexiaReptile')
  })

  it('returns null when no note exists for the pairing', () => {
    expect(categoryNote('anorexia', 'mammal', ASSISTANT_DATA)).toBeNull()
    expect(categoryNote('behavior', 'reptile', ASSISTANT_DATA)).toBeNull()
  })

  it('returns null when category is null', () => {
    expect(categoryNote('anorexia', null, ASSISTANT_DATA)).toBeNull()
  })
})

describe('topicsForCategory', () => {
  it('returns all topics unchanged when category is null', () => {
    const result = topicsForCategory(null, ASSISTANT_DATA)
    expect(result).toEqual(ASSISTANT_DATA.topics)
  })

  it('prioritizes tempHumidity for reptiles without dropping topics', () => {
    const result = topicsForCategory('reptile', ASSISTANT_DATA)
    expect(result[0]?.id).toBe('tempHumidity')
    expect(result).toHaveLength(ASSISTANT_DATA.topics.length)
    const ids = result.map((tp) => tp.id).sort((a, b) => a.localeCompare(b))
    const originalIds = ASSISTANT_DATA.topics.map((tp) => tp.id).sort((a, b) => a.localeCompare(b))
    expect(ids).toEqual(originalIds)
  })

  it('prioritizes respiratory for birds', () => {
    const result = topicsForCategory('bird', ASSISTANT_DATA)
    expect(result[0]?.id).toBe('respiratory')
  })
})
