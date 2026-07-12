import { Module } from '@nestjs/common';
import { GuildsModule } from '../guilds/guilds.module.js';
import { UtilityController } from './utility.controller.js';
import { UtilityService } from './utility.service.js';

@Module({
  imports: [GuildsModule],
  controllers: [UtilityController],
  providers: [UtilityService],
  exports: [UtilityService],
})
export class UtilityModule {}
