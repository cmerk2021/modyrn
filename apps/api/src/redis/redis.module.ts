import { Global, Module, type OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { AppConfigService } from '../config/app-config.service.js';

/** DI token for the shared ioredis client. */
export const REDIS = Symbol('MODYRN_REDIS');

const redisProvider = {
  provide: REDIS,
  inject: [AppConfigService],
  useFactory: (config: AppConfigService): Redis =>
    new Redis(config.get('REDIS_URL'), {
      maxRetriesPerRequest: null,
      lazyConnect: false,
    }),
};

/**
 * Provides a shared Redis connection used for caching, rate limiting and pub/sub.
 * BullMQ queues create their own dedicated connections.
 */
@Global()
@Module({
  providers: [redisProvider],
  exports: [REDIS],
})
export class RedisModule implements OnModuleDestroy {
  constructor() {}

  async onModuleDestroy(): Promise<void> {
    // The provider instance is disposed by Nest; connections close on shutdown.
  }
}
