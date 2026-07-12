import { Injectable } from '@nestjs/common';
import {
  and,
  desc,
  embedTemplates,
  eq,
  reactionRoles,
  utilityConfigs,
  type Database,
  type EmbedTemplate,
  type ReactionRole,
  type UtilityConfig,
} from '@modyrn/database';
import type { ManagedEmbed, ManagedMessage, UtilityModule } from '@modyrn/shared';
import { InjectDatabase } from '../database/inject-database.decorator.js';
import { DiscordRestService } from '../discord/discord-rest.service.js';
import { ulid } from '../common/id.util.js';

/** Converts a Modyrn ManagedEmbed into a Discord embed payload. */
export function toDiscordEmbed(embed: ManagedEmbed): Record<string, unknown> {
  return {
    title: embed.title,
    description: embed.description,
    color: embed.color,
    url: embed.url,
    author: embed.author
      ? { name: embed.author.name, url: embed.author.url, icon_url: embed.author.iconUrl }
      : undefined,
    thumbnail: embed.thumbnail ? { url: embed.thumbnail.url } : undefined,
    image: embed.image ? { url: embed.image.url } : undefined,
    footer: embed.footer ? { text: embed.footer.text, icon_url: embed.footer.iconUrl } : undefined,
    fields: embed.fields?.map((f) => ({ name: f.name, value: f.value, inline: f.inline })),
    timestamp:
      embed.timestamp === true
        ? new Date().toISOString()
        : typeof embed.timestamp === 'string'
          ? embed.timestamp
          : undefined,
  };
}

/** Converts a full ManagedMessage into a Discord message payload. */
export function toDiscordMessage(message: ManagedMessage): Record<string, unknown> {
  return {
    content: message.content,
    embeds: message.embeds?.map(toDiscordEmbed),
  };
}

/** Utility modules, reaction roles and the embed builder. */
@Injectable()
export class UtilityService {
  constructor(
    @InjectDatabase() private readonly db: Database,
    private readonly rest: DiscordRestService,
  ) {}

  // --- Module configs --------------------------------------------------------

  async getConfig(guildId: string, module: UtilityModule): Promise<UtilityConfig | null> {
    const [row] = await this.db
      .select()
      .from(utilityConfigs)
      .where(and(eq(utilityConfigs.guildId, guildId), eq(utilityConfigs.module, module)))
      .limit(1);
    return row ?? null;
  }

  listConfigs(guildId: string): Promise<UtilityConfig[]> {
    return this.db.select().from(utilityConfigs).where(eq(utilityConfigs.guildId, guildId));
  }

  async setConfig(
    guildId: string,
    module: UtilityModule,
    input: { enabled?: boolean; config?: Record<string, unknown> },
  ): Promise<UtilityConfig> {
    await this.db
      .insert(utilityConfigs)
      .values({
        guildId,
        module,
        enabled: input.enabled ?? false,
        config: input.config ?? {},
      })
      .onConflictDoUpdate({
        target: [utilityConfigs.guildId, utilityConfigs.module],
        set: {
          ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
          ...(input.config !== undefined ? { config: input.config } : {}),
          updatedAt: new Date(),
        },
      });
    const config = await this.getConfig(guildId, module);
    return config!;
  }

  // --- Embed templates -------------------------------------------------------

  listTemplates(guildId: string): Promise<EmbedTemplate[]> {
    return this.db
      .select()
      .from(embedTemplates)
      .where(eq(embedTemplates.guildId, guildId))
      .orderBy(desc(embedTemplates.createdAt));
  }

  async saveTemplate(
    guildId: string,
    input: { name: string; message: ManagedMessage },
  ): Promise<EmbedTemplate> {
    const [created] = await this.db
      .insert(embedTemplates)
      .values({ id: ulid(), guildId, name: input.name, message: input.message })
      .returning();
    return created!;
  }

  async deleteTemplate(guildId: string, templateId: string): Promise<void> {
    await this.db
      .delete(embedTemplates)
      .where(and(eq(embedTemplates.guildId, guildId), eq(embedTemplates.id, templateId)));
  }

  /** Sends a built message to a channel. Returns the Discord message ID. */
  async sendMessage(channelId: string, message: ManagedMessage): Promise<{ id: string }> {
    return this.rest.sendMessage(channelId, toDiscordMessage(message));
  }

  // --- Reaction roles --------------------------------------------------------

  listReactionRoles(guildId: string): Promise<ReactionRole[]> {
    return this.db
      .select()
      .from(reactionRoles)
      .where(eq(reactionRoles.guildId, guildId))
      .orderBy(desc(reactionRoles.createdAt));
  }

  async createReactionRole(
    guildId: string,
    input: {
      channelId: string;
      messageId?: string;
      type?: string;
      exclusive?: boolean;
      mappings: { key: string; roleId: string; label?: string }[];
    },
  ): Promise<ReactionRole> {
    const [created] = await this.db
      .insert(reactionRoles)
      .values({
        id: ulid(),
        guildId,
        channelId: input.channelId,
        messageId: input.messageId,
        type: input.type ?? 'reaction',
        exclusive: input.exclusive ?? false,
        mappings: input.mappings,
      })
      .returning();
    return created!;
  }

  async deleteReactionRole(guildId: string, id: string): Promise<void> {
    await this.db
      .delete(reactionRoles)
      .where(and(eq(reactionRoles.guildId, guildId), eq(reactionRoles.id, id)));
  }

  // --- Event hooks (welcome / autorole) --------------------------------------

  /** Sends the welcome message and applies auto-roles when a member joins. */
  async onMemberJoin(guildId: string, userId: string): Promise<void> {
    const welcome = await this.getConfig(guildId, 'welcome_messages' as UtilityModule);
    if (welcome?.enabled) {
      const cfg = welcome.config as { channelId?: string; content?: string };
      if (cfg.channelId && cfg.content) {
        await this.rest
          .sendMessage(cfg.channelId, {
            content: cfg.content.replace(/\{user\}/g, `<@${userId}>`),
          })
          .catch(() => null);
      }
    }

    const autoRole = await this.getConfig(guildId, 'auto_roles' as UtilityModule);
    if (autoRole?.enabled) {
      const cfg = autoRole.config as { roleIds?: string[] };
      for (const roleId of cfg.roleIds ?? []) {
        await this.rest.addRole(guildId, userId, roleId, 'Auto-role').catch(() => null);
      }
    }
  }
}
