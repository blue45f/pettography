import { describe, expect, it } from 'vitest'

import { ADOPTION_SEED } from '../../backend/src/data/adoption.seed'
import { CARE_GUIDES_SEED } from '../../backend/src/data/care-guides.seed'
import { COMMUNITIES_SEED } from '../../backend/src/data/communities.seed'
import { FORUM_POSTS_SEED, FORUM_REPLIES_SEED } from '../../backend/src/data/forum.seed'
import { FUNERAL_SEED } from '../../backend/src/data/funeral.seed'
import { HOSPITALS_SEED } from '../../backend/src/data/hospitals.seed'
import { PARTNERS_SEED } from '../../backend/src/data/partners.seed'
import { SHOPS_SEED } from '../../backend/src/data/shops.seed'
import { SPECIES_SEED } from '../../backend/src/data/species.seed'

import { adoptionListingSchema } from './adoption/schema'
import { careGuideSchema } from './care-guides/schema'
import { communitySchema } from './communities/schema'
import { forumPostSchema, forumReplySchema } from './forum/schema'
import { funeralServiceSchema } from './funeral/schema'
import { hospitalSchema } from './hospitals/schema'
import { partnerApplicationSchema } from './partners/schema'
import { shopSchema } from './shops/schema'
import { speciesSchema } from './species/schema'

describe('frontend/backend API contracts', () => {
  it('keeps backend adoption responses compatible with the frontend adoption schema', () => {
    expect(adoptionListingSchema.array().safeParse(ADOPTION_SEED).success).toBe(true)
  })

  it('keeps backend care-guide responses compatible with the frontend care-guide schema', () => {
    expect(careGuideSchema.array().safeParse(CARE_GUIDES_SEED).success).toBe(true)
  })

  it('keeps backend community responses compatible with the frontend community schema', () => {
    expect(communitySchema.array().safeParse(COMMUNITIES_SEED).success).toBe(true)
  })

  it('keeps backend forum responses compatible with the frontend forum schemas', () => {
    expect(forumPostSchema.array().safeParse(FORUM_POSTS_SEED).success).toBe(true)
    expect(
      forumReplySchema.array().safeParse(Object.values(FORUM_REPLIES_SEED).flat()).success,
    ).toBe(true)
  })

  it('keeps backend funeral responses compatible with the frontend funeral schema', () => {
    expect(funeralServiceSchema.array().safeParse(FUNERAL_SEED).success).toBe(true)
  })

  it('keeps backend species responses compatible with the frontend species schema', () => {
    expect(speciesSchema.array().safeParse(SPECIES_SEED).success).toBe(true)
  })

  it('keeps backend hospital responses compatible with the frontend hospital schema', () => {
    expect(hospitalSchema.array().safeParse(HOSPITALS_SEED).success).toBe(true)
  })

  it('keeps backend shop responses compatible with the frontend shop schema', () => {
    expect(shopSchema.array().safeParse(SHOPS_SEED).success).toBe(true)
  })

  it('keeps backend partner responses compatible with the frontend partner schema', () => {
    expect(partnerApplicationSchema.array().safeParse(PARTNERS_SEED).success).toBe(true)
  })
})
