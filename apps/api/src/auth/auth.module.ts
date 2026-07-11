import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AppConfigService } from '../config/app-config.service.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AuthGuard } from './auth.guard.js';
import { DiscordOAuthService } from './discord-oauth.service.js';

/**
 * Authentication module. Registers the JWT signer, the Discord OAuth client and
 * a global {@link AuthGuard} so every route is protected unless marked `@Public()`.
 */
@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { issuer: 'modyrn' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, DiscordOAuthService, { provide: APP_GUARD, useClass: AuthGuard }],
  exports: [AuthService, DiscordOAuthService],
})
export class AuthModule {}
