import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service.js';

const DISCORD_API = 'https://discord.com/api/v10';

/** Shape of the OAuth2 token response from Discord. */
export interface DiscordTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

/** Minimal Discord user representation we persist. */
export interface DiscordUser {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
}

/** A guild returned from the `/users/@me/guilds` endpoint. */
export interface DiscordPartialGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  /** Bitfield string of the user's permissions in the guild. */
  permissions: string;
}

/** Discord's MANAGE_GUILD permission bit. */
const MANAGE_GUILD = 1n << 5n;
const ADMINISTRATOR = 1n << 3n;

/**
 * Thin client for Discord's OAuth2 and user endpoints. Contains no business
 * logic beyond talking to Discord.
 */
@Injectable()
export class DiscordOAuthService {
  private readonly logger = new Logger(DiscordOAuthService.name);
  private readonly scopes = ['identify', 'guilds'];

  constructor(private readonly config: AppConfigService) {}

  /** Builds the Discord authorization URL, embedding an anti-CSRF `state`. */
  buildAuthorizeUrl(state: string): string {
    const { clientId, redirectUri } = this.config.discord;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: this.scopes.join(' '),
      state,
      prompt: 'consent',
    });
    return `${DISCORD_API}/oauth2/authorize?${params.toString()}`;
  }

  /** Exchanges an authorization code for access/refresh tokens. */
  async exchangeCode(code: string): Promise<DiscordTokenResponse> {
    const { clientId, clientSecret, redirectUri } = this.config.discord;
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    });

    const res = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!res.ok) {
      this.logger.warn(`Token exchange failed: ${res.status}`);
      throw new UnauthorizedException('Failed to authenticate with Discord.');
    }
    return (await res.json()) as DiscordTokenResponse;
  }

  /** Fetches the authenticated user's profile. */
  async fetchUser(accessToken: string): Promise<DiscordUser> {
    const res = await fetch(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new UnauthorizedException('Failed to fetch Discord profile.');
    return (await res.json()) as DiscordUser;
  }

  /** Fetches the guilds the user is a member of. */
  async fetchGuilds(accessToken: string): Promise<DiscordPartialGuild[]> {
    const res = await fetch(`${DISCORD_API}/users/@me/guilds`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new UnauthorizedException('Failed to fetch Discord guilds.');
    return (await res.json()) as DiscordPartialGuild[];
  }

  /** True when the user can manage the guild (owner, admin or Manage Server). */
  canManageGuild(guild: DiscordPartialGuild): boolean {
    if (guild.owner) return true;
    const perms = BigInt(guild.permissions);
    return (perms & ADMINISTRATOR) === ADMINISTRATOR || (perms & MANAGE_GUILD) === MANAGE_GUILD;
  }
}
