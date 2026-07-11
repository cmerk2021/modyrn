import { type ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { ModerationActionType } from '@modyrn/shared';
import type { ApiClient } from '../api-client.js';
import { logger } from '../logger.js';
import { parseDuration } from '../util/duration.js';

/** Maps a slash command name to the moderation action it performs. */
const COMMAND_ACTION: Record<string, ModerationActionType> = {
  warn: ModerationActionType.Warn,
  timeout: ModerationActionType.Timeout,
  kick: ModerationActionType.Kick,
  ban: ModerationActionType.Ban,
  unban: ModerationActionType.Unban,
  quarantine: ModerationActionType.Quarantine,
  note: ModerationActionType.Note,
  purge: ModerationActionType.Purge,
};

/**
 * Handles an incoming slash-command interaction by forwarding a structured
 * action request to the API. The bot performs no policy decisions itself.
 */
export async function handleInteraction(
  interaction: ChatInputCommandInteraction,
  api: ApiClient,
): Promise<void> {
  if (!interaction.inGuild()) {
    await interaction.reply({
      content: 'Modyrn commands can only be used inside a server.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    if (interaction.commandName === 'case') {
      await handleCaseLookup(interaction, api);
      return;
    }

    const action = COMMAND_ACTION[interaction.commandName];
    if (!action) {
      await interaction.editReply('Unknown command.');
      return;
    }

    const durationRaw = interaction.options.getString('duration') ?? undefined;
    const payload = {
      guildId: interaction.guildId,
      action,
      moderatorId: interaction.user.id,
      targetUserId:
        interaction.options.getUser('user')?.id ??
        interaction.options.getString('user_id') ??
        undefined,
      reason: interaction.options.getString('reason') ?? undefined,
      content: interaction.options.getString('content') ?? undefined,
      count: interaction.options.getInteger('count') ?? undefined,
      channelId: interaction.channelId,
      durationMs: durationRaw ? parseDuration(durationRaw) : undefined,
      origin: 'command',
    };

    const result = await api.post<{ caseNumber?: number }>('/internal/actions', payload);
    if (!result) {
      await interaction.editReply('The action could not be completed. Please try again.');
      return;
    }

    await interaction.editReply(
      result.caseNumber ? `Done. Created case #${result.caseNumber}.` : 'Action completed.',
    );
  } catch (error) {
    logger.error({ err: error, command: interaction.commandName }, 'Interaction handling failed');
    await interaction.editReply('Something went wrong handling that command.');
  }
}

async function handleCaseLookup(
  interaction: ChatInputCommandInteraction,
  api: ApiClient,
): Promise<void> {
  const number = interaction.options.getInteger('number', true);
  const result = await api.post<{ found: boolean; summary?: string }>('/internal/case-lookup', {
    guildId: interaction.guildId,
    caseNumber: number,
  });
  await interaction.editReply(
    result?.found ? (result.summary ?? `Case #${number}`) : `Case #${number} was not found.`,
  );
}
