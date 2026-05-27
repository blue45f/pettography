import { Controller, Get, Param } from '@nestjs/common';
import { ConsultService } from './consult.service';
import type { Vet, VetMessage } from '../common/types';

@Controller('consult')
export class ConsultController {
  constructor(private readonly consultService: ConsultService) {}

  @Get('vets')
  listVets(): Vet[] {
    return this.consultService.listVets();
  }

  @Get('vets/:id')
  getVet(@Param('id') id: string): Vet {
    return this.consultService.findVet(id);
  }

  @Get('vets/:id/messages')
  listMessages(@Param('id') id: string): VetMessage[] {
    return this.consultService.listMessages(id);
  }
}
