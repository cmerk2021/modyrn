import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js';

/**
 * Modyrn's slash commands are intentionally minimal — reserved strictly for
 * immediate moderation actions. All configuration lives in the dashboard.
 */
export const commandDefinitions: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [
  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member.')
    .addUserOption((o) => o.setName('user').setDescription('The member to warn.').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason for the warning.'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .toJSON(),

  new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a member.')
    .addUserOption((o) => o.setName('user').setDescription('The member.').setRequired(true))
    .addStringOption((o) =>
      o.setName('duration').setDescription('e.g. 10m, 1h, 1d (max 28d).').setRequired(true),
    )
    .addStringOption((o) => o.setName('reason').setDescription('Reason.'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .toJSON(),

  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member.')
    .addUserOption((o) => o.setName('user').setDescription('The member.').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason.'))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .toJSON(),

  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member.')
    .addUserOption((o) => o.setName('user').setDescription('The member.').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason.'))
    .addStringOption((o) => o.setName('duration').setDescription('Optional temp-ban duration.'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .toJSON(),

  new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user by ID.')
    .addStringOption((o) => o.setName('user_id').setDescription('The user ID.').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason.'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .toJSON(),

  new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Bulk-delete recent messages in this channel.')
    .addIntegerOption((o) =>
      o
        .setName('count')
        .setDescription('Number of messages (1-100).')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true),
    )
    .addUserOption((o) => o.setName('user').setDescription('Only delete from this member.'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .toJSON(),

  new SlashCommandBuilder()
    .setName('quarantine')
    .setDescription('Quarantine a member using a configured profile.')
    .addUserOption((o) => o.setName('user').setDescription('The member.').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason.'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .toJSON(),

  new SlashCommandBuilder()
    .setName('note')
    .setDescription('Add a private moderator note to a member.')
    .addUserOption((o) => o.setName('user').setDescription('The member.').setRequired(true))
    .addStringOption((o) => o.setName('content').setDescription('Note content.').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .toJSON(),

  new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock this channel so the member role cannot chat.')
    .addStringOption((o) => o.setName('reason').setDescription('Reason for locking.'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .toJSON(),

  new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock this channel, restoring the member role permissions.')
    .addStringOption((o) => o.setName('reason').setDescription('Reason for unlocking.'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .toJSON(),

  new SlashCommandBuilder()
    .setName('case')
    .setDescription('Look up a moderation case by number.')
    .addIntegerOption((o) =>
      o.setName('number').setDescription('The case number.').setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .toJSON(),
];
