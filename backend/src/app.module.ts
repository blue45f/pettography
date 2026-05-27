import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { SpeciesModule } from './species/species.module';
import { HospitalsModule } from './hospitals/hospitals.module';
import { ShopsModule } from './shops/shops.module';
import { CareGuidesModule } from './care-guides/care-guides.module';
import { CommunitiesModule } from './communities/communities.module';

@Module({
  imports: [
    HealthModule,
    SpeciesModule,
    HospitalsModule,
    ShopsModule,
    CareGuidesModule,
    CommunitiesModule,
  ],
})
export class AppModule {}
