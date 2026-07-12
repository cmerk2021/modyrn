import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UpdatesService } from './updates.service.js';

@ApiTags('Updates')
@Controller('updates')
export class UpdatesController {
  constructor(private readonly updates: UpdatesService) {}

  @Get()
  status() {
    return this.updates.getStatus();
  }
}
