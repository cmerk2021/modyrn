import { Module } from '@nestjs/common';
import { AutomodModule } from '../automod/automod.module.js';
import { LoggingModule } from '../logging/logging.module.js';
import { UtilityModule } from '../utility/utility.module.js';
import { EventsService } from './events.service.js';

@Module({
  imports: [AutomodModule, LoggingModule, UtilityModule],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
