/**
 * Dashboard permission model.
 *
 * Modyrn's dashboard permissions are deliberately **separate** from Discord
 * permissions. A user's ability to act inside the platform is governed by these
 * granular capabilities, assigned via dashboard roles.
 */
export const DashboardPermission = {
  ViewDashboard: 'view_dashboard',

  ViewMembers: 'view_members',
  ManageMembers: 'manage_members',

  ViewCases: 'view_cases',
  ManageModeration: 'manage_moderation',

  ManageAutomod: 'manage_automod',
  ManageLogs: 'manage_logs',
  ManageUtilities: 'manage_utilities',

  ViewAnalytics: 'view_analytics',
  ManageEmergency: 'manage_emergency',

  ManagePermissions: 'manage_permissions',
  ManageSettings: 'manage_settings',

  ManageBackups: 'manage_backups',
  ManageUpdates: 'manage_updates',
} as const;

export type DashboardPermission =
  (typeof DashboardPermission)[keyof typeof DashboardPermission];

export const DASHBOARD_PERMISSIONS = Object.values(DashboardPermission);

/**
 * A special wildcard granting every permission. Owners implicitly hold this.
 */
export const ADMINISTRATOR_PERMISSION = '*' as const;

export interface PermissionMetadata {
  label: string;
  description: string;
  /** Grouping used to organize the permissions UI. */
  category: 'general' | 'members' | 'moderation' | 'configuration' | 'operations';
}

export const PERMISSION_METADATA: Record<DashboardPermission, PermissionMetadata> = {
  [DashboardPermission.ViewDashboard]: {
    label: 'View dashboard',
    description: 'Access the dashboard and see overview information.',
    category: 'general',
  },
  [DashboardPermission.ViewMembers]: {
    label: 'View members',
    description: 'Browse and search the member explorer.',
    category: 'members',
  },
  [DashboardPermission.ManageMembers]: {
    label: 'Manage members',
    description: 'Edit roles, notes and perform member actions.',
    category: 'members',
  },
  [DashboardPermission.ViewCases]: {
    label: 'View cases',
    description: 'View moderation cases and history.',
    category: 'moderation',
  },
  [DashboardPermission.ManageModeration]: {
    label: 'Manage moderation',
    description: 'Warn, timeout, kick, ban, quarantine and resolve cases.',
    category: 'moderation',
  },
  [DashboardPermission.ManageAutomod]: {
    label: 'Manage automod',
    description: 'Create and edit automod rules and presets.',
    category: 'configuration',
  },
  [DashboardPermission.ManageLogs]: {
    label: 'Manage logging',
    description: 'Configure which events are logged and where.',
    category: 'configuration',
  },
  [DashboardPermission.ManageUtilities]: {
    label: 'Manage utilities',
    description: 'Configure reaction roles, welcome messages, embeds and more.',
    category: 'configuration',
  },
  [DashboardPermission.ViewAnalytics]: {
    label: 'View analytics',
    description: 'View growth, moderation and activity analytics.',
    category: 'operations',
  },
  [DashboardPermission.ManageEmergency]: {
    label: 'Manage emergency center',
    description: 'Trigger raid mode, lockdowns and mass moderation.',
    category: 'operations',
  },
  [DashboardPermission.ManagePermissions]: {
    label: 'Manage permissions',
    description: 'Assign dashboard roles and permissions to team members.',
    category: 'configuration',
  },
  [DashboardPermission.ManageSettings]: {
    label: 'Manage settings',
    description: 'Change guild-wide platform settings.',
    category: 'configuration',
  },
  [DashboardPermission.ManageBackups]: {
    label: 'Manage backups',
    description: 'Create, schedule and restore backups.',
    category: 'operations',
  },
  [DashboardPermission.ManageUpdates]: {
    label: 'Manage updates',
    description: 'View and apply platform updates.',
    category: 'operations',
  },
};

/**
 * Determines whether a set of granted permissions satisfies a required one.
 * The wildcard permission satisfies every check.
 */
export function hasPermission(
  granted: readonly (DashboardPermission | typeof ADMINISTRATOR_PERMISSION)[],
  required: DashboardPermission,
): boolean {
  return granted.includes(ADMINISTRATOR_PERMISSION) || granted.includes(required);
}
