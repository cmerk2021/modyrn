import { Injectable } from '@nestjs/common';
import { and, automodEvents, cases, eq, gte, type Database } from '@modyrn/database';
import { InjectDatabase } from '../database/inject-database.decorator.js';

export interface AnalyticsReport {
  rangeDays: number;
  totals: { cases: number; automodEvents: number };
  casesByDay: { day: string; count: number }[];
  automodByDay: { day: string; count: number }[];
  actionBreakdown: { action: string; count: number }[];
  topModerators: { moderatorId: string; count: number }[];
}

/** Aggregates moderation and automod activity for the analytics dashboard. */
@Injectable()
export class AnalyticsService {
  constructor(@InjectDatabase() private readonly db: Database) {}

  async report(guildId: string, rangeDays = 14): Promise<AnalyticsReport> {
    const since = new Date(Date.now() - rangeDays * 86_400_000);

    const [caseRows, automodRows] = await Promise.all([
      this.db
        .select()
        .from(cases)
        .where(and(eq(cases.guildId, guildId), gte(cases.createdAt, since))),
      this.db
        .select()
        .from(automodEvents)
        .where(and(eq(automodEvents.guildId, guildId), gte(automodEvents.createdAt, since))),
    ]);

    return {
      rangeDays,
      totals: { cases: caseRows.length, automodEvents: automodRows.length },
      casesByDay: this.byDay(
        caseRows.map((c) => c.createdAt),
        rangeDays,
      ),
      automodByDay: this.byDay(
        automodRows.map((e) => e.createdAt),
        rangeDays,
      ),
      actionBreakdown: this.count(caseRows.map((c) => c.action)),
      topModerators: this.count(caseRows.map((c) => c.moderatorId))
        .map((r) => ({ moderatorId: r.action, count: r.count }))
        .slice(0, 10),
    };
  }

  /** Buckets timestamps into a continuous per-day series over the range. */
  private byDay(dates: Date[], rangeDays: number): { day: string; count: number }[] {
    const buckets = new Map<string, number>();
    for (let i = rangeDays - 1; i >= 0; i--) {
      const key = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
      buckets.set(key, 0);
    }
    for (const date of dates) {
      const key = date.toISOString().slice(0, 10);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    return [...buckets.entries()].map(([day, count]) => ({ day, count }));
  }

  private count(values: string[]): { action: string; count: number }[] {
    const map = new Map<string, number>();
    for (const value of values) map.set(value, (map.get(value) ?? 0) + 1);
    return [...map.entries()]
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count);
  }
}
