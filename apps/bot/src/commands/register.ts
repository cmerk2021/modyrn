import { REST, Routes } from 'discord.js';
import type { BotConfig } from '../config.js';
import { logger } from '../logger.js';
import { commandDefinitions } from './definitions.js';

/**
 * Registers Modyrn's slash commands globally. Called once on startup. Discord
 * de-duplicates by name, so this is safe to run every boot.
 */
export async function registerCommands(config: BotConfig): Promise<void> {
  const rest = new REST({ version: '10' }).setToken(config.DISCORD_TOKEN);
  logger.info(`Registering ${commandDefinitions.length} slash commands...`);
  await rest.put(Routes.applicationCommands(config.DISCORD_CLIENT_ID), {
    body: commandDefinitions,
  });
  logger.info('Slash commands registered.');
}
