import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdoptionModule } from './adoption/adoption.module';
import { AuthModule } from './auth/auth.module';
import { CareGuidesModule } from './care-guides/care-guides.module';
import { CommunitiesModule } from './communities/communities.module';
import { CompareModule } from './compare/compare.module';
import { ConsultModule } from './consult/consult.module';
import { ForumModule } from './forum/forum.module';
import { FuneralModule } from './funeral/funeral.module';
import { HealthModule } from './health/health.module';
import { HospitalsModule } from './hospitals/hospitals.module';
import { ModerationModule } from './moderation/moderation.module';
import { PartnersModule } from './partners/partners.module';
import { RegistryModule } from './registry/registry.module';
import { ShopsModule } from './shops/shops.module';
import { SpeciesModule } from './species/species.module';
import { resolveThrottleOptions } from './common/http-hardening';

@Module({
  imports: [
    ThrottlerModule.forRoot(resolveThrottleOptions()),
    HealthModule,
    AuthModule,
    SpeciesModule,
    HospitalsModule,
    ShopsModule,
    CareGuidesModule,
    CommunitiesModule,
    ModerationModule,
    AdoptionModule,
    FuneralModule,
    ForumModule,
    PartnersModule,
    ConsultModule,
    RegistryModule,
    CompareModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
