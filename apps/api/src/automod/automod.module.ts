import { Module } from '@nestjs/common';
import { GuildsModule } from '../guilds/guilds.module.js';
import { ModerationModule } from '../moderation/moderation.module.js';
import { AutomodController } from './automod.controller.js';
import { AutomodService } from './automod.service.js';
import { AutomodEngineService } from './automod-engine.service.js';

@Module({
  imports: [GuildsModule, ModerationModule],
  controllers: [AutomodController],
  providers: [AutomodService, AutomodEngineService],
  exports: [AutomodService, AutomodEngineService],
})
export class AutomodModule {}
