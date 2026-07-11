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
