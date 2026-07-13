export interface InsuranceProvider {
  id: string
  name: string
  url: string
}

/** Official insurer entry points. Eligibility and premiums must be checked on the linked site. */
export const INSURANCE_PROVIDERS: readonly InsuranceProvider[] = [
  { id: 'kb', name: 'KB손해보험', url: 'https://www.kbinsure.co.kr/' },
  { id: 'db', name: 'DB손해보험', url: 'https://www.idbins.com/' },
  { id: 'meritz', name: '메리츠화재', url: 'https://www.meritzfire.com/' },
  { id: 'samsung', name: '삼성화재 다이렉트', url: 'https://direct.samsungfire.com/' },
  { id: 'hyundai', name: '현대해상', url: 'https://www.hi.co.kr/' },
]
