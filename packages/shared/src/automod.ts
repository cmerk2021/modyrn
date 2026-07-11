/**
 * Automod domain — the heart of Modyrn's automation.
 *
 * This module defines the vocabulary for the **visual rule builder**: triggers,
 * conditions (with AND / OR / NOT nesting) and actions. It is intentionally
 * declarative and serializable so rules can be authored in the dashboard,
 * evaluated by the API engine, simulated, and versioned.
 */

/** High-level detection categories used by presets and simple mode. */
export const AutomodTrigger = {
  Spam: 'spam',
  MassMentions: 'mass_mentions',
  RepeatedMessages: 'repeated_messages',
  EmojiSpam: 'emoji_spam',
  CapsSpam: 'caps_spam',
  InviteLinks: 'invite_links',
  CustomLinks: 'custom_links',
  Attachments: 'attachments',
  Media: 'media',
  Regex: 'regex',
  WordFilter: 'word_filter',
  NicknameFilter: 'nickname_filter',
  UsernameFilter: 'username_filter',
  JoinScreening: 'join_screening',
  RaidDetection: 'raid_detection',
} as const;

export type AutomodTrigger = (typeof AutomodTrigger)[keyof typeof AutomodTrigger];

export const AUTOMOD_TRIGGERS = Object.values(AutomodTrigger);

/**
 * The event that causes a rule to be evaluated. A rule listens to exactly one
 * event type; conditions then refine when it actually matches.
 */
export const AutomodEventType = {
  MessageCreate: 'message_create',
  MessageUpdate: 'message_update',
  MemberJoin: 'member_join',
  MemberUpdate: 'member_update',
  NicknameChange: 'nickname_change',
  UsernameChange: 'username_change',
} as const;

export type AutomodEventType = (typeof AutomodEventType)[keyof typeof AutomodEventType];

/** Fields a condition can inspect on the evaluation context. */
export const AutomodConditionField = {
  MessageContent: 'message.content',
  MessageMentionCount: 'message.mention_count',
  MessageAttachmentCount: 'message.attachment_count',
  MessageLinkCount: 'message.link_count',
  MessageCapsRatio: 'message.caps_ratio',
  MessageEmojiCount: 'message.emoji_count',
  MessageContainsInvite: 'message.contains_invite',
  ChannelId: 'channel.id',
  AuthorAccountAgeDays: 'author.account_age_days',
  AuthorJoinAgeDays: 'author.join_age_days',
  AuthorRoleIds: 'author.role_ids',
  AuthorIsBot: 'author.is_bot',
  AuthorHasAvatar: 'author.has_avatar',
  MemberUsername: 'member.username',
  MemberNickname: 'member.nickname',
} as const;

export type AutomodConditionField =
  (typeof AutomodConditionField)[keyof typeof AutomodConditionField];

/** Comparison operators available to conditions. */
export const AutomodOperator = {
  Equals: 'equals',
  NotEquals: 'not_equals',
  GreaterThan: 'gt',
  GreaterThanOrEqual: 'gte',
  LessThan: 'lt',
  LessThanOrEqual: 'lte',
  Contains: 'contains',
  NotContains: 'not_contains',
  StartsWith: 'starts_with',
  EndsWith: 'ends_with',
  MatchesRegex: 'matches_regex',
  In: 'in',
  NotIn: 'not_in',
  IsTrue: 'is_true',
  IsFalse: 'is_false',
} as const;

export type AutomodOperator = (typeof AutomodOperator)[keyof typeof AutomodOperator];

/** Logical combinators for grouping conditions. */
export const AutomodLogic = {
  And: 'and',
  Or: 'or',
  Not: 'not',
} as const;

export type AutomodLogic = (typeof AutomodLogic)[keyof typeof AutomodLogic];

/** A single leaf condition, e.g. `author.account_age_days < 7`. */
export interface AutomodConditionLeaf {
  kind: 'condition';
  field: AutomodConditionField;
  operator: AutomodOperator;
  value?: string | number | boolean | string[];
  /** Optional case-insensitivity flag for string comparisons. */
  caseInsensitive?: boolean;
}

/** A group of conditions combined with a logical operator (supports nesting). */
export interface AutomodConditionGroup {
  kind: 'group';
  logic: AutomodLogic;
  children: AutomodConditionNode[];
}

export type AutomodConditionNode = AutomodConditionLeaf | AutomodConditionGroup;

/** Actions a rule can perform when it matches. */
export const AutomodActionType = {
  DeleteMessage: 'delete_message',
  Warn: 'warn',
  Timeout: 'timeout',
  Kick: 'kick',
  Ban: 'ban',
  Quarantine: 'quarantine',
  AddRole: 'add_role',
  RemoveRole: 'remove_role',
  Log: 'log',
  NotifyModerators: 'notify_moderators',
  SendMessage: 'send_message',
  DmUser: 'dm_user',
} as const;

export type AutomodActionType = (typeof AutomodActionType)[keyof typeof AutomodActionType];

export interface AutomodAction {
  type: AutomodActionType;
  /** Action-specific parameters (duration, roleId, message template, …). */
  params?: Record<string, unknown>;
}

/**
 * A complete automod rule.
 *
 * Rules evaluate as: `IF <event> occurs AND <conditions match> THEN <actions>`.
 */
export interface AutomodRule {
  id: string;
  guildId: string;
  name: string;
  description?: string;
  enabled: boolean;
  /** Higher priority rules evaluate first; used for short-circuit/stop behavior. */
  priority: number;
  event: AutomodEventType;
  /** Root condition group. An empty AND group always matches. */
  conditions: AutomodConditionGroup;
  actions: AutomodAction[];
  /** When true, matching stops further rule evaluation for this event. */
  stopProcessing: boolean;
  /** Roles / channels exempt from this rule. */
  exemptRoleIds: string[];
  exemptChannelIds: string[];
  createdAt: string;
  updatedAt: string;
}

/** Result of evaluating a rule against a context — used by the simulator. */
export interface AutomodSimulationResult {
  ruleId: string;
  matched: boolean;
  /** Human-readable trace of which conditions passed/failed. */
  trace: Array<{ label: string; passed: boolean }>;
  actionsToRun: AutomodAction[];
}

/** An empty root group that matches everything — the default for a new rule. */
export function emptyConditionGroup(): AutomodConditionGroup {
  return { kind: 'group', logic: AutomodLogic.And, children: [] };
}
