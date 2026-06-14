import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { randomUUID } from 'crypto'
import { JsonFileStore } from '../common/json-store'
import type { ForbiddenWordRule } from '../common/types'
import type {
  CreateForbiddenWordRuleDto,
  UpdateForbiddenWordRuleDto,
} from './dto/forbidden-word-rule.dto'

interface ModerationState {
  forbiddenWords: ForbiddenWordRule[]
}

export interface ModerationDecision {
  action: 'allow' | 'review' | 'block'
  hits: string[]
}

@Injectable()
export class ModerationService {
  private readonly store = new JsonFileStore<ModerationState>('moderation.json', () => ({
    forbiddenWords: [],
  }))
  private state = this.store.load()

  listForbiddenWords(): ForbiddenWordRule[] {
    return [...this.state.forbiddenWords].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  createForbiddenWord(input: CreateForbiddenWordRuleDto): ForbiddenWordRule {
    const phrase = input.phrase.trim()
    const normalizedPhrase = normalizeText(phrase)
    if (!normalizedPhrase) {
      throw new BadRequestException('Forbidden word phrase is required.')
    }
    this.assertUniquePhrase(normalizedPhrase)

    const now = new Date().toISOString()
    const rule: ForbiddenWordRule = {
      id: randomUUID(),
      phrase,
      normalizedPhrase,
      action: input.action,
      matchType: input.matchType,
      enabled: input.enabled ?? true,
      note: input.note?.trim() || null,
      createdAt: now,
      updatedAt: now,
    }
    this.state.forbiddenWords.push(rule)
    this.save()
    return rule
  }

  updateForbiddenWord(id: string, input: UpdateForbiddenWordRuleDto): ForbiddenWordRule {
    const rule = this.requireRule(id)
    if (input.phrase !== undefined) {
      const phrase = input.phrase.trim()
      const normalizedPhrase = normalizeText(phrase)
      if (!normalizedPhrase) {
        throw new BadRequestException('Forbidden word phrase is required.')
      }
      this.assertUniquePhrase(normalizedPhrase, id)
      rule.phrase = phrase
      rule.normalizedPhrase = normalizedPhrase
    }
    if (input.action !== undefined) rule.action = input.action
    if (input.matchType !== undefined) rule.matchType = input.matchType
    if (input.enabled !== undefined) rule.enabled = input.enabled
    if (input.note !== undefined) rule.note = input.note?.trim() || null
    rule.updatedAt = new Date().toISOString()
    this.save()
    return rule
  }

  removeForbiddenWord(id: string): void {
    const before = this.state.forbiddenWords.length
    this.state.forbiddenWords = this.state.forbiddenWords.filter((rule) => rule.id !== id)
    if (this.state.forbiddenWords.length === before) {
      throw new NotFoundException(`Forbidden word rule not found: ${id}`)
    }
    this.save()
  }

  evaluate(values: Array<string | undefined | null>): ModerationDecision {
    const texts = values.map((value) => normalizeText(value ?? '')).filter(Boolean)
    if (texts.length === 0) {
      return { action: 'allow', hits: [] }
    }

    const hits: string[] = []
    let action: ModerationDecision['action'] = 'allow'
    for (const rule of this.state.forbiddenWords) {
      if (!rule.enabled) continue
      const matched = texts.some((text) => matchesRule(text, rule))
      if (!matched) continue

      hits.push(rule.phrase)
      if (rule.action === 'block') {
        action = 'block'
      } else if (action !== 'block') {
        action = 'review'
      }
    }

    return { action, hits: [...new Set(hits)] }
  }

  private requireRule(id: string): ForbiddenWordRule {
    const rule = this.state.forbiddenWords.find((candidate) => candidate.id === id)
    if (!rule) {
      throw new NotFoundException(`Forbidden word rule not found: ${id}`)
    }
    return rule
  }

  private assertUniquePhrase(normalizedPhrase: string, exceptId?: string): void {
    const duplicated = this.state.forbiddenWords.some(
      (rule) => rule.id !== exceptId && rule.normalizedPhrase === normalizedPhrase
    )
    if (duplicated) {
      throw new ConflictException('Forbidden word phrase already exists.')
    }
  }

  private save(): void {
    this.store.save(this.state)
  }
}

function normalizeText(value: string): string {
  return value.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim()
}

function matchesRule(text: string, rule: ForbiddenWordRule): boolean {
  if (rule.matchType === 'contains') {
    return text.includes(rule.normalizedPhrase)
  }
  const pattern = new RegExp(
    `(^|[^\\p{L}\\p{N}_])${escapeRegExp(rule.normalizedPhrase)}(?=$|[^\\p{L}\\p{N}_])`,
    'u'
  )
  return pattern.test(text)
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
