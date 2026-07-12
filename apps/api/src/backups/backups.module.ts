import { Module } from '@nestjs/common';
import { GuildsModule } from '../guilds/guilds.module.js';
import { BackupsController } from './backups.controller.js';
import { BackupsService } from './backups.service.js';

@Module({
  imports: [GuildsModule],
  controllers: [BackupsController],
  providers: [BackupsService],
  exports: [BackupsService],
})
export class BackupsModule {}
