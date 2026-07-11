/**
 * Logging domain.
 *
 * Every event type can be enabled and routed independently. Modyrn treats
 * logging as a first-class, per-event configurable subsystem.
 */

export const LogEventType = {
  MessageEdit: 'message_edit',
  MessageDelete: 'message_delete',
  MessageBulkDelete: 'message_bulk_delete',
  RoleCreate: 'role_create',
  RoleDelete: 'role_delete',
  RoleUpdate: 'role_update',
  MemberRoleChange: 'member_role_change',
  VoiceJoin: 'voice_join',
  VoiceLeave: 'voice_leave',
  VoiceMove: 'voice_move',
  NicknameChange: 'nickname_change',
  ThreadCreate: 'thread_create',
  ThreadDelete: 'thread_delete',
  ForumPost: 'forum_post',
  MemberJoin: 'member_join',
  MemberLeave: 'member_leave',
  MemberBoost: 'member_boost',
  MemberUnboost: 'member_unboost',
  AutomodTriggered: 'automod_triggered',
  AuditLog: 'audit_log',
  WebhookEvent: 'webhook_event',
  ChannelCreate: 'channel_create',
  ChannelDelete: 'channel_delete',
  ChannelUpdate: 'channel_update',
  ModerationAction: 'moderation_action',
} as const;

export type LogEventType = (typeof LogEventType)[keyof typeof LogEventType];

export const LOG_EVENT_TYPES = Object.values(LogEventType);

/** Logical grouping for the logging configuration UI. */
export const LogCategory = {
  Messages: 'messages',
  Members: 'members',
  Roles: 'roles',
  Voice: 'voice',
  Channels: 'channels',
  Threads: 'threads',
  Moderation: 'moderation',
  Server: 'server',
} as const;

export type LogCategory = (typeof LogCategory)[keyof typeof LogCategory];

export const LOG_EVENT_CATEGORY: Record<LogEventType, LogCategory> = {
  [LogEventType.MessageEdit]: LogCategory.Messages,
  [LogEventType.MessageDelete]: LogCategory.Messages,
  [LogEventType.MessageBulkDelete]: LogCategory.Messages,
  [LogEventType.RoleCreate]: LogCategory.Roles,
  [LogEventType.RoleDelete]: LogCategory.Roles,
  [LogEventType.RoleUpdate]: LogCategory.Roles,
  [LogEventType.MemberRoleChange]: LogCategory.Members,
  [LogEventType.VoiceJoin]: LogCategory.Voice,
  [LogEventType.VoiceLeave]: LogCategory.Voice,
  [LogEventType.VoiceMove]: LogCategory.Voice,
  [LogEventType.NicknameChange]: LogCategory.Members,
  [LogEventType.ThreadCreate]: LogCategory.Threads,
  [LogEventType.ThreadDelete]: LogCategory.Threads,
  [LogEventType.ForumPost]: LogCategory.Threads,
  [LogEventType.MemberJoin]: LogCategory.Members,
  [LogEventType.MemberLeave]: LogCategory.Members,
  [LogEventType.MemberBoost]: LogCategory.Members,
  [LogEventType.MemberUnboost]: LogCategory.Members,
  [LogEventType.AutomodTriggered]: LogCategory.Moderation,
  [LogEventType.AuditLog]: LogCategory.Server,
  [LogEventType.WebhookEvent]: LogCategory.Server,
  [LogEventType.ChannelCreate]: LogCategory.Channels,
  [LogEventType.ChannelDelete]: LogCategory.Channels,
  [LogEventType.ChannelUpdate]: LogCategory.Channels,
  [LogEventType.ModerationAction]: LogCategory.Moderation,
};
