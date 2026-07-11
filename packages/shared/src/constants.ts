/**
 * Platform-wide constants.
 */

/** API version prefix. */
export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

/** The full set of Discord slash commands Modyrn registers. Deliberately minimal
 * — commands are for immediate actions only; all configuration is dashboard-first. */
export const SLASH_COMMANDS = [
  'warn',
  'timeout',
  'kick',
  'ban',
  'unban',
  'purge',
  'quarantine',
  'note',
  'case',
] as const;

export type SlashCommand = (typeof SLASH_COMMANDS)[number];

/** Discord's hard limits we validate against. */
export const DISCORD_LIMITS = {
  EMBED_TITLE: 256,
  EMBED_DESCRIPTION: 4096,
  EMBED_FIELDS: 25,
  EMBED_FIELD_NAME: 256,
  EMBED_FIELD_VALUE: 1024,
  EMBED_FOOTER: 2048,
  EMBED_AUTHOR_NAME: 256,
  EMBEDS_PER_MESSAGE: 10,
  MESSAGE_CONTENT: 2000,
  MAX_TIMEOUT_DAYS: 28,
  COMPONENTS_PER_ROW: 5,
  ROWS_PER_MESSAGE: 5,
} as const;

/** Default pagination settings for list endpoints. */
export const PAGINATION = {
  DEFAULT_LIMIT: 25,
  MAX_LIMIT: 100,
} as const;

/** Realtime WebSocket event names emitted by the API. */
export const RealtimeEvent = {
  CaseCreated: 'case.created',
  CaseUpdated: 'case.updated',
  AutomodTriggered: 'automod.triggered',
  MemberJoined: 'member.joined',
  MemberLeft: 'member.left',
  MetricsUpdated: 'metrics.updated',
  EmergencyStateChanged: 'emergency.state_changed',
} as const;

export type RealtimeEvent = (typeof RealtimeEvent)[keyof typeof RealtimeEvent];
