import { Module } from '@nestjs/common';
import { AdoptionModule } from './adoption/adoption.module';
import { CareGuidesModule } from './care-guides/care-guides.module';
import { CommunitiesModule } from './communities/communities.module';
import { FuneralModule } from './funeral/funeral.module';
import { HealthModule } from './health/health.module';
import { HospitalsModule } from './hospitals/hospitals.module';
import { ShopsModule } from './shops/shops.module';
import { SpeciesModule } from './species/species.module';

@Module({
  imports: [
    HealthModule,
    SpeciesModule,
    HospitalsModule,
    ShopsModule,
    CareGuidesModule,
    CommunitiesModule,
    AdoptionModule,
    FuneralModule,
  ],
})
export class AppModule {}
