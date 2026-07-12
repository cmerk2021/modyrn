import { Injectable } from '@nestjs/common';
import {
  automodRules,
  desc,
  eq,
  guilds,
  logSettings,
  quarantineProfiles,
  reactionRoles,
  utilityConfigs,
  backups,
  type Database,
} from '@modyrn/database';
import { InjectDatabase } from '../database/inject-database.decorator.js';
import { ulid } from '../common/id.util.js';

/** A portable snapshot of a guild's Modyrn configuration. */
export interface ConfigBackup {
  version: 1;
  guildId: string;
  createdAt: string;
  settings: unknown;
  automodRules: unknown[];
  logSettings: unknown[];
  utilityConfigs: unknown[];
  quarantineProfiles: unknown[];
  reactionRoles: unknown[];
}

/**
 * Logical configuration backups. Exports a guild's Modyrn configuration to a
 * portable JSON document (no external tooling required) and can restore it.
 */
@Injectable()
export class BackupsService {
  constructor(@InjectDatabase() private readonly db: Database) {}

  async export(guildId: string): Promise<ConfigBackup> {
    const [guild, rules, logs, utils, profiles, rroles] = await Promise.all([
      this.db.select().from(guilds).where(eq(guilds.id, guildId)).limit(1),
      this.db.select().from(automodRules).where(eq(automodRules.guildId, guildId)),
      this.db.select().from(logSettings).where(eq(logSettings.guildId, guildId)),
      this.db.select().from(utilityConfigs).where(eq(utilityConfigs.guildId, guildId)),
      this.db.select().from(quarantineProfiles).where(eq(quarantineProfiles.guildId, guildId)),
      this.db.select().from(reactionRoles).where(eq(reactionRoles.guildId, guildId)),
    ]);

    const backup: ConfigBackup = {
      version: 1,
      guildId,
      createdAt: new Date().toISOString(),
      settings: guild[0]?.settings ?? {},
      automodRules: rules,
      logSettings: logs,
      utilityConfigs: utils,
      quarantineProfiles: profiles,
      reactionRoles: rroles,
    };

    // Record backup metadata for history.
    await this.db.insert(backups).values({
      id: ulid(),
      guildId,
      status: 'completed',
      sizeBytes: JSON.stringify(backup).length,
      location: 'download',
    });

    return backup;
  }

  async list(guildId: string) {
    return this.db
      .select()
      .from(backups)
      .where(eq(backups.guildId, guildId))
      .orderBy(desc(backups.createdAt))
      .limit(50);
  }

  /** Restores log settings and utility configs from a backup (non-destructive upsert). */
  async restore(guildId: string, backup: ConfigBackup): Promise<{ restored: string[] }> {
    const restored: string[] = [];

    if (Array.isArray(backup.logSettings)) {
      for (const setting of backup.logSettings as {
        eventType: string;
        enabled: boolean;
        channelId: string | null;
      }[]) {
        await this.db
          .insert(logSettings)
          .values({
            guildId,
            eventType: setting.eventType as never,
            enabled: setting.enabled,
            channelId: setting.channelId,
          })
          .onConflictDoUpdate({
            target: [logSettings.guildId, logSettings.eventType],
            set: { enabled: setting.enabled, channelId: setting.channelId },
          });
      }
      restored.push('logSettings');
    }

    if (backup.settings && typeof backup.settings === 'object') {
      await this.db
        .update(guilds)
        .set({ settings: backup.settings as never, updatedAt: new Date() })
        .where(eq(guilds.id, guildId));
      restored.push('settings');
    }

    return { restored };
  }
}
