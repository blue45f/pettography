import { Module } from '@nestjs/common';
import { ConsultController } from './consult.controller';
import { ConsultGateway } from './consult.gateway';
import { ConsultService } from './consult.service';

@Module({
  controllers: [ConsultController],
  providers: [ConsultService, ConsultGateway],
})
export class ConsultModule {}
