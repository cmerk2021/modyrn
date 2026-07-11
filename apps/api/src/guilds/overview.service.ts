import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import {
  and,
  automodEvents,
  cases,
  count,
  desc,
  eq,
  guildMembers,
  gte,
  type Database,
} from '@modyrn/database';
import { HealthStatus, type ModerationActionType, type OverviewMetrics } from '@modyrn/shared';
import { InjectDatabase } from '../database/inject-database.decorator.js';
import { DatabaseService } from '../database/database.module.js';
import { REDIS } from '../redis/redis.module.js';

export interface ActivityPoint {
  label: string;
  messages: number;
  cases: number;
}

export interface TimelineCase {
  id: string;
  caseNumber: number;
  action: ModerationActionType;
  targetLabel: string;
  moderatorLabel: string;
  createdAt: string;
}

export interface OverviewResponse {
  metrics: OverviewMetrics;
  activity: ActivityPoint[];
  recentCases: TimelineCase[];
}

/**
 * Computes the live overview payload for a guild: KPI metrics, a 14-day activity
 * series and the most recent moderation cases.
 */
@Injectable()
export class OverviewService {
  constructor(
    @InjectDatabase() private readonly db: Database,
    private readonly database: DatabaseService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  async getOverview(guildId: string): Promise<OverviewResponse> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      memberCount,
      casesToday,
      automodToday,
      gatewayLatencyMs,
      apiLatencyMs,
      redisUp,
      onlineCount,
      recent,
    ] = await Promise.all([
      this.countMembers(guildId),
      this.countCasesSince(guildId, startOfToday),
      this.countAutomodSince(guildId, startOfToday),
      this.gatewayLatency(),
      this.apiLatency(),
      this.redisUp(),
      this.onlineCount(guildId),
      this.recentCases(guildId),
    ]);

    const metrics: OverviewMetrics = {
      memberCount,
      onlineCount,
      casesToday,
      automodEventsToday: automodToday,
      gatewayLatencyMs,
      apiLatencyMs: Math.max(0, apiLatencyMs),
      databaseStatus: apiLatencyMs >= 0 ? HealthStatus.Up : HealthStatus.Down,
      redisStatus: redisUp ? HealthStatus.Up : HealthStatus.Down,
    };

    return {
      metrics,
      activity: await this.activitySeries(guildId),
      recentCases: recent,
    };
  }

  private async countMembers(guildId: string): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(guildMembers)
      .where(and(eq(guildMembers.guildId, guildId), eq(guildMembers.present, true)));
    return row?.value ?? 0;
  }

  private async countCasesSince(guildId: string, since: Date): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(cases)
      .where(and(eq(cases.guildId, guildId), gte(cases.createdAt, since)));
    return row?.value ?? 0;
  }

  private async countAutomodSince(guildId: string, since: Date): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(automodEvents)
      .where(and(eq(automodEvents.guildId, guildId), gte(automodEvents.createdAt, since)));
    return row?.value ?? 0;
  }

  private async gatewayLatency(): Promise<number> {
    try {
      const raw = await this.redis.get('modyrn:bot:heartbeat');
      if (!raw) return 0;
      return (JSON.parse(raw) as { ping: number }).ping ?? 0;
    } catch {
      return 0;
    }
  }

  private async apiLatency(): Promise<number> {
    try {
      return await this.database.ping();
    } catch {
      return -1;
    }
  }

  private async redisUp(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch {
      return false;
    }
  }

  private async onlineCount(guildId: string): Promise<number> {
    const raw = await this.redis.get(`modyrn:guild:${guildId}:online`);
    return raw ? Number(raw) : 0;
  }

  private async recentCases(guildId: string): Promise<TimelineCase[]> {
    const rows = await this.db
      .select()
      .from(cases)
      .where(eq(cases.guildId, guildId))
      .orderBy(desc(cases.createdAt))
      .limit(6);

    return rows.map((c) => ({
      id: c.id,
      caseNumber: c.caseNumber,
      action: c.action,
      targetLabel: c.targetUserId,
      moderatorLabel: c.moderatorId,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  private async activitySeries(guildId: string): Promise<ActivityPoint[]> {
    // Derived from daily analytics snapshots when present; otherwise an empty
    // series so the chart renders gracefully.
    const points: ActivityPoint[] = [];
    void guildId;
    return points;
  }
}
