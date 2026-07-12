import { randomBytes } from 'node:crypto';
import { BadRequestException, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AppConfigService } from '../config/app-config.service.js';
import { Public } from './public.decorator.js';
import { CurrentUser } from './current-user.decorator.js';
import { SESSION_COOKIE } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { DiscordOAuthService } from './discord-oauth.service.js';
import type { AuthenticatedUser } from './auth.types.js';

const STATE_COOKIE = 'modyrn_oauth_state';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly config: AppConfigService,
    private readonly auth: AuthService,
    private readonly discord: DiscordOAuthService,
  ) {}

  /** Begins the Discord OAuth2 flow. */
  @Public()
  @Get('discord')
  begin(@Res() res: Response): void {
    const state = randomBytes(16).toString('hex');
    res.cookie(STATE_COOKIE, state, {
      httpOnly: true,
      secure: this.config.isProduction,
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000,
      path: '/',
    });
    res.redirect(this.discord.buildAuthorizeUrl(state));
  }

  /** OAuth2 redirect handler. Verifies state, exchanges code and sets session. */
  @Public()
  @Get('discord/callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const expectedState = (req as Request & { cookies?: Record<string, string> }).cookies?.[
      STATE_COOKIE
    ];
    res.clearCookie(STATE_COOKIE, { path: '/' });

    if (!code || !state || !expectedState || state !== expectedState) {
      throw new BadRequestException('Invalid OAuth state or missing authorization code.');
    }

    const tokens = await this.discord.exchangeCode(code);
    const user = await this.discord.fetchUser(tokens.access_token);

    const { jwt, expiresAt } = await this.auth.login(user, tokens, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });

    res.cookie(SESSION_COOKIE, jwt, {
      httpOnly: true,
      secure: this.config.isProduction,
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });

    res.redirect(`${this.config.publicUrl}/select-server`);
  }

  /** Returns the current user along with the guilds they can manage. */
  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    const accessToken = await this.auth.getAccessToken(user.id);
    const guilds = accessToken
      ? (await this.discord.fetchGuilds(accessToken))
          .filter((g) => this.discord.canManageGuild(g))
          .map((g) => ({ id: g.id, name: g.name, icon: g.icon, owner: g.owner }))
      : [];

    return {
      user: {
        id: user.id,
        username: user.username,
        globalName: user.globalName,
        avatar: user.avatar,
      },
      guilds,
      // Exposed so the dashboard can build a bot invite URL without depending on
      // any guild-scoped call.
      botClientId: this.config.discord.clientId,
    };
  }

  /** Revokes the current session. */
  @Post('logout')
  async logout(@CurrentUser() user: AuthenticatedUser, @Res() res: Response): Promise<void> {
    await this.auth.logout(user.sessionId);
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.status(200).json({ success: true });
  }
}
