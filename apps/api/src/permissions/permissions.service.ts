import { Injectable, NotFoundException } from '@nestjs/common';
import {
  and,
  dashboardRoleAssignments,
  dashboardRoles,
  dashboardUsers,
  desc,
  eq,
  type DashboardRole,
  type Database,
} from '@modyrn/database';
import { ADMINISTRATOR_PERMISSION, type DashboardPermission } from '@modyrn/shared';
import { InjectDatabase } from '../database/inject-database.decorator.js';
import { ulid } from '../common/id.util.js';

/** Dashboard permission model: roles, assignments and effective-permission resolution. */
@Injectable()
export class PermissionsService {
  constructor(@InjectDatabase() private readonly db: Database) {}

  listRoles(guildId: string): Promise<DashboardRole[]> {
    return this.db
      .select()
      .from(dashboardRoles)
      .where(eq(dashboardRoles.guildId, guildId))
      .orderBy(desc(dashboardRoles.position));
  }

  async createRole(
    guildId: string,
    input: { name: string; color?: string; permissions?: (DashboardPermission | '*')[] },
  ): Promise<DashboardRole> {
    const [created] = await this.db
      .insert(dashboardRoles)
      .values({
        id: ulid(),
        guildId,
        name: input.name,
        color: input.color ?? '#5865F2',
        permissions: input.permissions ?? [],
      })
      .returning();
    return created!;
  }

  async updateRole(
    guildId: string,
    roleId: string,
    input: Partial<{ name: string; color: string; permissions: (DashboardPermission | '*')[] }>,
  ): Promise<DashboardRole> {
    const [updated] = await this.db
      .update(dashboardRoles)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(dashboardRoles.guildId, guildId), eq(dashboardRoles.id, roleId)))
      .returning();
    if (!updated) throw new NotFoundException('Role not found.');
    return updated;
  }

  async deleteRole(guildId: string, roleId: string): Promise<void> {
    await this.db
      .delete(dashboardRoles)
      .where(and(eq(dashboardRoles.guildId, guildId), eq(dashboardRoles.id, roleId)));
  }

  async listAssignments(guildId: string) {
    return this.db
      .select({
        userId: dashboardRoleAssignments.userId,
        roleId: dashboardRoleAssignments.roleId,
        username: dashboardUsers.username,
        avatar: dashboardUsers.avatar,
      })
      .from(dashboardRoleAssignments)
      .leftJoin(dashboardUsers, eq(dashboardUsers.id, dashboardRoleAssignments.userId))
      .where(eq(dashboardRoleAssignments.guildId, guildId));
  }

  async assign(guildId: string, userId: string, roleId: string): Promise<void> {
    await this.db
      .insert(dashboardRoleAssignments)
      .values({ guildId, userId, roleId })
      .onConflictDoNothing();
  }

  async unassign(guildId: string, userId: string, roleId: string): Promise<void> {
    await this.db
      .delete(dashboardRoleAssignments)
      .where(
        and(
          eq(dashboardRoleAssignments.guildId, guildId),
          eq(dashboardRoleAssignments.userId, userId),
          eq(dashboardRoleAssignments.roleId, roleId),
        ),
      );
  }

  /** Resolves a user's effective dashboard permissions (union across roles). */
  async getEffectivePermissions(
    guildId: string,
    userId: string,
  ): Promise<(DashboardPermission | '*')[]> {
    const rows = await this.db
      .select({ permissions: dashboardRoles.permissions })
      .from(dashboardRoleAssignments)
      .innerJoin(dashboardRoles, eq(dashboardRoles.id, dashboardRoleAssignments.roleId))
      .where(
        and(
          eq(dashboardRoleAssignments.guildId, guildId),
          eq(dashboardRoleAssignments.userId, userId),
        ),
      );
    const set = new Set<DashboardPermission | '*'>();
    for (const row of rows) for (const p of row.permissions) set.add(p);
    if (set.has(ADMINISTRATOR_PERMISSION)) return [ADMINISTRATOR_PERMISSION];
    return [...set];
  }
}
