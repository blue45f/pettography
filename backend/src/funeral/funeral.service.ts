import { Injectable } from '@nestjs/common'
import { FUNERAL_SEED } from '../data/funeral.seed'
import type { FuneralService as FuneralServiceItem } from '../common/types'
import type { QueryFuneralDto } from './dto/query-funeral.dto'

@Injectable()
export class FuneralService {
  private readonly items: FuneralServiceItem[] = FUNERAL_SEED

  findAll(query: QueryFuneralDto): FuneralServiceItem[] {
    const { category } = query
    if (!category) return this.items
    return this.items.filter((f) => f.supportedCategories.includes(category))
  }
}
