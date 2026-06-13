import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { PartnersService } from './partners.service'
import { QueryPartnersDto } from './dto/query-partners.dto'
import { CreatePartnerDto } from './dto/create-partner.dto'
import { UpdatePartnerStatusDto } from './dto/update-partner-status.dto'
import type { PartnerApplication } from '../common/types'

@Controller('partners')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Get()
  findAll(@Query() query: QueryPartnersDto): PartnerApplication[] {
    return this.partnersService.findAll(query)
  }

  @Post()
  create(@Body() body: CreatePartnerDto): PartnerApplication {
    return this.partnersService.create(body)
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: UpdatePartnerStatusDto): PartnerApplication {
    return this.partnersService.updateStatus(id, body)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): void {
    this.partnersService.remove(id)
  }
}
