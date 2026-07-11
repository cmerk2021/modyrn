import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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
import { ulid } from '../common/id.util.js';
import type { SessionJwtPayload } from './auth.types.js';
import { type DiscordTokenResponse, type DiscordUser } from './discord-oauth.service.js';

/** Sessions live for 7 days by default. */
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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
  constructor(
    @InjectDatabase() private readonly db: Database,
    private readonly jwt: JwtService,
    private readonly crypto: CryptoService,
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

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
