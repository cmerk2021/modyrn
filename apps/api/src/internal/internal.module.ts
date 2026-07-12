import { Module } from '@nestjs/common';
import { ModerationModule } from '../moderation/moderation.module.js';
import { CasesModule } from '../cases/cases.module.js';
import { EventsModule } from '../events/events.module.js';
import { InternalController } from './internal.controller.js';
import { InternalService } from './internal.service.js';
import { InternalGuard } from './internal.guard.js';

@Module({
  imports: [ModerationModule, CasesModule, EventsModule],
  controllers: [InternalController],
  providers: [InternalService, InternalGuard],
  exports: [InternalService],
})
export class InternalModule {}
