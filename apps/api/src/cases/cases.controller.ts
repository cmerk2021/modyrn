import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CaseSeverity,
  CASE_SEVERITIES,
  CaseStatus,
  CASE_STATUSES,
  type ModerationActionType,
} from '@modyrn/shared';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { GuildsService } from '../guilds/guilds.service.js';
import { CasesService } from './cases.service.js';

class EvidenceDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(25)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  messageLinks?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(25)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  attachmentUrls?: string[];

  @IsOptional() @IsString() @MaxLength(2000) note?: string;
}

class UpdateCaseDto {
  @IsOptional() @IsString() @MaxLength(2000) reason?: string;
  @IsOptional() @IsIn(CASE_STATUSES) status?: CaseStatus;
  @IsOptional() @IsIn(CASE_SEVERITIES) severity?: CaseSeverity;
  @IsOptional() @ValidateNested() @Type(() => EvidenceDto) evidence?: EvidenceDto;
}

class CaseNoteDto {
  @IsString() @MaxLength(2000) content!: string;
}

class CaseLinkDto {
  @IsString() linkedCaseId!: string;
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
    return this.cases.getDetail(id, caseId);
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
    if (dto.severity !== undefined) await this.cases.setSeverity(id, caseId, dto.severity);
    if (dto.evidence !== undefined) await this.cases.setEvidence(id, caseId, dto.evidence);
    if (dto.status !== undefined) await this.cases.setStatus(id, caseId, dto.status);
    return this.cases.getDetail(id, caseId);
  }

  @Post(':caseId/notes')
  async addNote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('caseId') caseId: string,
    @Body() dto: CaseNoteDto,
  ) {
    await this.guilds.assertAccess(user.id, id);
    await this.cases.addNote(id, caseId, user.id, dto.content);
    return this.cases.getDetail(id, caseId);
  }

  @Delete(':caseId/notes/:noteId')
  async deleteNote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('caseId') caseId: string,
    @Param('noteId') noteId: string,
  ) {
    await this.guilds.assertAccess(user.id, id);
    await this.cases.deleteNote(id, caseId, noteId);
    return this.cases.getDetail(id, caseId);
  }

  @Post(':caseId/links')
  async addLink(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('caseId') caseId: string,
    @Body() dto: CaseLinkDto,
  ) {
    await this.guilds.assertAccess(user.id, id);
    await this.cases.addLink(id, caseId, dto.linkedCaseId, user.id);
    return this.cases.getDetail(id, caseId);
  }

  @Delete(':caseId/links/:linkId')
  async removeLink(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('caseId') caseId: string,
    @Param('linkId') linkId: string,
  ) {
    await this.guilds.assertAccess(user.id, id);
    await this.cases.removeLink(id, caseId, linkId);
    return this.cases.getDetail(id, caseId);
  }
}
