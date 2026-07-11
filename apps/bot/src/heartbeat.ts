import type { Client } from 'discord.js';
import type { Redis } from 'ioredis';
import { logger } from './logger.js';

const HEARTBEAT_KEY = 'modyrn:bot:heartbeat';
const INTERVAL_MS = 15_000;

/**
 * Publishes a periodic heartbeat (gateway ping + timestamp) to Redis so the API
 * can surface Discord gateway health on the dashboard without a direct link to
 * the gateway.
 */
export function startHeartbeat(client: Client, redis: Redis): NodeJS.Timeout {
  const beat = async () => {
    try {
      await redis.set(
        HEARTBEAT_KEY,
        JSON.stringify({ at: Date.now(), ping: Math.max(0, Math.round(client.ws.ping)) }),
        'EX',
        60,
      );
    } catch (error) {
      logger.warn({ err: error }, 'Failed to publish heartbeat');
    }
  };

  void beat();
  return setInterval(() => void beat(), INTERVAL_MS);
}
