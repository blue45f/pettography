import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import type { SpeciesCategory } from '../../common/types';

const SPECIES_CATEGORIES = [
  'reptile',
  'arthropod',
  'bird',
  'amphibian',
  'mammal',
] as const satisfies readonly SpeciesCategory[];

export class QueryFuneralDto extends createZodDto(
  z.object({
    category: z.enum(SPECIES_CATEGORIES).optional(),
  }),
) {}
