const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require("discord.js");
const { 
    addWarn, 
    editWarn, 
    clearWarns, 
    removeWarn, 
    listWarns, 
    getWarnInfo 
} = require('../../utils/warningManager');
 
module.exports = {
    data: new SlashCommandBuilder()
        .setName("warn")
        .setDescription("Manage the warning system for users.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false)
        .addSubcommand(c => c
            .setName("create")
            .setDescription("Create a warn for a user.")
            .addUserOption(o => o.setName("user").setDescription("The user to warn.").setRequired(true))
            .addStringOption(o => o.setName("reason").setDescription("The reason for the warn.").setRequired(true).setMaxLength(1000))
        )
        .addSubcommand(c => c
            .setName("list")
            .setDescription("Get a list of a user's warnings.")
            .addUserOption(o => o.setName("user").setDescription("The user to check warnings for (defaults to you).").setRequired(false))
        )
        .addSubcommand(c => c
            .setName("info")
            .setDescription("Get detailed information about a specific warn.")
            .addUserOption(o => o.setName("user").setDescription("The user who received the warn.").setRequired(true))
            .addStringOption(o => o.setName("warn-id").setDescription("The specific warn ID.").setRequired(true).setMaxLength(10))
        )
        .addSubcommand(c => c
            .setName("edit")
            .setDescription("Edit the reason of an existing warn.")
            .addUserOption(o => o.setName("user").setDescription("The user who received the warn.").setRequired(true))
            .addStringOption(o => o.setName("warn-id").setDescription("The specific warn ID to edit.").setRequired(true).setMaxLength(10))
            .addStringOption(o => o.setName("reason").setDescription("The new reason for the warn.").setRequired(true).setMaxLength(1000))
        )
        .addSubcommand(c => c
            .setName("remove")
            .setDescription("Remove a specific warning from a user.")
            .addUserOption(o => o.setName("user").setDescription("The user who received the warn.").setRequired(true))
            .addStringOption(o => o.setName("warn-id").setDescription("The specific warn ID to remove.").setRequired(true).setMaxLength(10))
        )
        .addSubcommand(c => c
            .setName("clear")
            .setDescription("Clear ALL warnings of a user.")
            .addUserOption(o => o.setName("user").setDescription("The user whose warnings should be cleared.").setRequired(true))
        ),
 
    async execute (interaction) {
        const { guild, member, options } = interaction;

        const subcommand = options.getSubcommand();
        const targetUser = options.getUser("user");
        const targetMember = targetUser ? await guild.members.fetch(targetUser.id).catch(() => null) : null;
        
        const targetUserId = targetUser?.id || interaction.user.id;

        if (targetUser && (targetUser.bot || targetUser.id === member.id)) {
            return interaction.reply({ content: `You cannot use moderation commands on yourself or a bot.`, flags: [MessageFlags.Ephemeral] });
        }
        if (targetMember && targetMember.roles.highest.position >= member.roles.highest.position) {
             return interaction.reply({ content: `You cannot moderate **${targetUser.tag}** due to role hierarchy.`, flags: [MessageFlags.Ephemeral] });
        }

        try {
            switch (subcommand) {
                case "create":
                    const reasonC = options.getString("reason");
                    await addWarn(interaction, targetUserId, reasonC);
                    break;
                case "list":
                    await listWarns(interaction, targetUserId);
                    break;
                case "info":
                    const warnIdI = options.getString("warn-id");
                    await getWarnInfo(interaction, targetUserId, warnIdI);
                    break;
                case "edit":
                    const warnIdE = options.getString("warn-id");
                    const newReason = options.getString("reason");
                    await editWarn(interaction, targetUserId, warnIdE, newReason);
                    break;
                case "remove":
                    const warnIdR = options.getString("warn-id");
                    await removeWarn(interaction, targetUserId, warnIdR);
                    break;
                case "clear":
                    await clearWarns(interaction, targetUserId);
                    break;
                default:
                    await interaction.reply({ content: "Invalid subcommand! Please check the command options.", flags: [MessageFlags.Ephemeral] });
            }
        } catch (error) {
            console.error(`Error executing warn subcommand ${subcommand}:`, error);
            const errorEmbed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(`An unexpected error occurred while processing the \`/warn ${subcommand}\` command.`);
            await interaction.reply({ embeds: [errorEmbed], flags: [MessageFlags.Ephemeral] }).catch(() => null);
        }
    }
}
