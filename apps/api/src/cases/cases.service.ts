import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  and,
  asc,
  caseLinks,
  caseNotes,
  cases,
  count,
  desc,
  eq,
  ilike,
  inArray,
  or,
  sql,
  type Case,
  type CaseLink,
  type CaseNote,
  type CaseEvidence,
  type Database,
} from '@modyrn/database';
import {
  CaseSeverity,
  CaseStatus,
  PAGINATION,
  type ModerationActionType,
  type PaginatedResult,
} from '@modyrn/shared';
import { InjectDatabase } from '../database/inject-database.decorator.js';
import { NamesService } from '../discord/names.service.js';
import { ulid } from '../common/id.util.js';

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

/** A case with resolved display names for the moderator and target. */
export interface EnrichedCase extends Case {
  targetName: string;
  moderatorName: string;
}

/** A full case view: the case plus its notes, linked cases and resolved names. */
export interface CaseDetail extends EnrichedCase {
  notes: (CaseNote & { authorName: string })[];
  links: {
    id: string;
    linkedCaseId: string;
    createdBy: string;
    createdByName: string;
    createdAt: Date;
    case: EnrichedCase | null;
  }[];
  /** Friendly names resolved from `metadata` (e.g. channel, role). */
  metadataNames: Record<string, string>;
}

/** Reads and mutates moderation cases — the audit backbone of the platform. */
@Injectable()
export class CasesService {
  constructor(
    @InjectDatabase() private readonly db: Database,
    private readonly names: NamesService,
  ) {}

  /** Attaches resolved moderator/target display names to a batch of cases. */
  private async enrich(guildId: string, rows: Case[]): Promise<EnrichedCase[]> {
    const names = await this.names.userNames(
      guildId,
      rows.flatMap((r) => [r.targetUserId, r.moderatorId]),
    );
    return rows.map((r) => ({
      ...r,
      targetName: names[r.targetUserId] ?? r.targetUserId,
      moderatorName: names[r.moderatorId] ?? r.moderatorId,
    }));
  }

