import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { HealthStatus, type DependencyHealth, type HealthReport } from '@modyrn/shared';
import { DatabaseService } from '../database/database.module.js';
import { REDIS } from '../redis/redis.module.js';

/**
 * Aggregates the health of the API and its dependencies (database, Redis and the
 * Discord gateway) into a single {@link HealthReport}.
 */
@Injectable()
export class HealthService {
  private readonly startedAt = Date.now();

  constructor(
    private readonly database: DatabaseService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  async report(): Promise<HealthReport> {
    const [database, redis] = await Promise.all([this.checkDatabase(), this.checkRedis()]);

    // The gateway is owned by the bot process; the API infers status from a
    // heartbeat key the bot writes to Redis.
    const discordGateway = await this.checkGateway();

    const dependencies = { database, redis, discordGateway };
    const status = this.aggregate(Object.values(dependencies));

    return {
      status,
      version: process.env.APP_VERSION ?? '0.0.0-dev',
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
      dependencies,
    };
  }

  private async checkDatabase(): Promise<DependencyHealth> {
    try {
      const latencyMs = await this.database.ping();
      return { status: HealthStatus.Up, latencyMs };
    } catch (error) {
      return { status: HealthStatus.Down, message: (error as Error).message };
    }
  }

  private async checkRedis(): Promise<DependencyHealth> {
    try {
      const start = performance.now();
      await this.redis.ping();
      return { status: HealthStatus.Up, latencyMs: Math.round(performance.now() - start) };
    } catch (error) {
      return { status: HealthStatus.Down, message: (error as Error).message };
    }
  }

  private async checkGateway(): Promise<DependencyHealth> {
    try {
      const raw = await this.redis.get('modyrn:bot:heartbeat');
      if (!raw) {
        return { status: HealthStatus.Down, message: 'No bot heartbeat received.' };
      }
      const { at, ping } = JSON.parse(raw) as { at: number; ping: number };
      const ageMs = Date.now() - at;
      // Consider the gateway degraded if the heartbeat is stale.
      if (ageMs > 60_000) {
        return { status: HealthStatus.Degraded, latencyMs: ping, message: 'Heartbeat is stale.' };
      }
      return { status: HealthStatus.Up, latencyMs: ping };
    } catch {
      return { status: HealthStatus.Down, message: 'Unable to read bot heartbeat.' };
    }
  }

  private aggregate(deps: DependencyHealth[]): HealthStatus {
    if (deps.some((d) => d.status === HealthStatus.Down)) return HealthStatus.Down;
    if (deps.some((d) => d.status === HealthStatus.Degraded)) return HealthStatus.Degraded;
    return HealthStatus.Up;
  }
}
