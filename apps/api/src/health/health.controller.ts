import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthStatus } from '@modyrn/shared';
import { Public } from '../auth/public.decorator.js';
import { HealthService } from './health.service.js';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  /** Liveness + dependency status. */
  @Public()
  @Get()
  async check() {
    return this.health.report();
  }

  /** Readiness probe — 200 only when core dependencies are up. */
  @Public()
  @Get('ready')
  @HttpCode(HttpStatus.OK)
  async ready() {
    const report = await this.health.report();
    const ready =
      report.dependencies.database.status === HealthStatus.Up &&
      report.dependencies.redis.status === HealthStatus.Up;
    return { ready, status: report.status };
  }
}
