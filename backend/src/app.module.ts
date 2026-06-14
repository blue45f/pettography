import { Module } from '@nestjs/common'
import { APP_FILTER, APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { LoggerModule } from 'nestjs-pino'
import { AdoptionModule } from './adoption/adoption.module'
import { AuthModule } from './auth/auth.module'
import { CareGuidesModule } from './care-guides/care-guides.module'
import { CommunitiesModule } from './communities/communities.module'
import { CompareModule } from './compare/compare.module'
import { ConsultModule } from './consult/consult.module'
import { ForumModule } from './forum/forum.module'
import { FuneralModule } from './funeral/funeral.module'
import { HealthModule } from './health/health.module'
import { HospitalsModule } from './hospitals/hospitals.module'
import { ModerationModule } from './moderation/moderation.module'
import { PartnersModule } from './partners/partners.module'
import { RegistryModule } from './registry/registry.module'
import { ShopsModule } from './shops/shops.module'
import { SpeciesModule } from './species/species.module'
import { AllExceptionsFilter } from './common/all-exceptions.filter'
import { resolveThrottleOptions } from './common/http-hardening'

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
        redact: ['req.headers.authorization', 'req.headers.cookie'],
      },
    }),
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
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
