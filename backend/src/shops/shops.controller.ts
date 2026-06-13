import { Controller, Get, Query } from '@nestjs/common'
import { ShopsService, ShopWithDistance } from './shops.service'
import { QueryShopsDto } from './dto/query-shops.dto'

@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get()
  findAll(@Query() query: QueryShopsDto): ShopWithDistance[] {
    return this.shopsService.findAll(query)
  }
}
