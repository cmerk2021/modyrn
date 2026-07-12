import { Module } from '@nestjs/common';
import { GuildsModule } from '../guilds/guilds.module.js';
import { ModerationModule } from '../moderation/moderation.module.js';
import { EmergencyController } from './emergency.controller.js';
import { EmergencyService } from './emergency.service.js';

@Module({
  imports: [GuildsModule, ModerationModule],
  controllers: [EmergencyController],
  providers: [EmergencyService],
  exports: [EmergencyService],
})
export class EmergencyModule {}
