import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from './env.validation.js';

/**
 * Strongly-typed wrapper around Nest's ConfigService. Every value has already
 * been validated by {@link validateEnv}, so accessors are non-nullable.
 */
@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  get<K extends keyof Env>(key: K): Env[K] {
    return this.config.get(key, { infer: true });
  }

  get isProduction(): boolean {
    return this.get('NODE_ENV') === 'production';
  }

  get isDevelopment(): boolean {
    return this.get('NODE_ENV') === 'development';
  }

  get discord() {
    return {
      clientId: this.get('DISCORD_CLIENT_ID'),
      clientSecret: this.get('DISCORD_CLIENT_SECRET'),
      token: this.get('DISCORD_TOKEN'),
      publicKey: this.get('DISCORD_PUBLIC_KEY'),
      // The OAuth callback must be reachable by the user's browser, so it goes
      // through the public dashboard origin (which proxies /api/v1 to the API),
      // NOT the internal API_URL (e.g. http://api:4000).
      redirectUri: `${this.get('PUBLIC_URL')}/api/v1/auth/discord/callback`,
    };
  }

  get publicUrl(): string {
    return this.get('PUBLIC_URL');
  }
}
