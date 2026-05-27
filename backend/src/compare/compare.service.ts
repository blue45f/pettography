import { Injectable } from '@nestjs/common';
import { COMPARE_DIMENSIONS_SEED } from '../data/registry.seed';
import type { CompareDimension } from '../common/types';

@Injectable()
export class CompareService {
  private readonly dimensions: CompareDimension[] = COMPARE_DIMENSIONS_SEED;

  findDimensions(): CompareDimension[] {
    return this.dimensions;
  }
}
