/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_TOSS_AD_GROUP_ID?: string
  readonly VITE_TOSS_INTERSTITIAL_AD_GROUP_ID?: string
  readonly VITE_TOSS_REWARDED_AD_GROUP_ID?: string
  readonly VITE_WEB_ORIGIN?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
