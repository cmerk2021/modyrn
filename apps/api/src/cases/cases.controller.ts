import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { CaseStatus, CASE_STATUSES, type ModerationActionType } from '@modyrn/shared';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { GuildsService } from '../guilds/guilds.service.js';
import { CasesService } from './cases.service.js';

class UpdateCaseDto {
  @IsOptional() @IsString() @MaxLength(2000) reason?: string;
  @IsOptional() @IsIn(CASE_STATUSES) status?: CaseStatus;
}

@ApiTags('Cases')
@Controller('guilds/:id/cases')
export class CasesController {
  constructor(
    private readonly guilds: GuildsService,
    private readonly cases: CasesService,
  ) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('action') action?: string,
    @Query('status') status?: string,
    @Query('targetUserId') targetUserId?: string,
  ) {
    await this.guilds.assertAccess(user.id, id);
    return this.cases.list(id, {
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      search,
      action: action as ModerationActionType | undefined,
      status: status as CaseStatus | undefined,
      targetUserId,
    });
  }

  @Get('summary')
  async summary(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.guilds.assertAccess(user.id, id);
    return this.cases.summary(id);
  }

  @Get(':caseId')
  async get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('caseId') caseId: string,
  ) {
    await this.guilds.assertAccess(user.id, id);
    return this.cases.get(id, caseId);
  }

  @Patch(':caseId')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('caseId') caseId: string,
    @Body() dto: UpdateCaseDto,
  ) {
    await this.guilds.assertAccess(user.id, id);
    if (dto.reason !== undefined) await this.cases.updateReason(id, caseId, dto.reason);
    if (dto.status !== undefined) return this.cases.setStatus(id, caseId, dto.status);
    return this.cases.get(id, caseId);
  }
}
