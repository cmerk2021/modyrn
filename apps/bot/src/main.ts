import { Client, Events, GatewayIntentBits, Partials } from 'discord.js';
import { Redis } from 'ioredis';
import { loadConfig } from './config.js';
import { logger } from './logger.js';
import { ApiClient } from './api-client.js';
import { registerCommands } from './commands/register.js';
import { handleInteraction } from './commands/handle-interaction.js';
import { startHeartbeat } from './heartbeat.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const api = new ApiClient(config);
  const redis = new Redis(config.REDIS_URL, { maxRetriesPerRequest: null });

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildModeration,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [Partials.GuildMember, Partials.Message, Partials.Channel],
  });

  let heartbeat: NodeJS.Timeout | undefined;

  client.once(Events.ClientReady, async (ready) => {
    logger.info(`Logged in as ${ready.user.tag} (${ready.user.id})`);
    heartbeat = startHeartbeat(client, redis);

    // Sync every guild the bot is in so the dashboard knows where it's installed.
    for (const [, guild] of ready.guilds.cache) {
      void api.syncGuild({
        id: guild.id,
        name: guild.name,
        icon: guild.icon,
        ownerId: guild.ownerId,
      });
    }
  });

  client.on(Events.GuildCreate, (guild) => {
    logger.info(`Joined guild ${guild.name} (${guild.id})`);
    void api.syncGuild({
      id: guild.id,
      name: guild.name,
      icon: guild.icon,
      ownerId: guild.ownerId,
    });
  });

  client.on(Events.InteractionCreate, (interaction) => {
    if (interaction.isChatInputCommand()) {
      void handleInteraction(interaction, api);
    }
  });

  // Forward raw member join/leave events to the API for automod & logging.
  client.on(Events.GuildMemberAdd, (member) => {
    void api.forwardEvent('member_join', {
      guildId: member.guild.id,
      userId: member.id,
      joinedAt: member.joinedAt?.toISOString(),
    });
  });

  client.on(Events.GuildMemberRemove, (member) => {
    void api.forwardEvent('member_leave', { guildId: member.guild.id, userId: member.id });
  });

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down...`);
    if (heartbeat) clearInterval(heartbeat);
    await client.destroy();
    redis.disconnect();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  await registerCommands(config);
  await client.login(config.DISCORD_TOKEN);
}

main().catch((error) => {
  logger.error({ err: error }, 'Fatal error during bot startup');
  process.exit(1);
});
