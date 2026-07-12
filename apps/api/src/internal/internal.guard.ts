import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AppConfigService } from '../config/app-config.service.js';

/**
 * Guards internal bot -> API endpoints with the shared `BOT_API_SECRET`. If no
 * secret is configured (single-host deployments where the bot and API are on a
 * trusted network), the check is skipped.
 */
@Injectable()
export class InternalGuard implements CanActivate {
  constructor(private readonly config: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.config.get('BOT_API_SECRET');
    if (!secret) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.headers['x-modyrn-bot-secret'];
    if (provided !== secret) {
      throw new UnauthorizedException('Invalid internal secret.');
    }
    return true;
  }
}
