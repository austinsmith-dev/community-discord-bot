const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stop the music and disconnect the bot.')
        .setDMPermission(false),

    async execute(interaction, client) {
        const guildId = interaction.guild.id;
        const player = client.musicPlayers.get(guildId);

        if (player) {
            player.stop();
            client.musicPlayers.delete(guildId);
            return interaction.reply({ content: '🛑 Music stopped and bot disconnected.' });
        } else {
            return interaction.reply({ content: 'The bot is not currently playing any music.', flags: [MessageFlags.Ephemeral] });
        }
    }
};