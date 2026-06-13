import type { GeneTrait } from './schema'

/**
 * Curated single-gene morph catalog for the species where Mendelian genetics
 * actually apply. Polygenic / line-bred traits (e.g. most crested gecko
 * patterns) are intentionally excluded — the calculator only models simple
 * inheritance and says so on screen.
 *
 * Sources: MorphMarket genetics wiki, World of Ball Pythons, iangko axolotl
 * genetics, Cornsnakes.com — summarised and reconstructed.
 */
export const GENE_TRAITS: readonly GeneTrait[] = [
  // ── Leopard gecko ──────────────────────────────────────────────
  {
    id: 'leo-tremper',
    speciesSlug: 'leopard-gecko',
    name: '트램퍼 알비노',
    mode: 'recessive',
    singleLabel: 'het 트램퍼',
    doubleLabel: '트램퍼 알비노',
    note: '3종 알비노는 서로 호환되지 않습니다(동일 계통끼리만 비주얼).',
  },
  {
    id: 'leo-bell',
    speciesSlug: 'leopard-gecko',
    name: '벨 알비노',
    mode: 'recessive',
    singleLabel: 'het 벨',
    doubleLabel: '벨 알비노',
  },
  {
    id: 'leo-rainwater',
    speciesSlug: 'leopard-gecko',
    name: '레인워터 알비노',
    mode: 'recessive',
    singleLabel: 'het 레인워터',
    doubleLabel: '레인워터 알비노',
  },
  {
    id: 'leo-eclipse',
    speciesSlug: 'leopard-gecko',
    name: '이클립스',
    mode: 'recessive',
    singleLabel: 'het 이클립스',
    doubleLabel: '이클립스',
  },
  {
    id: 'leo-blizzard',
    speciesSlug: 'leopard-gecko',
    name: '블리자드',
    mode: 'recessive',
    singleLabel: 'het 블리자드',
    doubleLabel: '블리자드',
  },
  {
    id: 'leo-murphy',
    speciesSlug: 'leopard-gecko',
    name: '머피 패턴리스',
    mode: 'recessive',
    singleLabel: 'het 패턴리스',
    doubleLabel: '머피 패턴리스',
  },
  {
    id: 'leo-macksnow',
    speciesSlug: 'leopard-gecko',
    name: '맥 스노우',
    mode: 'codominant',
    singleLabel: '맥 스노우',
    doubleLabel: '슈퍼 스노우',
  },
  {
    id: 'leo-wy',
    speciesSlug: 'leopard-gecko',
    name: '화이트앤옐로우',
    mode: 'dominant',
    singleLabel: '화이트앤옐로우',
    doubleLabel: '화이트앤옐로우',
  },
  {
    id: 'leo-giant',
    speciesSlug: 'leopard-gecko',
    name: '자이언트',
    mode: 'codominant',
    singleLabel: '자이언트',
    doubleLabel: '슈퍼 자이언트',
  },

  // ── Ball python ────────────────────────────────────────────────
  {
    id: 'bp-albino',
    speciesSlug: 'ball-python',
    name: '알비노',
    mode: 'recessive',
    singleLabel: 'het 알비노',
    doubleLabel: '알비노',
  },
  {
    id: 'bp-pied',
    speciesSlug: 'ball-python',
    name: '파이드(피에발드)',
    mode: 'recessive',
    singleLabel: 'het 파이드',
    doubleLabel: '파이드',
  },
  {
    id: 'bp-clown',
    speciesSlug: 'ball-python',
    name: '클라운',
    mode: 'recessive',
    singleLabel: 'het 클라운',
    doubleLabel: '클라운',
  },
  {
    id: 'bp-pastel',
    speciesSlug: 'ball-python',
    name: '파스텔',
    mode: 'codominant',
    singleLabel: '파스텔',
    doubleLabel: '슈퍼 파스텔',
  },
  {
    id: 'bp-mojave',
    speciesSlug: 'ball-python',
    name: '모하비',
    mode: 'codominant',
    singleLabel: '모하비',
    doubleLabel: '슈퍼 모하비',
    note: '모하비·레서 등 BEL 콤플렉스끼리 교배 시 블루아이 류시스틱(BEL) 발현.',
  },
  {
    id: 'bp-lesser',
    speciesSlug: 'ball-python',
    name: '레서',
    mode: 'codominant',
    singleLabel: '레서',
    doubleLabel: '슈퍼 레서(BEL)',
  },
  {
    id: 'bp-spider',
    speciesSlug: 'ball-python',
    name: '스파이더',
    mode: 'dominant',
    singleLabel: '스파이더',
    doubleLabel: '스파이더',
    note: '신경학적 wobble 동반. 슈퍼 폼(호모)은 치사로 알려져 비주얼만 존재.',
  },
  {
    id: 'bp-pinstripe',
    speciesSlug: 'ball-python',
    name: '핀스트라이프',
    mode: 'dominant',
    singleLabel: '핀스트라이프',
    doubleLabel: '핀스트라이프',
  },
  {
    id: 'bp-yellowbelly',
    speciesSlug: 'ball-python',
    name: '옐로우벨리',
    mode: 'codominant',
    singleLabel: '옐로우벨리',
    doubleLabel: '아이보리',
  },
  {
    id: 'bp-enchi',
    speciesSlug: 'ball-python',
    name: '엔치',
    mode: 'codominant',
    singleLabel: '엔치',
    doubleLabel: '슈퍼 엔치',
  },

  // ── Corn snake ─────────────────────────────────────────────────
  {
    id: 'corn-amel',
    speciesSlug: 'corn-snake',
    name: '아멜라니스틱',
    mode: 'recessive',
    singleLabel: 'het 아멜',
    doubleLabel: '아멜라니스틱',
  },
  {
    id: 'corn-anery',
    speciesSlug: 'corn-snake',
    name: '아네리스리스틱',
    mode: 'recessive',
    singleLabel: 'het 아네리',
    doubleLabel: '아네리스리스틱',
    note: '아멜 + 아네리 더블 호모 = 스노우.',
  },
  {
    id: 'corn-hypo',
    speciesSlug: 'corn-snake',
    name: '하이포멜라니스틱',
    mode: 'recessive',
    singleLabel: 'het 하이포',
    doubleLabel: '하이포',
  },
  {
    id: 'corn-caramel',
    speciesSlug: 'corn-snake',
    name: '카라멜',
    mode: 'recessive',
    singleLabel: 'het 카라멜',
    doubleLabel: '카라멜',
  },
  {
    id: 'corn-lavender',
    speciesSlug: 'corn-snake',
    name: '라벤더',
    mode: 'recessive',
    singleLabel: 'het 라벤더',
    doubleLabel: '라벤더',
  },
  {
    id: 'corn-motley',
    speciesSlug: 'corn-snake',
    name: '모틀리',
    mode: 'recessive',
    singleLabel: 'het 모틀리',
    doubleLabel: '모틀리',
    note: '모틀리·스트라이프는 동일 유전자좌(대립). 함께 호모면 패턴 혼합.',
  },
  {
    id: 'corn-bloodred',
    speciesSlug: 'corn-snake',
    name: '블러드레드(디퓨즈드)',
    mode: 'recessive',
    singleLabel: 'het 블러드레드',
    doubleLabel: '블러드레드',
  },
  {
    id: 'corn-tessera',
    speciesSlug: 'corn-snake',
    name: '테세라',
    mode: 'dominant',
    singleLabel: '테세라',
    doubleLabel: '테세라',
  },

  // ── Bearded dragon ─────────────────────────────────────────────
  {
    id: 'bd-hypo',
    speciesSlug: 'bearded-dragon',
    name: '하이포멜라니스틱',
    mode: 'recessive',
    singleLabel: 'het 하이포',
    doubleLabel: '하이포',
  },
  {
    id: 'bd-trans',
    speciesSlug: 'bearded-dragon',
    name: '트랜스루센트',
    mode: 'recessive',
    singleLabel: 'het 트랜스',
    doubleLabel: '트랜스루센트',
  },
  {
    id: 'bd-zero',
    speciesSlug: 'bearded-dragon',
    name: '제로',
    mode: 'recessive',
    singleLabel: 'het 제로',
    doubleLabel: '제로',
  },
  {
    id: 'bd-witblits',
    speciesSlug: 'bearded-dragon',
    name: '윗블리츠',
    mode: 'recessive',
    singleLabel: 'het 윗블리츠',
    doubleLabel: '윗블리츠',
  },
  {
    id: 'bd-leatherback',
    speciesSlug: 'bearded-dragon',
    name: '레더백',
    mode: 'codominant',
    singleLabel: '레더백',
    doubleLabel: '실크백',
    note: '실크백(호모 레더백)은 피부가 약해 보습·자외선 관리 난도가 높습니다.',
  },
  {
    id: 'bd-dunner',
    speciesSlug: 'bearded-dragon',
    name: '더너',
    mode: 'dominant',
    singleLabel: '더너',
    doubleLabel: '더너',
  },

  // ── Axolotl (우파루파) ─────────────────────────────────────────
  {
    id: 'axo-albino',
    speciesSlug: 'axolotl',
    name: '알비노',
    mode: 'recessive',
    singleLabel: 'het 알비노',
    doubleLabel: '알비노',
  },
  {
    id: 'axo-melanoid',
    speciesSlug: 'axolotl',
    name: '멜라노이드',
    mode: 'recessive',
    singleLabel: 'het 멜라노이드',
    doubleLabel: '멜라노이드',
  },
  {
    id: 'axo-leucistic',
    speciesSlug: 'axolotl',
    name: '류시스틱',
    mode: 'recessive',
    singleLabel: 'het 류시스틱',
    doubleLabel: '류시스틱',
  },
  {
    id: 'axo-axanthic',
    speciesSlug: 'axolotl',
    name: '액산틱',
    mode: 'recessive',
    singleLabel: 'het 액산틱',
    doubleLabel: '액산틱',
  },
  {
    id: 'axo-copper',
    speciesSlug: 'axolotl',
    name: '코퍼',
    mode: 'recessive',
    singleLabel: 'het 코퍼',
    doubleLabel: '코퍼',
  },
  {
    id: 'axo-gfp',
    speciesSlug: 'axolotl',
    name: 'GFP(녹색형광)',
    mode: 'dominant',
    singleLabel: 'GFP',
    doubleLabel: 'GFP (호모)',
    note: 'GFP는 자외선·청색광에서 형광. 표현형은 단일/호모 모두 발현.',
  },

  // ── Crested gecko ──────────────────────────────────────────────
  {
    id: 'crest-lilywhite',
    speciesSlug: 'crested-gecko',
    name: '릴리화이트',
    mode: 'dominant',
    singleLabel: '릴리화이트',
    doubleLabel: '릴리화이트',
    note: '호모(슈퍼)는 배아 치사로 알려져 비주얼만 존재합니다.',
  },
  {
    id: 'crest-axanthic',
    speciesSlug: 'crested-gecko',
    name: '액산틱',
    mode: 'recessive',
    singleLabel: 'het 액산틱',
    doubleLabel: '액산틱',
  },
]

/** Slugs that have a usable genetics catalog, in display order. */
export const GENETICS_SPECIES: readonly string[] = [
  'leopard-gecko',
  'ball-python',
  'corn-snake',
  'bearded-dragon',
  'axolotl',
  'crested-gecko',
]

/** Species whose hobby morphs are mostly polygenic — surfaced as a caveat. */
export const POLYGENIC_NOTE_SPECIES: readonly string[] = ['crested-gecko']

export function traitsForSpecies(speciesSlug: string): GeneTrait[] {
  return GENE_TRAITS.filter((t) => t.speciesSlug === speciesSlug)
}
