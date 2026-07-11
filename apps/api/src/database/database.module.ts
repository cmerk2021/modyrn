import {
  Global,
  Inject,
  Injectable,
  Logger,
  Module,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import {
  createDatabase,
  runMigrations,
  type Database,
  type DatabaseHandle,
} from '@modyrn/database';
import { AppConfigService } from '../config/app-config.service.js';
import { DATABASE } from './database.constants.js';

/**
 * Owns the database connection lifecycle: runs migrations on boot, exposes the
 * handle for health checks, and closes the pool on shutdown.
 */
@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(@Inject(DATABASE) private readonly handle: DatabaseHandle) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Applying database migrations...');
    await runMigrations();
    this.logger.log('Database ready.');
  }

  async onModuleDestroy(): Promise<void> {
    await this.handle.close();
  }

  /** Executes `SELECT 1` to verify connectivity. Returns latency in ms. */
  async ping(): Promise<number> {
    const start = performance.now();
    await this.handle.client`SELECT 1`;
    return Math.round(performance.now() - start);
  }
}

const databaseProvider = {
  provide: DATABASE,
  inject: [AppConfigService],
  useFactory: (config: AppConfigService): DatabaseHandle =>
    createDatabase({
      connectionString: config.get('DATABASE_URL'),
      logger: config.isDevelopment,
    }),
};

/**
 * Provides the Drizzle {@link Database} via the {@link DATABASE} token and the
 * managing {@link DatabaseService}.
 */
@Global()
@Module({
  providers: [
    databaseProvider,
    DatabaseService,
    {
      provide: 'DB',
      inject: [DATABASE],
      useFactory: (handle: DatabaseHandle): Database => handle.db,
    },
  ],
  exports: [DATABASE, DatabaseService, 'DB'],
})
export class DatabaseModule {}
