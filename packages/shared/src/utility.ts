/**
 * Utility modules and the embed builder domain.
 */

export const UtilityModule = {
  ReactionRoles: 'reaction_roles',
  ButtonRoles: 'button_roles',
  SelectMenuRoles: 'select_menu_roles',
  AutoRoles: 'auto_roles',
  WelcomeMessages: 'welcome_messages',
  LeaveMessages: 'leave_messages',
  Starboard: 'starboard',
  Suggestions: 'suggestions',
  StickyMessages: 'sticky_messages',
  TempVoiceChannels: 'temp_voice_channels',
  Reminders: 'reminders',
  Polls: 'polls',
  ScheduledMessages: 'scheduled_messages',
  StatChannels: 'stat_channels',
  Announcements: 'announcements',
  EmbedBuilder: 'embed_builder',
} as const;

export type UtilityModule = (typeof UtilityModule)[keyof typeof UtilityModule];

export const UTILITY_MODULES = Object.values(UtilityModule);

/**
 * Embed builder — a first-class feature. These types mirror the subset of the
 * Discord embed object Modyrn manages, plus interactive components.
 */
export interface EmbedAuthor {
  name: string;
  url?: string;
  iconUrl?: string;
}

export interface EmbedFooter {
  text: string;
  iconUrl?: string;
}

export interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface EmbedMedia {
  url: string;
}

export interface ManagedEmbed {
  title?: string;
  description?: string;
  /** Decimal color value (0xRRGGBB). */
  color?: number;
  url?: string;
  author?: EmbedAuthor;
  thumbnail?: EmbedMedia;
  image?: EmbedMedia;
  footer?: EmbedFooter;
  fields?: EmbedField[];
  /** ISO timestamp, or `true` to use send-time. */
  timestamp?: string | boolean;
}

export const ComponentType = {
  Button: 'button',
  SelectMenu: 'select_menu',
} as const;

export type ComponentType = (typeof ComponentType)[keyof typeof ComponentType];

export const ButtonStyle = {
  Primary: 'primary',
  Secondary: 'secondary',
  Success: 'success',
  Danger: 'danger',
  Link: 'link',
} as const;

export type ButtonStyle = (typeof ButtonStyle)[keyof typeof ButtonStyle];

export interface EmbedButton {
  type: typeof ComponentType.Button;
  label: string;
  style: ButtonStyle;
  /** For link buttons. */
  url?: string;
  /** For interactive buttons — maps to an action, e.g. assigning a role. */
  customId?: string;
  emoji?: string;
}

export interface EmbedSelectOption {
  label: string;
  value: string;
  description?: string;
  emoji?: string;
}

export interface EmbedSelectMenu {
  type: typeof ComponentType.SelectMenu;
  customId: string;
  placeholder?: string;
  minValues?: number;
  maxValues?: number;
  options: EmbedSelectOption[];
}

export type EmbedComponent = EmbedButton | EmbedSelectMenu;

/**
 * A complete managed message: optional plain content, one or more embeds, and
 * interactive component rows. Saveable as a reusable template.
 */
export interface ManagedMessage {
  content?: string;
  embeds: ManagedEmbed[];
  components: EmbedComponent[][];
}

/**
 * Supported placeholder variables usable in embed/message templates. The API
 * resolves these against the send context.
 */
export const TEMPLATE_VARIABLES = [
  '{user}',
  '{user.mention}',
  '{user.name}',
  '{user.id}',
  '{server}',
  '{server.name}',
  '{server.member_count}',
  '{channel}',
  '{channel.name}',
  '{date}',
  '{time}',
] as const;

export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number];
