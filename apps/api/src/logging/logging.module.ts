import { Module } from '@nestjs/common';
import { GuildsModule } from '../guilds/guilds.module.js';
import { LoggingController } from './logging.controller.js';
import { LoggingService } from './logging.service.js';

@Module({
  imports: [GuildsModule],
  controllers: [LoggingController],
  providers: [LoggingService],
  exports: [LoggingService],
})
export class LoggingModule {}
