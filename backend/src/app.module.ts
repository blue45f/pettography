import { Module } from '@nestjs/common';
import { AdoptionModule } from './adoption/adoption.module';
import { CareGuidesModule } from './care-guides/care-guides.module';
import { CommunitiesModule } from './communities/communities.module';
import { CompareModule } from './compare/compare.module';
import { ConsultModule } from './consult/consult.module';
import { ForumModule } from './forum/forum.module';
import { FuneralModule } from './funeral/funeral.module';
import { HealthModule } from './health/health.module';
import { HospitalsModule } from './hospitals/hospitals.module';
import { PartnersModule } from './partners/partners.module';
import { RegistryModule } from './registry/registry.module';
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
    ForumModule,
    PartnersModule,
    ConsultModule,
    RegistryModule,
    CompareModule,
  ],
})
export class AppModule {}
