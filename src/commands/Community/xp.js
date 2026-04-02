const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const { 
    getUserXP, 
    addUserXP, 
    setUserXP, 
    removeUserXP, 
    getLeaderboard, 
    getLevel,
    getNextLevelXP
} = require('../../utils/xpManager');

const hasAdminPermission = (member) => member.permissions.has(PermissionFlagsBits.Administrator);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('xp')
        .setDescription('Manage XP system and view your stats.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add XP to a user.')
                .addUserOption(option => option.setName('user').setDescription('The user').setRequired(true))
                .addIntegerOption(option => option.setName('xp').setDescription('How much XP to add').setRequired(true).setMinValue(1)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set specific XP for a user.')
                .addUserOption(option => option.setName('user').setDescription('The user').setRequired(true))
                .addIntegerOption(option => option.setName('xp').setDescription('How much XP to set').setRequired(true).setMinValue(0)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('get')
                .setDescription('Get a user’s XP and level.')
                .addUserOption(option => option.setName('user').setDescription('The user (defaults to you)').setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove XP from a user.')
                .addUserOption(option => option.setName('user').setDescription('The user').setRequired(true))
                .addIntegerOption(option => option.setName('xp').setDescription('How much XP to remove').setRequired(true).setMinValue(1)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription('Show the server XP leaderboard.')),
                
    async execute(interaction) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        
        const subcommand = interaction.options.getSubcommand();
        const user = interaction.options.getUser('user') || interaction.user;
        const xpAmount = interaction.options.getInteger('xp');
        const member = interaction.member;
        const color = process.env.SERVER_COLOR || 'Blue';

        if (['add', 'set', 'remove'].includes(subcommand) && !hasAdminPermission(member)) {
            return interaction.editReply({ content: '❌ You need the **Administrator** permission to manage XP directly.', flags: [MessageFlags.Ephemeral] });
        }

        switch (subcommand) {
            case 'add':
                await addUserXP(interaction.guild.id, user.id, xpAmount);
                return interaction.editReply(`✅ **${xpAmount} XP** added to **${user.username}**.`);

            case 'set':
                setUserXP(user.id, xpAmount);
                return interaction.editReply(`✅ **${user.username}**'s XP has been set to **${xpAmount}**.`);

            case 'remove':
                removeUserXP(user.id, xpAmount);
                return interaction.editReply(`✅ **${xpAmount} XP** removed from **${user.username}**.`);

            case 'get':
                const currentXP = await getUserXP(interaction.guild.id, user.id);
                const currentLevel = getLevel(currentXP);
                const nextLevelXP = getNextLevelXP(currentLevel + 1);
                const progress = currentXP - getNextLevelXP(currentLevel);
                const required = nextLevelXP - getNextLevelXP(currentLevel);

                const getEmbed = new EmbedBuilder()
                    .setColor(color)
                    .setTitle(`📊 ${user.username}'s XP Stats`)
                    .setThumbnail(user.displayAvatarURL())
                    .addFields(
                        { name: 'Level', value: `**${currentLevel}**`, inline: true },
                        { name: 'Total XP', value: `**${currentXP}**`, inline: true },
                        { name: 'Progress to Next Level', value: `${progress}/${required} XP`, inline: false }
                    )
                    .setFooter({ text: `Next level at ${nextLevelXP} XP` })
                    .setTimestamp();

                return interaction.editReply({ embeds: [getEmbed], flags: [MessageFlags.Ephemeral] });

            case 'leaderboard':
                const leaderboard = await getLeaderboard(interaction.guild.id);
    
                if (!leaderboard || leaderboard.length === 0) {
                    return interaction.editReply({ 
                        content: '📊 The leaderboard is currently empty. Start chatting to earn XP!' 
                    });
                }
    
                const formattedLeaderboard = leaderboard.map((entry, index) => 
                    `**${index + 1}.** <@${entry.UserID}> - **Lvl ${entry.Level}** (${entry.XP} XP)`
                ).join('\n');
    
                const lbEmbed = new EmbedBuilder()
                    .setColor(color)
                    .setTitle('🏆 XP Leaderboard (Top 10)')
                    .setDescription(formattedLeaderboard)
                    .setTimestamp();
        
                return interaction.editReply({ embeds: [lbEmbed] });
        }
    },
};
