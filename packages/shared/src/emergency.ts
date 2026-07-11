/**
 * Emergency Center domain — one-click, high-impact safety actions.
 */

export const EmergencyAction = {
  FreezeChat: 'freeze_chat',
  RaidMode: 'raid_mode',
  Slowmode: 'slowmode',
  LockChannel: 'lock_channel',
  LockServer: 'lock_server',
  RestrictInvites: 'restrict_invites',
  EmergencyAnnouncement: 'emergency_announcement',
  MassQuarantine: 'mass_quarantine',
  MassBan: 'mass_ban',
  MassKick: 'mass_kick',
} as const;

export type EmergencyAction = (typeof EmergencyAction)[keyof typeof EmergencyAction];

export const EMERGENCY_ACTIONS = Object.values(EmergencyAction);

/**
 * Quarantine — a flagship feature. Quarantine profiles describe *who* to
 * quarantine and *how*.
 */
export const QuarantineTarget = {
  User: 'user',
  Role: 'role',
  RecentlyActive: 'recently_active',
  Everyone: 'everyone',
  InVoice: 'in_voice',
  MatchingFilter: 'matching_filter',
} as const;

export type QuarantineTarget = (typeof QuarantineTarget)[keyof typeof QuarantineTarget];

export interface QuarantineProfile {
  id: string;
  guildId: string;
  name: string;
  description?: string;
  target: QuarantineTarget;
  /** The role applied to quarantined members (removes all others by default). */
  quarantineRoleId: string;
  /** Whether to strip existing roles and restore them on release. */
  stripRoles: boolean;
  /** Optional automatic release after this many minutes. */
  durationMinutes?: number;
  /** For `recently_active`: consider members active within this window. */
  recentWindowMinutes?: number;
  createdAt: string;
  updatedAt: string;
}

/** State of the emergency center for a guild. */
export interface EmergencyState {
  raidModeEnabled: boolean;
  chatFrozen: boolean;
  serverLocked: boolean;
  invitesRestricted: boolean;
  activatedBy?: string;
  activatedAt?: string;
}
