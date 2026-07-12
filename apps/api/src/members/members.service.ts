import { Injectable } from '@nestjs/common';
import {
  and,
  cases,
  count,
  desc,
  eq,
  memberNotes,
  quarantineRecords,
  sql,
  type Case,
  type MemberNote,
  type Database,
} from '@modyrn/database';
import { InjectDatabase } from '../database/inject-database.decorator.js';
import { DiscordRestService, type DiscordMember } from '../discord/discord-rest.service.js';
import { ulid } from '../common/id.util.js';

const DISCORD_EPOCH = 1420070400000n;

/** A member row for the explorer list. */
export interface MemberListItem {
  id: string;
  username: string;
  globalName: string | null;
  nickname: string | null;
  avatar: string | null;
  isBot: boolean;
  roleIds: string[];
  joinedAt: string | null;
  accountCreatedAt: string;
}

export interface MemberProfile extends MemberListItem {
  timedOutUntil: string | null;
  quarantined: boolean;
  caseCount: number;
  cases: Case[];
  notes: MemberNote[];
}

/** Backs the Member Explorer: fast listing/search plus rich per-member profiles. */
@Injectable()
export class MembersService {
  constructor(
    @InjectDatabase() private readonly db: Database,
    private readonly rest: DiscordRestService,
  ) {}

  /** Lists or searches guild members via Discord, newest joins first. */
  async list(
    guildId: string,
    opts: { search?: string; limit?: number; after?: string } = {},
  ): Promise<MemberListItem[]> {
    const members = opts.search
      ? await this.rest.searchMembers(guildId, opts.search, opts.limit ?? 25)
      : await this.rest.listMembers(guildId, { limit: opts.limit ?? 100, after: opts.after });
    return members.map((m) => this.toListItem(m));
  }

  /** Full profile: Discord data merged with Modyrn cases, notes and quarantine. */
  async getProfile(guildId: string, userId: string): Promise<MemberProfile | null> {
    const member = await this.rest.getMember(guildId, userId);
    if (!member) return null;

    const [caseRows, noteRows, [countRow], activeQuarantine] = await Promise.all([
      this.db
        .select()
        .from(cases)
        .where(and(eq(cases.guildId, guildId), eq(cases.targetUserId, userId)))
        .orderBy(desc(cases.createdAt))
        .limit(50),
      this.db
        .select()
        .from(memberNotes)
        .where(and(eq(memberNotes.guildId, guildId), eq(memberNotes.userId, userId)))
        .orderBy(desc(memberNotes.createdAt)),
      this.db
        .select({ value: count() })
        .from(cases)
        .where(and(eq(cases.guildId, guildId), eq(cases.targetUserId, userId))),
      this.db
        .select({ id: quarantineRecords.id })
        .from(quarantineRecords)
        .where(
          and(
            eq(quarantineRecords.guildId, guildId),
            eq(quarantineRecords.userId, userId),
            sql`${quarantineRecords.releasedAt} IS NULL`,
          ),
        )
        .limit(1),
    ]);

    return {
      ...this.toListItem(member),
      timedOutUntil: member.communication_disabled_until,
      quarantined: activeQuarantine.length > 0,
      caseCount: countRow?.value ?? 0,
      cases: caseRows,
      notes: noteRows,
    };
  }

  async addNote(
    guildId: string,
    userId: string,
    authorId: string,
    content: string,
  ): Promise<MemberNote> {
    const [note] = await this.db
      .insert(memberNotes)
      .values({ id: ulid(), guildId, userId, authorId, content })
      .returning();
    return note!;
  }

  async deleteNote(guildId: string, noteId: string): Promise<void> {
    await this.db
      .delete(memberNotes)
      .where(and(eq(memberNotes.guildId, guildId), eq(memberNotes.id, noteId)));
  }

  private toListItem(m: DiscordMember): MemberListItem {
    return {
      id: m.user.id,
      username: m.user.username,
      globalName: m.user.global_name,
      nickname: m.nick,
      avatar: m.user.avatar,
      isBot: Boolean(m.user.bot),
      roleIds: m.roles,
      joinedAt: m.joined_at,
      accountCreatedAt: new Date(Number((BigInt(m.user.id) >> 22n) + DISCORD_EPOCH)).toISOString(),
    };
  }
}
