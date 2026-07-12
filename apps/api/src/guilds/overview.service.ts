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
import { DiscordRestService } from '../discord/discord-rest.service.js';
import { NamesService } from '../discord/names.service.js';
import { REDIS } from '../redis/redis.module.js';

export interface ActivityPoint {
  label: string;
  automod: number;
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
    private readonly rest: DiscordRestService,
    private readonly names: NamesService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  async getOverview(guildId: string): Promise<OverviewResponse> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [counts, casesToday, automodToday, gatewayLatencyMs, apiLatencyMs, redisUp, recent] =
      await Promise.all([
        this.guildCounts(guildId),
        this.countCasesSince(guildId, startOfToday),
        this.countAutomodSince(guildId, startOfToday),
        this.gatewayLatency(),
        this.apiLatency(),
        this.redisUp(),
        this.recentCases(guildId),
      ]);

    const metrics: OverviewMetrics = {
      memberCount: counts.memberCount,
      onlineCount: counts.onlineCount,
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

  /**
   * Member and online counts sourced from Discord (with_counts), which is
   * accurate and immediate. Falls back to the local member cache if the Discord
   * call fails.
   */
  private async guildCounts(
    guildId: string,
  ): Promise<{ memberCount: number; onlineCount: number }> {
    try {
      const guild = await this.rest.getGuild(guildId);
      return {
        memberCount: guild.approximate_member_count ?? 0,
        onlineCount: guild.approximate_presence_count ?? 0,
      };
    } catch {
      const [row] = await this.db
        .select({ value: count() })
        .from(guildMembers)
        .where(and(eq(guildMembers.guildId, guildId), eq(guildMembers.present, true)));
      return { memberCount: row?.value ?? 0, onlineCount: 0 };
    }
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

  private async recentCases(guildId: string): Promise<TimelineCase[]> {
    const rows = await this.db
      .select()
      .from(cases)
      .where(eq(cases.guildId, guildId))
      .orderBy(desc(cases.createdAt))
      .limit(6);

    const names = await this.names.userNames(
      guildId,
      rows.flatMap((c) => [c.targetUserId, c.moderatorId]),
    );

    return rows.map((c) => ({
      id: c.id,
      caseNumber: c.caseNumber,
      action: c.action,
      targetLabel: names[c.targetUserId] ?? c.targetUserId,
      moderatorLabel: names[c.moderatorId] ?? c.moderatorId,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  private async activitySeries(guildId: string): Promise<ActivityPoint[]> {
    const since = new Date(Date.now() - 14 * 86_400_000);
    const [caseRows, automodRows] = await Promise.all([
      this.db
        .select({ createdAt: cases.createdAt })
        .from(cases)
        .where(and(eq(cases.guildId, guildId), gte(cases.createdAt, since))),
      this.db
        .select({ createdAt: automodEvents.createdAt })
        .from(automodEvents)
        .where(and(eq(automodEvents.guildId, guildId), gte(automodEvents.createdAt, since))),
    ]);

    const casesByDay = new Map<string, number>();
    const automodByDay = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const key = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
      casesByDay.set(key, 0);
      automodByDay.set(key, 0);
    }
    for (const row of caseRows) {
      const key = row.createdAt.toISOString().slice(0, 10);
      if (casesByDay.has(key)) casesByDay.set(key, (casesByDay.get(key) ?? 0) + 1);
    }
    for (const row of automodRows) {
      const key = row.createdAt.toISOString().slice(0, 10);
      if (automodByDay.has(key)) automodByDay.set(key, (automodByDay.get(key) ?? 0) + 1);
    }

    return [...casesByDay.entries()].map(([day, caseCount]) => ({
      label: day.slice(5),
      automod: automodByDay.get(day) ?? 0,
      cases: caseCount,
    }));
  }
}
