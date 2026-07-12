import { cookies } from 'next/headers';
import { apiFetch, ApiRequestError } from './api';

export interface SessionUser {
  id: string;
  username: string;
  globalName?: string | null;
  avatar?: string | null;
}

export interface SessionGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
}

export interface Session {
  user: SessionUser;
  guilds: SessionGuild[];
  botClientId: string;
}

/**
 * Builds the Discord bot invite URL for a specific guild from the bot client ID.
 * Independent of any guild-scoped API call so the invite button always works.
 */
export function buildInviteUrl(botClientId: string, guildId: string): string {
  const params = new URLSearchParams({
    client_id: botClientId,
    scope: 'bot applications.commands',
    permissions: '8',
    guild_id: guildId,
    disable_guild_select: 'true',
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

/**
 * Fetches the current session from the API, forwarding the incoming cookies so
 * the request is authenticated. Returns `null` when unauthenticated.
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  try {
    return await apiFetch<Session>('/auth/me', {
      cookie: cookieHeader,
      cache: 'no-store',
    });
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
      return null;
    }
    // On transient API failure, treat as unauthenticated rather than crashing.
    return null;
  }
}
