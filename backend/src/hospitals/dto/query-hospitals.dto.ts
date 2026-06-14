import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import type { SpeciesCategory } from '../../common/types'

const SPECIES_CATEGORIES = [
  'reptile',
  'arthropod',
  'bird',
  'amphibian',
  'mammal',
] as const satisfies readonly SpeciesCategory[]

export class QueryHospitalsDto extends createZodDto(
  z.object({
    category: z.enum(SPECIES_CATEGORIES).optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    radiusKm: z.coerce.number().min(0).optional(),
  })
) {}
