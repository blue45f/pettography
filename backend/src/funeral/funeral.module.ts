import { Module } from '@nestjs/common'
import { FuneralController } from './funeral.controller'
import { FuneralService } from './funeral.service'

@Module({
  controllers: [FuneralController],
  providers: [FuneralService],
  exports: [FuneralService],
})
export class FuneralModule {}
