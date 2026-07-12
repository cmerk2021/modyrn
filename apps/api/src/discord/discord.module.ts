import { Global, Module } from '@nestjs/common';
import { DiscordRestService } from './discord-rest.service.js';
import { NamesService } from './names.service.js';

/** Provides the bot-token Discord REST client platform-wide. */
@Global()
@Module({
  providers: [DiscordRestService, NamesService],
  exports: [DiscordRestService, NamesService],
})
export class DiscordModule {}
