import { Module } from '@nestjs/common'
import { CareGuidesController } from './care-guides.controller'
import { CareGuidesService } from './care-guides.service'

@Module({
  controllers: [CareGuidesController],
  providers: [CareGuidesService],
  exports: [CareGuidesService],
})
export class CareGuidesModule {}
