import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AppConfigModule } from './config/config.module.js';
import { AppConfigService } from './config/app-config.service.js';
import { CryptoModule } from './common/crypto/crypto.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { DatabaseModule } from './database/database.module.js';
import { RedisModule } from './redis/redis.module.js';
import { DiscordModule } from './discord/discord.module.js';
import { AuthModule } from './auth/auth.module.js';
import { HealthModule } from './health/health.module.js';
import { GuildsModule } from './guilds/guilds.module.js';
import { ModerationModule } from './moderation/moderation.module.js';
import { MembersModule } from './members/members.module.js';
import { CasesModule } from './cases/cases.module.js';
import { AutomodModule } from './automod/automod.module.js';
import { LoggingModule } from './logging/logging.module.js';
import { EmergencyModule } from './emergency/emergency.module.js';
import { PermissionsModule } from './permissions/permissions.module.js';
import { AnalyticsModule } from './analytics/analytics.module.js';
import { UtilityModule } from './utility/utility.module.js';
import { BackupsModule } from './backups/backups.module.js';
import { UpdatesModule } from './updates/updates.module.js';
import { InternalModule } from './internal/internal.module.js';

/**
 * Root application module. Wires together configuration, infrastructure
 * (database, redis, crypto), cross-cutting concerns (logging, rate limiting,
 * error handling) and feature modules.
 */
@Module({
  imports: [
    AppConfigModule,
    LoggerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        pinoHttp: {
          level: config.get('LOG_LEVEL'),
          transport: config.isProduction
            ? undefined
            : { target: 'pino-pretty', options: { singleLine: true } },
          redact: ['req.headers.authorization', 'req.headers.cookie'],
        },
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    CryptoModule,
    DatabaseModule,
    RedisModule,
    DiscordModule,
    AuthModule,
    HealthModule,
    GuildsModule,
    ModerationModule,
    MembersModule,
    CasesModule,
    AutomodModule,
    LoggingModule,
    EmergencyModule,
    PermissionsModule,
    AnalyticsModule,
    UtilityModule,
    BackupsModule,
    UpdatesModule,
    InternalModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
