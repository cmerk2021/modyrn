import { Injectable, NotFoundException } from '@nestjs/common';
import {
  and,
  asc,
  cases,
  count,
  desc,
  eq,
  ilike,
  or,
  sql,
  type Case,
  type Database,
} from '@modyrn/database';
import {
  CaseStatus,
  PAGINATION,
  type ModerationActionType,
  type PaginatedResult,
} from '@modyrn/shared';
import { InjectDatabase } from '../database/inject-database.decorator.js';

export interface CaseQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  action?: ModerationActionType;
  status?: CaseStatus;
  targetUserId?: string;
  moderatorId?: string;
  sortOrder?: 'asc' | 'desc';
}

/** Reads and mutates moderation cases — the audit backbone of the platform. */
@Injectable()
export class CasesService {
  constructor(@InjectDatabase() private readonly db: Database) {}

  async list(guildId: string, query: CaseQuery): Promise<PaginatedResult<Case>> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(query.pageSize ?? PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

    const filters = [eq(cases.guildId, guildId)];
    if (query.action) filters.push(eq(cases.action, query.action));
    if (query.status) filters.push(eq(cases.status, query.status));
    if (query.targetUserId) filters.push(eq(cases.targetUserId, query.targetUserId));
    if (query.moderatorId) filters.push(eq(cases.moderatorId, query.moderatorId));
    if (query.search) {
      const term = query.search.trim();
      const numeric = Number(term.replace('#', ''));
      const searchFilter = or(
        ilike(cases.reason, `%${term}%`),
        eq(cases.targetUserId, term),
        eq(cases.moderatorId, term),
        ...(Number.isFinite(numeric) ? [eq(cases.caseNumber, numeric)] : []),
      );
      if (searchFilter) filters.push(searchFilter);
    }

    const where = and(...filters);
    const orderBy = query.sortOrder === 'asc' ? asc(cases.caseNumber) : desc(cases.caseNumber);

    const [items, [totalRow]] = await Promise.all([
      this.db
        .select()
        .from(cases)
        .where(where)
        .orderBy(orderBy)
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      this.db.select({ value: count() }).from(cases).where(where),
    ]);

    const total = totalRow?.value ?? 0;
    return { items, total, page, pageSize, hasMore: page * pageSize < total };
  }

  async get(guildId: string, caseId: string): Promise<Case> {
    const [row] = await this.db
      .select()
      .from(cases)
      .where(and(eq(cases.guildId, guildId), eq(cases.id, caseId)))
      .limit(1);
    if (!row) throw new NotFoundException('Case not found.');
    return row;
  }

  async getByNumber(guildId: string, caseNumber: number): Promise<Case | null> {
    const [row] = await this.db
      .select()
      .from(cases)
      .where(and(eq(cases.guildId, guildId), eq(cases.caseNumber, caseNumber)))
      .limit(1);
    return row ?? null;
  }

  async updateReason(guildId: string, caseId: string, reason: string): Promise<Case> {
    await this.get(guildId, caseId);
    const [updated] = await this.db
      .update(cases)
      .set({ reason, updatedAt: new Date() })
      .where(and(eq(cases.guildId, guildId), eq(cases.id, caseId)))
      .returning();
    return updated!;
  }

  async setStatus(guildId: string, caseId: string, status: CaseStatus): Promise<Case> {
    await this.get(guildId, caseId);
    const [updated] = await this.db
      .update(cases)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(cases.guildId, guildId), eq(cases.id, caseId)))
      .returning();
    return updated!;
  }

  /** Summary counts by status for the guild (dashboard widgets). */
  async summary(guildId: string): Promise<Record<string, number>> {
    const rows = await this.db
      .select({ status: cases.status, value: count() })
      .from(cases)
      .where(eq(cases.guildId, guildId))
      .groupBy(cases.status);
    const summary: Record<string, number> = {};
    let total = 0;
    for (const row of rows) {
      summary[row.status] = row.value;
      total += row.value;
    }
    summary.total = total;
    return summary;
  }

  /** Number of open (unexpired) temporary actions due for expiry processing. */
  async findExpired(now: Date): Promise<Case[]> {
    return this.db
      .select()
      .from(cases)
      .where(
        and(
          eq(cases.status, CaseStatus.Open),
          sql`${cases.expiresAt} IS NOT NULL AND ${cases.expiresAt} <= ${now}`,
        ),
      )
      .limit(100);
  }
}
