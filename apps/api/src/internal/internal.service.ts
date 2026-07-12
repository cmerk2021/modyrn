import { Injectable, Logger } from '@nestjs/common';
import { eq, guilds, type Database } from '@modyrn/database';
import { InjectDatabase } from '../database/inject-database.decorator.js';

export interface GuildSyncPayload {
  id: string;
  name: string;
  icon: string | null;
  ownerId: string;
}

/** Handles state the gateway bot pushes to the API (guild presence, etc.). */
@Injectable()
export class InternalService {
  private readonly logger = new Logger(InternalService.name);

  constructor(@InjectDatabase() private readonly db: Database) {}

  /** Upserts a guild the bot is present in. Marks `botPresent` true. */
  async syncGuild(payload: GuildSyncPayload): Promise<void> {
    await this.db
      .insert(guilds)
      .values({
        id: payload.id,
        name: payload.name,
        icon: payload.icon,
        ownerId: payload.ownerId,
        botPresent: true,
      })
      .onConflictDoUpdate({
        target: guilds.id,
        set: {
          name: payload.name,
          icon: payload.icon,
          ownerId: payload.ownerId,
          botPresent: true,
          updatedAt: new Date(),
        },
      });
    this.logger.log(`Synced guild ${payload.name} (${payload.id})`);
  }

  /** Marks a guild as no longer having the bot. */
  async markGuildLeft(guildId: string): Promise<void> {
    await this.db
      .update(guilds)
      .set({ botPresent: false, updatedAt: new Date() })
      .where(eq(guilds.id, guildId));
  }
}
