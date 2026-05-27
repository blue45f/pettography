export type SpeciesCategory = 'reptile' | 'arthropod' | 'bird' | 'amphibian' | 'mammal';
export type SpeciesDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type ShopKind = 'food' | 'equipment' | 'both';
export type CommunityKind = 'forum' | 'cafe' | 'discord' | 'youtube';

export interface SpeciesEnvironment {
  temperature: string;
  humidity: string;
  space: string;
}

export interface Species {
  id: string;
  slug: string;
  koreanName: string;
  scientificName: string;
  category: SpeciesCategory;
  difficulty: SpeciesDifficulty;
  lifespanYears: string;
  summary: string;
  environment: SpeciesEnvironment;
  diet: string;
  heroEmoji: string;
  tags: string[];
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
