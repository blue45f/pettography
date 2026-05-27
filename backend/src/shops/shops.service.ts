import { Injectable } from '@nestjs/common';
import { SHOPS_SEED } from '../data/shops.seed';
import type { Shop } from '../common/types';
import { haversineKm } from '../common/geo';
import type { QueryShopsDto } from './dto/query-shops.dto';

export type ShopWithDistance = Shop & { distanceKm?: number };

@Injectable()
export class ShopsService {
  private readonly items: Shop[] = SHOPS_SEED;

  findAll(query: QueryShopsDto): ShopWithDistance[] {
    const { category, kind, lat, lng, radiusKm } = query;
    const hasCoords = typeof lat === 'number' && typeof lng === 'number';

    let result: ShopWithDistance[] = this.items.filter((s) => {
      if (category && !s.supportedCategories.includes(category)) return false;
      if (kind && s.kind !== kind && s.kind !== 'both') return false;
      return true;
    });

    if (hasCoords) {
      result = result.map((s) => ({
        ...s,
        distanceKm: haversineKm(lat, lng, s.lat, s.lng),
      }));

      if (typeof radiusKm === 'number') {
        result = result.filter((s) => (s.distanceKm ?? Infinity) <= radiusKm);
      }

      result.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    }

    return result;
  }
}
