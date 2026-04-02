const { EmbedBuilder, Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    once: false,
    /**
     * Executes when an interaction (slash command) is created to log its usage.
     * @param {import('discord.js').Interaction} interaction 
     * @param {import('discord.js').Client} client 
     */
    async execute(interaction, client) {
        if (!interaction.isChatInputCommand()) return;
        
        if (!interaction.guild) return;

        const logChannelId = process.env.LOG_CHANNEL_ID;
        if (!logChannelId) {
            console.warn("[Command Logger] LOG_CHANNEL_ID not set in .env. Skipping command logging.");
            return;
        }

        try {
            const channel = await client.channels.fetch(logChannelId).catch(() => null);
            if (!channel) return;

            const server = interaction.guild.name;
            const user = interaction.user.username;
            const userID = interaction.user.id;
            const commandName = interaction.commandName;

            const optionsString = interaction.options.data.length > 0
                ? interaction.options.data.map(opt => 
                    `**${opt.name}**: \`${opt.value}\``
                  ).join('\n')
                : '*(No options provided)*';
            
            const embed = new EmbedBuilder()
                .setColor(process.env.SERVER_COLOR || '#3498DB')
                .setTitle('📢 Slash Command Used')
                .addFields(
                    { name: 'Server Name', value: server, inline: true },
                    { name: 'Channel', value: `<#${interaction.channelId}>`, inline: true },
                    { name: 'User', value: `${user} (\`${userID}\`)`, inline: false },
                    { name: 'Command', value: `\`/${commandName}\``, inline: true },
                    { name: 'Options', value: optionsString, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Command Log', iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

            await channel.send({ embeds: [embed] }).catch(console.error);
        } catch (error) {
            console.error('Error logging command:', error);
        }
    }
};
