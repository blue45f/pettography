import { Controller, Get } from '@nestjs/common';
import { CompareService } from './compare.service';
import type { CompareDimension } from '../common/types';

@Controller('compare')
export class CompareController {
  constructor(private readonly compareService: CompareService) {}

  @Get('dimensions')
  findDimensions(): CompareDimension[] {
    return this.compareService.findDimensions();
  }
}
