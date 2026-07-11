/**
 * Moderation domain: action types, case status and severity.
 *
 * Every moderation action creates a **case**. Cases are the audit backbone of
 * the platform.
 */

export const ModerationActionType = {
  Note: 'note',
  Warn: 'warn',
  Timeout: 'timeout',
  RemoveTimeout: 'remove_timeout',
  Kick: 'kick',
  Ban: 'ban',
  Unban: 'unban',
  Softban: 'softban',
  Quarantine: 'quarantine',
  Unquarantine: 'unquarantine',
  RoleAdd: 'role_add',
  RoleRemove: 'role_remove',
  Nickname: 'nickname',
  Purge: 'purge',
} as const;

export type ModerationActionType = (typeof ModerationActionType)[keyof typeof ModerationActionType];

export const MODERATION_ACTION_TYPES = Object.values(ModerationActionType);

/** Actions that are inherently time-bound and may auto-expire. */
export const TEMPORARY_ACTION_TYPES: readonly ModerationActionType[] = [
  ModerationActionType.Timeout,
  ModerationActionType.Ban,
  ModerationActionType.Quarantine,
];

export const CaseStatus = {
  Open: 'open',
  Resolved: 'resolved',
  Appealed: 'appealed',
  Expired: 'expired',
  Reverted: 'reverted',
} as const;

export type CaseStatus = (typeof CaseStatus)[keyof typeof CaseStatus];

export const CASE_STATUSES = Object.values(CaseStatus);

export const CaseSeverity = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
  Critical: 'critical',
} as const;

export type CaseSeverity = (typeof CaseSeverity)[keyof typeof CaseSeverity];

/** How the action was initiated. */
export const ActionOrigin = {
  Dashboard: 'dashboard',
  Command: 'command',
  Automod: 'automod',
  Emergency: 'emergency',
  Api: 'api',
  System: 'system',
} as const;

export type ActionOrigin = (typeof ActionOrigin)[keyof typeof ActionOrigin];

export const ACTION_METADATA: Record<
  ModerationActionType,
  { label: string; pastTense: string; severity: CaseSeverity }
> = {
  [ModerationActionType.Note]: { label: 'Note', pastTense: 'noted', severity: CaseSeverity.Low },
  [ModerationActionType.Warn]: { label: 'Warn', pastTense: 'warned', severity: CaseSeverity.Low },
  [ModerationActionType.Timeout]: {
    label: 'Timeout',
    pastTense: 'timed out',
    severity: CaseSeverity.Medium,
  },
  [ModerationActionType.RemoveTimeout]: {
    label: 'Remove timeout',
    pastTense: 'removed timeout from',
    severity: CaseSeverity.Low,
  },
  [ModerationActionType.Kick]: {
    label: 'Kick',
    pastTense: 'kicked',
    severity: CaseSeverity.Medium,
  },
  [ModerationActionType.Ban]: { label: 'Ban', pastTense: 'banned', severity: CaseSeverity.High },
  [ModerationActionType.Unban]: {
    label: 'Unban',
    pastTense: 'unbanned',
    severity: CaseSeverity.Low,
  },
  [ModerationActionType.Softban]: {
    label: 'Softban',
    pastTense: 'softbanned',
    severity: CaseSeverity.High,
  },
  [ModerationActionType.Quarantine]: {
    label: 'Quarantine',
    pastTense: 'quarantined',
    severity: CaseSeverity.High,
  },
  [ModerationActionType.Unquarantine]: {
    label: 'Release quarantine',
    pastTense: 'released from quarantine',
    severity: CaseSeverity.Low,
  },
  [ModerationActionType.RoleAdd]: {
    label: 'Add role',
    pastTense: 'given a role',
    severity: CaseSeverity.Low,
  },
  [ModerationActionType.RoleRemove]: {
    label: 'Remove role',
    pastTense: 'removed a role',
    severity: CaseSeverity.Low,
  },
  [ModerationActionType.Nickname]: {
    label: 'Nickname',
    pastTense: 'renamed',
    severity: CaseSeverity.Low,
  },
  [ModerationActionType.Purge]: {
    label: 'Purge',
    pastTense: 'purged messages',
    severity: CaseSeverity.Medium,
  },
};
