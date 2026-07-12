import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  DASHBOARD_PERMISSIONS,
  PERMISSION_METADATA,
  type DashboardPermission,
} from '@modyrn/shared';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { GuildsService } from '../guilds/guilds.service.js';
import { PermissionsService } from './permissions.service.js';

class UpsertRoleDto {
  @IsOptional() @IsString() @MaxLength(60) name?: string;
  @IsOptional() @IsString() @MaxLength(7) color?: string;
  @IsOptional() @IsArray() permissions?: (DashboardPermission | '*')[];
}
class AssignDto {
  @IsString() userId!: string;
  @IsString() roleId!: string;
}

@ApiTags('Permissions')
@Controller('guilds/:id/permissions')
export class PermissionsController {
  constructor(
    private readonly guilds: GuildsService,
    private readonly permissions: PermissionsService,
  ) {}

  /** Catalog of available permissions plus the guild's roles and assignments. */
  @Get()
  async overview(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.guilds.assertAccess(user.id, id);
    const [roles, assignments] = await Promise.all([
      this.permissions.listRoles(id),
      this.permissions.listAssignments(id),
    ]);
    return {
      catalog: DASHBOARD_PERMISSIONS.map((key) => ({ key, ...PERMISSION_METADATA[key] })),
      roles,
      assignments,
    };
  }

  @Post('roles')
  async createRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpsertRoleDto,
  ) {
    await this.guilds.assertAccess(user.id, id);
    return this.permissions.createRole(id, { name: dto.name ?? 'New role', ...dto });
  }

  @Patch('roles/:roleId')
  async updateRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @Body() dto: UpsertRoleDto,
  ) {
    await this.guilds.assertAccess(user.id, id);
    return this.permissions.updateRole(id, roleId, dto);
  }

  @Delete('roles/:roleId')
  async deleteRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('roleId') roleId: string,
  ) {
    await this.guilds.assertAccess(user.id, id);
    await this.permissions.deleteRole(id, roleId);
    return { ok: true };
  }

  @Post('assign')
  async assign(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AssignDto,
  ) {
    await this.guilds.assertAccess(user.id, id);
    await this.permissions.assign(id, dto.userId, dto.roleId);
    return { ok: true };
  }

  @Post('unassign')
  async unassign(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AssignDto,
  ) {
    await this.guilds.assertAccess(user.id, id);
    await this.permissions.unassign(id, dto.userId, dto.roleId);
    return { ok: true };
  }
}
