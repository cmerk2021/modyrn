import type { BotConfig } from './config.js';
import { logger } from './logger.js';

/**
 * Thin HTTP client the bot uses to talk to the Modyrn API. The bot holds no
 * business logic — it forwards normalized events and action requests to the API,
 * which is the single source of truth.
 */
export class ApiClient {
  constructor(private readonly config: BotConfig) {}

  private get headers(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.config.BOT_API_SECRET) {
      headers['x-modyrn-bot-secret'] = this.config.BOT_API_SECRET;
    }
    return headers;
  }

  /** POSTs a JSON payload to an internal API endpoint. Errors are logged, not thrown. */
  async post<T = unknown>(path: string, body: unknown): Promise<T | null> {
    try {
      const res = await fetch(`${this.config.API_URL}/api/v1${path}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        logger.warn({ path, status: res.status }, 'API request failed');
        return null;
      }
      return (await res.json()) as T;
    } catch (error) {
      logger.error({ path, err: error }, 'API request threw');
      return null;
    }
  }

  /** Reports a guild's presence and metadata to the API. */
  syncGuild(guild: { id: string; name: string; icon: string | null; ownerId: string }) {
    return this.post('/internal/guilds/sync', guild);
  }

  /** Forwards a normalized gateway event to the API for processing. */
  forwardEvent(event: string, payload: unknown) {
    return this.post('/internal/events', { event, payload });
  }
}
