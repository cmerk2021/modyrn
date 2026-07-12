import { cookies } from 'next/headers';
import { apiFetch, ApiRequestError } from './api';

/** Bot-presence status for a guild. */
export interface GuildAccess {
  botPresent: boolean;
  inviteUrl: string;
}

export interface GuildRecord {
  id: string;
  name: string;
  icon: string | null;
  complexityMode: 'simple' | 'advanced' | 'expert';
  setupCompleted: boolean;
  settings: Record<string, unknown>;
}

/** Forwards the incoming cookies so server-side API calls are authenticated. */
async function cookieHeader(): Promise<string> {
  return (await cookies()).toString();
}

/** Checks whether the bot is in the guild (real-time) and gets its invite URL. */
export async function getGuildAccess(guildId: string): Promise<GuildAccess | null> {
  try {
    return await apiFetch<GuildAccess>(`/guilds/${guildId}/access`, {
      cookie: await cookieHeader(),
      cache: 'no-store',
    });
  } catch (error) {
    if (error instanceof ApiRequestError && (error.status === 401 || error.status === 403)) {
      return null;
    }
    return null;
  }
}

/** Fetches the guild record (settings, complexity mode). */
export async function getGuildRecord(guildId: string): Promise<GuildRecord | null> {
  try {
    return await apiFetch<GuildRecord>(`/guilds/${guildId}`, {
      cookie: await cookieHeader(),
      cache: 'no-store',
    });
  } catch {
    return null;
  }
}
