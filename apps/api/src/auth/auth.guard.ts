import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator.js';
import type { AuthenticatedUser, SessionJwtPayload } from './auth.types.js';
import { AuthService } from './auth.service.js';

/** Name of the httpOnly cookie carrying the session JWT. */
export const SESSION_COOKIE = 'modyrn_session';

/**
 * Global guard. Validates the session JWT from the `modyrn_session` cookie and
 * confirms the session is still active. Routes annotated with `@Public()` are
 * exempt.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Authentication required.');
    }

    let payload: SessionJwtPayload;
    try {
      payload = await this.jwt.verifyAsync<SessionJwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired session.');
    }

    const active = await this.authService.isSessionActive(payload.sid);
    if (!active) {
      throw new UnauthorizedException('Session has been revoked.');
    }

    request.user = {
      id: payload.sub,
      username: payload.username,
      globalName: payload.globalName,
      avatar: payload.avatar,
      sessionId: payload.sid,
    };
    return true;
  }

  private extractToken(request: Request): string | undefined {
    const cookies = (request as Request & { cookies?: Record<string, string> }).cookies;
    if (cookies?.[SESSION_COOKIE]) return cookies[SESSION_COOKIE];

    const auth = request.headers.authorization;
    if (auth?.startsWith('Bearer ')) return auth.slice(7);
    return undefined;
  }
}
