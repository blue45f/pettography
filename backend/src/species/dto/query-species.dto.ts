import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import type { SpeciesCategory, SpeciesDifficulty } from '../../common/types';

const SPECIES_CATEGORIES = [
  'reptile',
  'arthropod',
  'bird',
  'amphibian',
  'mammal',
] as const satisfies readonly SpeciesCategory[];

const SPECIES_DIFFICULTIES = [
  'beginner',
  'intermediate',
  'advanced',
] as const satisfies readonly SpeciesDifficulty[];

export class QuerySpeciesDto extends createZodDto(
  z.object({
    category: z.enum(SPECIES_CATEGORIES).optional(),
    difficulty: z.enum(SPECIES_DIFFICULTIES).optional(),
    q: z.string().optional(),
  }),
) {}
