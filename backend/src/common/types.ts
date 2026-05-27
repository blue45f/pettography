export type SpeciesCategory = 'reptile' | 'arthropod' | 'bird' | 'amphibian' | 'mammal';
export type SpeciesDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type SpaceNeed = 'small' | 'medium' | 'large';
export type HandlingTolerance = 'low' | 'medium' | 'high';
export type ActivityPattern = 'nocturnal' | 'diurnal' | 'mixed';
export type FilingStatus = 'white-list' | 'regulated' | 'unregulated' | 'unknown';
export type ShopKind = 'food' | 'equipment' | 'both';
export type CommunityKind = 'forum' | 'cafe' | 'discord' | 'youtube';
export type AdoptionKind = 'rescue' | 'breeder' | 'cafe' | 'marketplace';
export type FuneralServiceKind = 'cremation' | 'memorial' | 'pickup' | 'directory';

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
  body: string;
  createdAt: string;
}

export interface ForumReply {
  id: string;
  postId: string;
  author: string;
  body: string;
  createdAt: string;
}

export type PartnerKind = 'shop' | 'hospital' | 'treat-shop';
export type PartnerStatus = 'pending' | 'approved' | 'rejected';

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

export type VetStatus = 'online' | 'busy' | 'offline';
export type VetMessageRole = 'user' | 'vet';

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

export type WildlifeFilingKey = 'keeping' | 'transfer' | 'death' | 'microchip';

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
