import { Injectable } from '@nestjs/common';
import {
  and,
  desc,
  emergencyStates,
  eq,
  quarantineProfiles,
  type Database,
  type EmergencyStateRow,
  type QuarantineProfileRow,
} from '@modyrn/database';
import { ActionOrigin, type QuarantineTarget } from '@modyrn/shared';
import { InjectDatabase } from '../database/inject-database.decorator.js';
import {
  DiscordRestService,
  ChannelType as RestChannelType,
} from '../discord/discord-rest.service.js';
import { ModerationService } from '../moderation/moderation.service.js';
import { ulid } from '../common/id.util.js';

/** Powers the Emergency Center: raid mode, lockdowns, slowmode and mass actions. */
@Injectable()
export class EmergencyService {
  constructor(
    @InjectDatabase() private readonly db: Database,
    private readonly rest: DiscordRestService,
    private readonly moderation: ModerationService,
  ) {}

  async getState(guildId: string): Promise<EmergencyStateRow> {
    const [row] = await this.db
      .select()
      .from(emergencyStates)
      .where(eq(emergencyStates.guildId, guildId))
      .limit(1);
    if (row) return row;
    const [created] = await this.db
      .insert(emergencyStates)
      .values({ guildId })
      .onConflictDoNothing()
      .returning();
    return created ?? (await this.getState(guildId));
  }

  private async patchState(
    guildId: string,
    patch: Partial<EmergencyStateRow>,
    userId: string,
  ): Promise<EmergencyStateRow> {
    await this.getState(guildId);
    const [updated] = await this.db
      .update(emergencyStates)
      .set({ ...patch, activatedBy: userId, activatedAt: new Date(), updatedAt: new Date() })
      .where(eq(emergencyStates.guildId, guildId))
      .returning();
    return updated!;
  }

  async setRaidMode(guildId: string, enabled: boolean, userId: string) {
    return this.patchState(guildId, { raidModeEnabled: enabled }, userId);
  }

  async setInviteRestriction(guildId: string, restricted: boolean, userId: string) {
    return this.patchState(guildId, { invitesRestricted: restricted }, userId);
  }

  /** Locks or unlocks every text channel for @everyone (server freeze). */
  async setChatFrozen(guildId: string, frozen: boolean, userId: string) {
    const channels = await this.rest.listChannels(guildId);
    const textChannels = channels.filter(
      (c) => c.type === RestChannelType.GuildText || c.type === RestChannelType.GuildAnnouncement,
    );
    await Promise.allSettled(
      textChannels.map((c) =>
        this.rest.setChannelSendPermission(
          c.id,
          guildId,
          !frozen,
          `Chat ${frozen ? 'freeze' : 'unfreeze'} by ${userId}`,
        ),
      ),
    );
    return this.patchState(guildId, { chatFrozen: frozen, serverLocked: frozen }, userId);
  }

  /** Locks or unlocks a single channel for @everyone. */
  async setChannelLock(_guildId: string, channelId: string, locked: boolean, userId: string) {
    await this.rest.setChannelSendPermission(
      channelId,
      _guildId,
      !locked,
      `Channel ${locked ? 'lock' : 'unlock'} by ${userId}`,
    );
    return { channelId, locked };
  }

  async setSlowmode(_guildId: string, channelId: string, seconds: number, userId: string) {
    await this.rest.setSlowmode(channelId, seconds, `Slowmode by ${userId}`);
    return { channelId, seconds };
  }

  /** Sends an emergency announcement embed to a channel. */
  async announce(channelId: string, message: string) {
    await this.rest.sendMessage(channelId, {
      embeds: [{ title: '🚨 Emergency Announcement', description: message, color: 0xf04747 }],
    });
    return { ok: true };
  }

  /** Applies a mass moderation action to a list of users. */
  async massAction(
    guildId: string,
    userId: string,
    action: 'ban' | 'kick' | 'quarantine',
    targetUserIds: string[],
    reason?: string,
  ): Promise<{ succeeded: number; failed: number }> {
    let succeeded = 0;
    let failed = 0;
    for (const targetUserId of targetUserIds) {
      const base = {
        guildId,
        moderatorId: userId,
        targetUserId,
        reason: reason ?? 'Emergency mass action',
        origin: ActionOrigin.Emergency,
        dmUser: false as const,
      };
      try {
        if (action === 'ban') await this.moderation.ban(base);
        else if (action === 'kick') await this.moderation.kick(base);
        else await this.moderation.quarantine(base);
        succeeded += 1;
      } catch {
        failed += 1;
      }
    }
    return { succeeded, failed };
  }

  // --- Quarantine profiles ---------------------------------------------------

  listProfiles(guildId: string): Promise<QuarantineProfileRow[]> {
    return this.db
      .select()
      .from(quarantineProfiles)
      .where(eq(quarantineProfiles.guildId, guildId))
      .orderBy(desc(quarantineProfiles.createdAt));
  }

  async createProfile(
    guildId: string,
    input: {
      name: string;
      description?: string;
      target: QuarantineTarget;
      quarantineRoleId: string;
      stripRoles?: boolean;
      durationMinutes?: number;
    },
  ): Promise<QuarantineProfileRow> {
    const [created] = await this.db
      .insert(quarantineProfiles)
      .values({
        id: ulid(),
        guildId,
        name: input.name,
        description: input.description,
        target: input.target,
        quarantineRoleId: input.quarantineRoleId,
        stripRoles: input.stripRoles ?? true,
        durationMinutes: input.durationMinutes,
      })
      .returning();
    return created!;
  }

  async deleteProfile(guildId: string, profileId: string): Promise<void> {
    await this.db
      .delete(quarantineProfiles)
      .where(and(eq(quarantineProfiles.guildId, guildId), eq(quarantineProfiles.id, profileId)));
  }
}
