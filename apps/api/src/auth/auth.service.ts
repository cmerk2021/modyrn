import { createHash, randomBytes } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Redis } from 'ioredis';
import {
  and,
  dashboardUsers,
  eq,
  gt,
  oauthTokens,
  sessions,
  type Database,
} from '@modyrn/database';
import { InjectDatabase } from '../database/inject-database.decorator.js';
import { CryptoService } from '../common/crypto/crypto.service.js';
import { REDIS } from '../redis/redis.module.js';
import { ulid } from '../common/id.util.js';
import type { SessionJwtPayload } from './auth.types.js';
import {
  DiscordOAuthService,
  type DiscordTokenResponse,
  type DiscordUser,
} from './discord-oauth.service.js';

/** Sessions live for 7 days by default. */
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** A guild the user can manage (subset used across the dashboard). */
export interface ManagedGuildSummary {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
}

export interface LoginResult {
  jwt: string;
  expiresAt: Date;
}

/**
 * Owns authentication state: user upserts, encrypted token storage, session
 * lifecycle and JWT issuance.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectDatabase() private readonly db: Database,
    private readonly jwt: JwtService,
    private readonly crypto: CryptoService,
    private readonly discord: DiscordOAuthService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  /**
   * Completes an OAuth login: persists the user and encrypted tokens, creates a
   * session, and returns a signed JWT for the session cookie.
   */
  async login(
    user: DiscordUser,
    tokens: DiscordTokenResponse,
    context: { userAgent?: string; ip?: string },
  ): Promise<LoginResult> {
    await this.db
      .insert(dashboardUsers)
      .values({
        id: user.id,
        username: user.username,
        globalName: user.global_name,
        avatar: user.avatar,
      })
      .onConflictDoUpdate({
        target: dashboardUsers.id,
        set: {
          username: user.username,
          globalName: user.global_name,
          avatar: user.avatar,
          updatedAt: new Date(),
        },
      });

    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    await this.db
      .insert(oauthTokens)
      .values({
        userId: user.id,
        accessToken: this.crypto.encrypt(tokens.access_token),
        refreshToken: this.crypto.encrypt(tokens.refresh_token),
        scope: tokens.scope,
        expiresAt: tokenExpiresAt,
      })
      .onConflictDoUpdate({
        target: oauthTokens.userId,
        set: {
          accessToken: this.crypto.encrypt(tokens.access_token),
          refreshToken: this.crypto.encrypt(tokens.refresh_token),
          scope: tokens.scope,
          expiresAt: tokenExpiresAt,
          updatedAt: new Date(),
        },
      });

    const sessionId = ulid();
    const rawToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    await this.db.insert(sessions).values({
      id: sessionId,
      userId: user.id,
      tokenHash: this.hashToken(rawToken),
      userAgent: context.userAgent,
      ipAddress: context.ip,
      expiresAt,
    });

    const payload: SessionJwtPayload = {
      sub: user.id,
      username: user.username,
      globalName: user.global_name,
      avatar: user.avatar,
      sid: sessionId,
    };

    const jwt = await this.jwt.signAsync(payload, { expiresIn: '7d' });
    return { jwt, expiresAt };
  }

  /** Returns true when a session exists and has not expired. */
  async isSessionActive(sessionId: string): Promise<boolean> {
    const [session] = await this.db
      .select({ id: sessions.id })
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())))
      .limit(1);
    return Boolean(session);
  }

  /** Revokes a session (logout). */
  async logout(sessionId: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.id, sessionId));
  }

  /** Returns a decrypted Discord access token for a user, if present. */
  async getAccessToken(userId: string): Promise<string | null> {
    const [row] = await this.db
      .select()
      .from(oauthTokens)
      .where(eq(oauthTokens.userId, userId))
      .limit(1);
    if (!row) return null;
    return this.crypto.decrypt(row.accessToken);
  }

  /**
   * Returns the guilds the user can manage, cached in Redis to avoid hammering
   * Discord's rate-limited user endpoints on every navigation. On a Discord
   * failure (e.g. rate limit) it falls back to the last good result so the user
   * is never spuriously treated as unauthenticated or without access.
   */
  async getManageableGuilds(userId: string): Promise<ManagedGuildSummary[]> {
    const freshKey = `modyrn:guilds:${userId}`;
    const lastKey = `modyrn:guilds:${userId}:last`;

    const cached = await this.redis.get(freshKey).catch(() => null);
    if (cached) return JSON.parse(cached) as ManagedGuildSummary[];

    const accessToken = await this.getAccessToken(userId);
    if (!accessToken) return [];

    try {
      const guilds = (await this.discord.fetchGuilds(accessToken))
        .filter((g) => this.discord.canManageGuild(g))
        .map((g) => ({ id: g.id, name: g.name, icon: g.icon, owner: g.owner }));
      const serialized = JSON.stringify(guilds);
      await this.redis.set(freshKey, serialized, 'EX', 60).catch(() => null);
      await this.redis.set(lastKey, serialized, 'EX', 86_400).catch(() => null);
      return guilds;
    } catch (error) {
      this.logger.warn(`fetchGuilds failed for ${userId}, using cached list: ${String(error)}`);
      const last = await this.redis.get(lastKey).catch(() => null);
      return last ? (JSON.parse(last) as ManagedGuildSummary[]) : [];
    }
  }

  /** True when the user can manage the given guild (uses the cached list). */
  async canManageGuild(userId: string, guildId: string): Promise<boolean> {
    const guilds = await this.getManageableGuilds(userId);
    return guilds.some((g) => g.id === guildId);
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
