import { Global, Module } from '@nestjs/common';
import { DiscordRestService } from './discord-rest.service.js';

/** Provides the bot-token Discord REST client platform-wide. */
@Global()
@Module({
  providers: [DiscordRestService],
  exports: [DiscordRestService],
})
export class DiscordModule {}
