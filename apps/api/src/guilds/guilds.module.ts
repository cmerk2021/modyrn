import { Module } from '@nestjs/common';
import { GuildsController } from './guilds.controller.js';
import { GuildsService } from './guilds.service.js';
import { OverviewService } from './overview.service.js';

@Module({
  controllers: [GuildsController],
  providers: [GuildsService, OverviewService],
  exports: [GuildsService],
})
export class GuildsModule {}
