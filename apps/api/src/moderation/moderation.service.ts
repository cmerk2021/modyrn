import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  and,
  cases,
  eq,
  guilds,
  memberNotes,
  quarantineProfiles,
  quarantineRecords,
  sql,
  type Case,
  type Database,
} from '@modyrn/database';
import {
  ACTION_METADATA,
  ActionOrigin,
  CaseStatus,
  ModerationActionType,
  TEMPORARY_ACTION_TYPES,
  type CaseSeverity,
} from '@modyrn/shared';
import { InjectDatabase } from '../database/inject-database.decorator.js';
import { DiscordRestService } from '../discord/discord-rest.service.js';
import { ulid } from '../common/id.util.js';

/** Common inputs shared by moderation actions. */
interface BaseActionInput {
  guildId: string;
  moderatorId: string;
  targetUserId: string;
  reason?: string;
  origin?: ActionOrigin;
  dmUser?: boolean;
}

const SEVERITY_COLORS: Record<CaseSeverity, number> = {
  low: 0x5865f2,
  medium: 0xfaa61a,
  high: 0xf04747,
  critical: 0x992d22,
};

/**
 * Executes moderation actions against Discord (via the bot token) and records a
 * {@link Case} for each. Also DMs affected users (best effort) and mirrors the
 * action to the guild's moderation log channel.
 */