  async list(guildId: string, query: CaseQuery): Promise<PaginatedResult<EnrichedCase>> {
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
    const enriched = await this.enrich(guildId, items);
    return { items: enriched, total, page, pageSize, hasMore: page * pageSize < total };
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

  /** Full case view with notes, linked cases and resolved display names. */
  async getDetail(guildId: string, caseId: string): Promise<CaseDetail> {
    const row = await this.get(guildId, caseId);

    const [noteRows, linkRows] = await Promise.all([
      this.db
        .select()
        .from(caseNotes)
        .where(and(eq(caseNotes.guildId, guildId), eq(caseNotes.caseId, caseId)))
        .orderBy(desc(caseNotes.createdAt)),
      this.db
        .select()
        .from(caseLinks)
        .where(and(eq(caseLinks.guildId, guildId), eq(caseLinks.caseId, caseId)))
        .orderBy(desc(caseLinks.createdAt)),
    ]);

    const linkedIds = linkRows.map((l) => l.linkedCaseId);
    const linkedRows = linkedIds.length
      ? await this.db
          .select()
          .from(cases)
          .where(and(eq(cases.guildId, guildId), inArray(cases.id, linkedIds)))
      : [];

    const names = await this.names.userNames(guildId, [
      row.targetUserId,
      row.moderatorId,
      ...noteRows.map((n) => n.authorId),
      ...linkRows.map((l) => l.createdBy),
      ...linkedRows.flatMap((r) => [r.targetUserId, r.moderatorId]),
    ]);
    const nameOf = (id: string): string => names[id] ?? id;

    const enrichedLinked = new Map(
      linkedRows.map((r) => [
        r.id,
        { ...r, targetName: nameOf(r.targetUserId), moderatorName: nameOf(r.moderatorId) },
      ]),
    );

    return {
      ...row,
      targetName: nameOf(row.targetUserId),
      moderatorName: nameOf(row.moderatorId),
      notes: noteRows.map((n) => ({ ...n, authorName: nameOf(n.authorId) })),
      links: linkRows.map((l) => ({
        id: l.id,
        linkedCaseId: l.linkedCaseId,
        createdBy: l.createdBy,
        createdByName: nameOf(l.createdBy),
        createdAt: l.createdAt,
        case: enrichedLinked.get(l.linkedCaseId) ?? null,
      })),
      metadataNames: await this.resolveMetadataNames(guildId, row.metadata),
    };
  }

  /** Resolves channel/role IDs stored in a case's metadata to friendly names. */
  private async resolveMetadataNames(
    guildId: string,
    metadata: Record<string, unknown> | null,
  ): Promise<Record<string, string>> {
    if (!metadata) return {};
    const out: Record<string, string> = {};
    const channelId = typeof metadata.channelId === 'string' ? metadata.channelId : undefined;
    const roleId =
      typeof metadata.roleId === 'string'
        ? metadata.roleId
        : typeof metadata.quarantineRoleId === 'string'
          ? metadata.quarantineRoleId
          : undefined;
    if (channelId) {
      const channels = await this.names.channelNames(guildId);
      if (channels[channelId]) out.channel = channels[channelId];
    }
    if (roleId) {
      const roles = await this.names.roleNames(guildId);
      if (roles[roleId]) out.role = roles[roleId];
    }
    return out;
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

  async setSeverity(guildId: string, caseId: string, severity: CaseSeverity): Promise<Case> {
    await this.get(guildId, caseId);
    const [updated] = await this.db
      .update(cases)
      .set({ severity, updatedAt: new Date() })
      .where(and(eq(cases.guildId, guildId), eq(cases.id, caseId)))
      .returning();
    return updated!;
  }

  /** Replaces the structured evidence attached to a case. */
  async setEvidence(guildId: string, caseId: string, evidence: CaseEvidence): Promise<Case> {
    await this.get(guildId, caseId);
    const [updated] = await this.db
      .update(cases)
      .set({ evidence, updatedAt: new Date() })
      .where(and(eq(cases.guildId, guildId), eq(cases.id, caseId)))
      .returning();
    return updated!;
  }

  // --- Case notes ------------------------------------------------------------

  async addNote(
    guildId: string,
    caseId: string,
    authorId: string,
    content: string,
  ): Promise<CaseNote> {
    await this.get(guildId, caseId);
    const [note] = await this.db
      .insert(caseNotes)
      .values({ id: ulid(), caseId, guildId, authorId, content })
      .returning();
    return note!;
  }

  async deleteNote(guildId: string, caseId: string, noteId: string): Promise<void> {
    await this.db
      .delete(caseNotes)
      .where(
        and(eq(caseNotes.guildId, guildId), eq(caseNotes.caseId, caseId), eq(caseNotes.id, noteId)),
      );
  }

  // --- Case links (prior moderation history) ---------------------------------

  /** Links a prior case (e.g. an earlier warn) to the given case. */
  async addLink(
    guildId: string,
    caseId: string,
    linkedCaseId: string,
    userId: string,
  ): Promise<CaseLink> {
    if (caseId === linkedCaseId) {
      throw new BadRequestException('A case cannot be linked to itself.');
    }
    await this.get(guildId, caseId);
    await this.get(guildId, linkedCaseId);
    await this.db
      .insert(caseLinks)
      .values({ id: ulid(), guildId, caseId, linkedCaseId, createdBy: userId })
      .onConflictDoNothing();
    const [link] = await this.db
      .select()
      .from(caseLinks)
      .where(and(eq(caseLinks.caseId, caseId), eq(caseLinks.linkedCaseId, linkedCaseId)))
      .limit(1);
    return link!;
  }

  async removeLink(guildId: string, caseId: string, linkId: string): Promise<void> {
    await this.db
      .delete(caseLinks)
      .where(
        and(eq(caseLinks.guildId, guildId), eq(caseLinks.caseId, caseId), eq(caseLinks.id, linkId)),
      );
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
