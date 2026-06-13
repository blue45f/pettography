// Domain enums consolidated into the framework-free @pettography/shared
// workspace package and consumed verbatim by both frontend and backend.
// Imported as types only, so zod never enters the backend runtime.
export type {
  SpeciesCategory,
  SpeciesDifficulty,
  SpaceNeed,
  HandlingTolerance,
  ActivityPattern,
  FilingStatus,
  ShopKind,
  CommunityKind,
  AdoptionKind,
  FuneralServiceKind,
  PartnerKind,
  PartnerStatus,
  VetStatus,
  VetMessageRole,
  AccountRole,
  AccountStatus,
  ForbiddenWordAction,
  ForbiddenWordMatchType,
  WildlifeFilingKey,
} from '@pettography/shared';

import type {
  SpeciesCategory,
  SpeciesDifficulty,
  SpaceNeed,
  HandlingTolerance,
  ActivityPattern,
  FilingStatus,
  ShopKind,
  CommunityKind,
  AdoptionKind,
  FuneralServiceKind,
  PartnerKind,
  PartnerStatus,
  VetStatus,
  VetMessageRole,
  AccountRole,
  AccountStatus,
  ForbiddenWordAction,
  ForbiddenWordMatchType,
  WildlifeFilingKey,
} from '@pettography/shared';

export interface Species {
  id: string;
  slug: string;
  koreanName: string;
  scientificName: string;
  category: SpeciesCategory;
  difficulty: SpeciesDifficulty;
  lifespanMinYears: number;
  lifespanMaxYears: number;
  summary: string;
  environment: string;
  diet: string;
  heroEmoji: string;
  tags: string[];
  spaceNeed: SpaceNeed;
  handlingTolerance: HandlingTolerance;
  activityPattern: ActivityPattern;
  beginnerTip: string;
  commonProblem: string;
  monthlyBudgetKrw: number;
  filingStatus?: FilingStatus;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  district: string;
  lat: number;
  lng: number;
  phone: string;
  supportedCategories: SpeciesCategory[];
  hours: string;
  hasEmergency: boolean;
  mapUrl: string;
}

export interface Shop {
  id: string;
  name: string;
  kind: ShopKind;
  address: string;
  district: string;
  lat: number;
  lng: number;
  online: string | null;
  supportedCategories: SpeciesCategory[];
  notes: string;
}

export interface CareGuideSection {
  title: string;
  body: string;
}

export interface CareGuideReference {
  label: string;
  url: string;
}

export interface CareGuide {
  id: string;
  speciesId: string;
  sections: CareGuideSection[];
  references: CareGuideReference[];
}

export interface Community {
  id: string;
  supportedCategories: SpeciesCategory[];
  name: string;
  url: string;
  kind: CommunityKind;
  language: string;
}

export interface AdoptionListing {
  id: string;
  name: string;
  url: string;
  kind: AdoptionKind;
  region: string;
  supportedCategories: SpeciesCategory[];
  description: string;
  badge?: string;
}

export interface FuneralService {
  id: string;
  name: string;
  url: string;
  kind: FuneralServiceKind;
  region: string;
  supportedCategories: SpeciesCategory[];
  description: string;
  certified: boolean;
  phone?: string;
}

export interface ForumPost {
  id: string;
  category: SpeciesCategory;
  title: string;
  author: string;
  authorId?: string;
  body: string;
  createdAt: string;
  reportCount?: number;
  autoHidden?: boolean;
  hiddenByAdmin?: boolean;
  moderationStatus?: 'visible' | 'needs_review';
  moderationHits?: string[];
}

export interface ForumReply {
  id: string;
  postId: string;
  author: string;
  authorId?: string;
  body: string;
  createdAt: string;
  reportCount?: number;
  autoHidden?: boolean;
  hiddenByAdmin?: boolean;
  deleted?: boolean;
  moderationStatus?: 'visible' | 'needs_review';
  moderationHits?: string[];
}

export interface Account {
  id: string;
  email: string;
  name: string;
  passwordHash: string | null;
  role: AccountRole;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
  withdrawnAt?: string | null;
}

export type PublicAccount = Omit<Account, 'passwordHash'>;

export interface AccountSession {
  id: string;
  accountId: string;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
  revokedAt?: string | null;
}

export interface AuditLog {
  id: string;
  actorId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface ForbiddenWordRule {
  id: string;
  phrase: string;
  normalizedPhrase: string;
  action: ForbiddenWordAction;
  matchType: ForbiddenWordMatchType;
  enabled: boolean;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerApplication {
  id: string;
  kind: PartnerKind;
  name: string;
  contact: string;
  region: string;
  description: string;
  url: string | null;
  status: PartnerStatus;
  createdAt: string;
}

export interface Vet {
  id: string;
  name: string;
  clinic: string;
  specialties: string[];
  yearsOfExperience: number;
  status: VetStatus;
  avatarEmoji: string;
  hourlyKrw: number;
}

export interface VetMessage {
  id: string;
  vetId: string;
  role: VetMessageRole;
  body: string;
  createdAt: string;
}

export interface WildlifeFiling {
  key: WildlifeFilingKey;
  title: string;
  description: string;
  dueWindowDays: number;
  officialUrl: string;
}

export interface RegistryLinks {
  wildlifeRegistry: string;
  animalRegistry: string;
  envMinistry: string;
}

export type CompareDimensionType =
  | 'category'
  | 'difficulty'
  | 'range'
  | 'enum'
  | 'currency'
  | 'text';

export interface CompareDimension {
  key: string;
  label: string;
  type: CompareDimensionType;
}
