import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { SEED_LISTINGS } from './data'
import { useMarketStore } from './store'

function resetStore() {
  useMarketStore.setState({
    listings: [],
    ownIds: {},
    lastAuthor: '',
    seeded: false,
  })
}

beforeEach(() => {
  localStorage.clear()
  resetStore()
})

afterEach(() => {
  resetStore()
})

describe('market store', () => {
  describe('hydrateSeed', () => {
    it('seeds listings when empty', () => {
      useMarketStore.getState().hydrateSeed(SEED_LISTINGS)
      const state = useMarketStore.getState()
      expect(state.listings).toHaveLength(SEED_LISTINGS.length)
      expect(state.seeded).toBe(true)
    })

    it('is idempotent — a second call does not duplicate or overwrite', () => {
      const store = useMarketStore.getState()
      store.hydrateSeed(SEED_LISTINGS)
      const added = store.addListing({
        author: '테스터',
        title: '볼파이톤 분양',
        isFree: false,
        priceKrw: 100000,
        region: 'songpa',
        cbStatus: 'cb',
        contact: 'test@example.com',
        description: '설명',
      })
      // Re-hydrating must not wipe the user's listing nor re-add seeds.
      useMarketStore.getState().hydrateSeed(SEED_LISTINGS)
      const state = useMarketStore.getState()
      expect(state.listings).toHaveLength(SEED_LISTINGS.length + 1)
      expect(state.listings[0].id).toBe(added.id)
    })
  })

  describe('addListing', () => {
    it('prepends a priced listing, marks ownership, and stores lastAuthor', () => {
      const listing = useMarketStore.getState().addListing({
        author: '새브리더',
        title: '크레스티드 게코 분양',
        speciesId: 'sp-crested-gecko',
        category: 'reptile',
        morph: '할리퀸',
        isFree: false,
        priceKrw: 90000,
        region: 'gangnam',
        cbStatus: 'cb',
        contact: 'seller@example.com',
        description: 'CB 개체입니다.',
      })
      const state = useMarketStore.getState()
      expect(state.listings[0].id).toBe(listing.id)
      expect(state.listings[0].priceKrw).toBe(90000)
      expect(state.listings[0].isFree).toBe(false)
      expect(state.listings[0].speciesId).toBe('sp-crested-gecko')
      expect(state.ownIds[listing.id]).toBe(true)
      expect(state.isOwn(listing.id)).toBe(true)
      expect(state.lastAuthor).toBe('새브리더')
    })

    it('forces priceKrw to null when isFree is true even if a price is supplied', () => {
      const listing = useMarketStore.getState().addListing({
        author: '나눔이',
        title: '콘스네이크 무료 분양',
        isFree: true,
        priceKrw: 50000,
        region: 'jamsil',
        cbStatus: 'cb',
        contact: 'kakao',
        description: '책임 분양합니다.',
      })
      expect(listing.priceKrw).toBeNull()
      expect(useMarketStore.getState().listings[0].priceKrw).toBeNull()
      expect(useMarketStore.getState().listings[0].isFree).toBe(true)
    })

    it('persists lastAuthor across multiple additions', () => {
      const store = useMarketStore.getState()
      store.addListing({
        author: '첫번째',
        title: '리스팅 A',
        isFree: false,
        priceKrw: 10000,
        region: 'online',
        cbStatus: 'unknown',
        contact: 'a@example.com',
        description: 'A',
      })
      expect(useMarketStore.getState().lastAuthor).toBe('첫번째')
      useMarketStore.getState().addListing({
        author: '두번째',
        title: '리스팅 B',
        isFree: true,
        region: 'songpa',
        cbStatus: 'cb',
        contact: 'b@example.com',
        description: 'B',
      })
      expect(useMarketStore.getState().lastAuthor).toBe('두번째')
    })
  })

  describe('removeListing', () => {
    it('removes a listing the user owns', () => {
      const listing = useMarketStore.getState().addListing({
        author: '집사',
        title: '분양합니다',
        isFree: false,
        priceKrw: 20000,
        region: 'other',
        cbStatus: 'cb',
        contact: 'c@example.com',
        description: '설명',
      })
      useMarketStore.getState().removeListing(listing.id)
      const state = useMarketStore.getState()
      expect(state.listings.find((l) => l.id === listing.id)).toBeUndefined()
      expect(state.ownIds[listing.id]).toBeUndefined()
    })

    it('does not remove a listing the user does not own', () => {
      useMarketStore.getState().hydrateSeed(SEED_LISTINGS)
      const seedId = SEED_LISTINGS[0].id
      useMarketStore.getState().removeListing(seedId)
      expect(useMarketStore.getState().listings.find((l) => l.id === seedId)).toBeDefined()
    })
  })
})