@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(
    @InjectDatabase() private readonly db: Database,
    private readonly rest: DiscordRestService,
  ) {}

  // --- Public actions --------------------------------------------------------

  async warn(input: BaseActionInput): Promise<Case> {
    await this.tryDm(input, ModerationActionType.Warn);
    return this.createCase(input, ModerationActionType.Warn);
  }

  async note(input: Omit<BaseActionInput, 'reason'> & { content: string }): Promise<Case> {
    const noteId = ulid();
    await this.db.insert(memberNotes).values({
      id: noteId,
      guildId: input.guildId,
      userId: input.targetUserId,
      authorId: input.moderatorId,
      content: input.content,
    });
    return this.createCase(
      { ...input, reason: input.content },
      ModerationActionType.Note,
      undefined,
      { noteId },
    );
  }

  async timeout(input: BaseActionInput & { durationMs: number }): Promise<Case> {
    const until = new Date(Date.now() + input.durationMs).toISOString();
    await this.tryDm(input, ModerationActionType.Timeout, input.durationMs);
    await this.rest.timeout(input.guildId, input.targetUserId, until, this.auditReason(input));
    return this.createCase(input, ModerationActionType.Timeout, input.durationMs);
  }

  async removeTimeout(input: BaseActionInput): Promise<Case> {
    await this.rest.timeout(input.guildId, input.targetUserId, null, this.auditReason(input));
    return this.createCase(input, ModerationActionType.RemoveTimeout);
  }

  async kick(input: BaseActionInput): Promise<Case> {
    await this.tryDm(input, ModerationActionType.Kick);
    await this.rest.kick(input.guildId, input.targetUserId, this.auditReason(input));
    return this.createCase(input, ModerationActionType.Kick);
  }

  async ban(
    input: BaseActionInput & { durationMs?: number; deleteMessageDays?: number },
  ): Promise<Case> {
    await this.tryDm(input, ModerationActionType.Ban, input.durationMs);
    await this.rest.ban(input.guildId, input.targetUserId, {
      reason: this.auditReason(input),
      deleteMessageSeconds: (input.deleteMessageDays ?? 0) * 86_400,
    });
    return this.createCase(input, ModerationActionType.Ban, input.durationMs);
  }

  async unban(input: BaseActionInput): Promise<Case> {
    await this.rest.unban(input.guildId, input.targetUserId, this.auditReason(input));
    return this.createCase(input, ModerationActionType.Unban);
  }

  /** Softban = ban (to purge messages) then immediately unban. */
  async softban(input: BaseActionInput): Promise<Case> {
    await this.tryDm(input, ModerationActionType.Softban);
    await this.rest.ban(input.guildId, input.targetUserId, {
      reason: this.auditReason(input),
      deleteMessageSeconds: 86_400,
    });
    await this.rest.unban(input.guildId, input.targetUserId, 'Softban (automatic unban)');
    return this.createCase(input, ModerationActionType.Softban);
  }

  async setRole(
    input: BaseActionInput & { roleId: string; operation: 'add' | 'remove' },
  ): Promise<Case> {
    if (input.operation === 'add') {
      await this.rest.addRole(
        input.guildId,
        input.targetUserId,
        input.roleId,
        this.auditReason(input),
      );
    } else {
      await this.rest.removeRole(
        input.guildId,
        input.targetUserId,
        input.roleId,
        this.auditReason(input),
      );
    }
    const action =
      input.operation === 'add' ? ModerationActionType.RoleAdd : ModerationActionType.RoleRemove;
    return this.createCase(input, action, undefined, { roleId: input.roleId });
  }

  async setNickname(input: BaseActionInput & { nickname?: string }): Promise<Case> {
    await this.rest.setNickname(
      input.guildId,
      input.targetUserId,
      input.nickname ?? null,
      this.auditReason(input),
    );
    return this.createCase(input, ModerationActionType.Nickname, undefined, {
      nickname: input.nickname ?? null,
    });
  }

  async purge(
    input: Omit<BaseActionInput, 'targetUserId'> & {
      channelId: string;
      count: number;
      targetUserId?: string;
    },
  ): Promise<{ deleted: number; case: Case }> {
    const messages = await this.rest.listMessages(input.channelId, 100);
    let candidates = messages;
    if (input.targetUserId) {
      candidates = candidates.filter((m) => m.author.id === input.targetUserId);
    }
    const toDelete = candidates.slice(0, input.count).map((m) => m.id);
    if (toDelete.length > 0) {
      await this.rest.bulkDeleteMessages(input.channelId, toDelete, this.auditReason(input));
    }
    const created = await this.createCase(
      {
        guildId: input.guildId,
        moderatorId: input.moderatorId,
        targetUserId: input.targetUserId ?? input.moderatorId,
        reason: input.reason,
        origin: input.origin,
      },
      ModerationActionType.Purge,
      undefined,
      { channelId: input.channelId, deleted: toDelete.length },
    );
    return { deleted: toDelete.length, case: created };
  }

  /**
   * Quarantines a member: strips their current roles (stored for restoration)
   * and applies the quarantine role from the given profile or the guild default.
   */
  async quarantine(input: BaseActionInput & { profileId?: string }): Promise<Case> {
    const { quarantineRoleId, stripRoles } = await this.resolveQuarantineRole(
      input.guildId,
      input.profileId,
    );

    const member = await this.rest.getMember(input.guildId, input.targetUserId);
    if (!member) throw new BadRequestException('Member not found in guild.');

    const stripped = stripRoles
      ? member.roles.filter((r) => r !== quarantineRoleId && r !== input.guildId)
      : [];

    if (stripRoles) {
      await this.rest.setMemberRoles(
        input.guildId,
        input.targetUserId,
        [quarantineRoleId],
        this.auditReason(input),
      );
    } else {
      await this.rest.addRole(
        input.guildId,
        input.targetUserId,
        quarantineRoleId,
        this.auditReason(input),
      );
    }

    const created = await this.createCase(input, ModerationActionType.Quarantine, undefined, {
      quarantineRoleId,
    });

    await this.db.insert(quarantineRecords).values({
      id: ulid(),
      guildId: input.guildId,
      userId: input.targetUserId,
      profileId: input.profileId ?? null,
      caseId: created.id,
      strippedRoleIds: stripped,
    });

    return created;
  }

  /** Releases a member from quarantine, restoring their previous roles. */
  async unquarantine(input: BaseActionInput): Promise<Case> {
    const [record] = await this.db
      .select()
      .from(quarantineRecords)
      .where(
        and(
          eq(quarantineRecords.guildId, input.guildId),
          eq(quarantineRecords.userId, input.targetUserId),
          sql`${quarantineRecords.releasedAt} IS NULL`,
        ),
      )
      .limit(1);

    if (record) {
      await this.rest.setMemberRoles(
        input.guildId,
        input.targetUserId,
        record.strippedRoleIds,
        this.auditReason(input),
      );
      await this.db
        .update(quarantineRecords)
        .set({ releasedAt: new Date() })
        .where(eq(quarantineRecords.id, record.id));
    }

    return this.createCase(input, ModerationActionType.Unquarantine);
  }

  // --- Internals -------------------------------------------------------------

  private async resolveQuarantineRole(
    guildId: string,
    profileId?: string,
  ): Promise<{ quarantineRoleId: string; stripRoles: boolean }> {
    if (profileId) {
      const [profile] = await this.db
        .select()
        .from(quarantineProfiles)
        .where(and(eq(quarantineProfiles.id, profileId), eq(quarantineProfiles.guildId, guildId)))
        .limit(1);
      if (profile) {
        return { quarantineRoleId: profile.quarantineRoleId, stripRoles: profile.stripRoles };
      }
    }
    const guild = await this.getGuild(guildId);
    const roleId = guild.settings.quarantineRoleId;
    if (!roleId) {
      throw new BadRequestException(
        'No quarantine role configured. Set one in Settings or create a quarantine profile.',
      );
    }
    return { quarantineRoleId: roleId, stripRoles: true };
  }

  private async getGuild(guildId: string) {
    const [guild] = await this.db.select().from(guilds).where(eq(guilds.id, guildId)).limit(1);
    if (!guild) throw new BadRequestException('Guild not found.');
    return guild;
  }

  /** Allocates the next per-guild case number and inserts the case row. */
  private async createCase(
    input: BaseActionInput,
    action: ModerationActionType,
    durationMs?: number,
    metadata?: Record<string, unknown>,
  ): Promise<Case> {
    const meta = ACTION_METADATA[action];
    const rows = await this.db
      .select({ max: sql<number>`coalesce(max(${cases.caseNumber}), 0)` })
      .from(cases)
      .where(eq(cases.guildId, input.guildId));

    const caseNumber = (rows[0]?.max ?? 0) + 1;
    const expiresAt =
      durationMs && TEMPORARY_ACTION_TYPES.includes(action)
        ? new Date(Date.now() + durationMs)
        : null;

    const [created] = await this.db
      .insert(cases)
      .values({
        id: ulid(),
        guildId: input.guildId,
        caseNumber,
        action,
        status: CaseStatus.Open,
        severity: meta.severity,
        origin: input.origin ?? ActionOrigin.Dashboard,
        targetUserId: input.targetUserId,
        moderatorId: input.moderatorId,
        reason: input.reason,
        durationMs: durationMs ?? null,
        expiresAt,
        metadata: metadata ?? null,
      })
      .returning();

    await this.postModLog(created!);
    return created!;
  }

  /** Mirrors a case to the guild's configured moderation log channel. */
  private async postModLog(caseRow: Case): Promise<void> {
    try {
      const guild = await this.getGuild(caseRow.guildId);
      const channelId = guild.settings.modLogChannelId;
      if (!channelId) return;
      const meta = ACTION_METADATA[caseRow.action];

      await this.rest.sendMessage(channelId, {
        embeds: [
          {
            title: `${meta.label} · Case #${caseRow.caseNumber}`,
            color: SEVERITY_COLORS[caseRow.severity],
            fields: [
              { name: 'User', value: `<@${caseRow.targetUserId}>`, inline: true },
              { name: 'Moderator', value: `<@${caseRow.moderatorId}>`, inline: true },
              { name: 'Reason', value: caseRow.reason || 'No reason provided' },
              ...(caseRow.expiresAt
                ? [
                    {
                      name: 'Expires',
                      value: `<t:${Math.floor(caseRow.expiresAt.getTime() / 1000)}:R>`,
                    },
                  ]
                : []),
            ],
            timestamp: caseRow.createdAt.toISOString(),
          },
        ],
      });
    } catch (error) {
      this.logger.warn(`Failed to post mod-log for case ${caseRow.id}: ${String(error)}`);
    }
  }

  /** Best-effort DM to the affected user before destructive actions. */
  private async tryDm(
    input: BaseActionInput,
    action: ModerationActionType,
    durationMs?: number,
  ): Promise<void> {
    if (input.dmUser === false) return;
    try {
      const guild = await this.getGuild(input.guildId);
      if (input.dmUser === undefined && !guild.settings.dmOnAction) return;
      const meta = ACTION_METADATA[action];
      const duration = durationMs ? ` (${Math.round(durationMs / 60000)} minutes)` : '';
      await this.rest.sendDirectMessage(input.targetUserId, {
        embeds: [
          {
            title: `You were ${meta.pastTense} in ${guild.name}${duration}`,
            description: input.reason || 'No reason provided',
            color: SEVERITY_COLORS[meta.severity],
          },
        ],
      });
    } catch {
      /* DMs disabled — ignore */
    }
  }

  private auditReason(input: { moderatorId: string; reason?: string }): string {
    return `${input.reason ?? 'No reason provided'} (by ${input.moderatorId})`;
  }
}
