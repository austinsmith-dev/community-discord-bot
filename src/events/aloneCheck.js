const { Events } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    name: Events.VoiceStateUpdate,
    /**
     * @param {import('discord.js').VoiceState} oldState 
     * @param {import('discord.js').VoiceState} newState 
     * @param {import('discord.js').Client} client 
     */
    async execute(oldState, newState, client) {
        if (!oldState.channelId) return; // Ignore joining
        if (newState.channelId) return; // Ignore switching
        
        const guildId = oldState.guild.id;
        const bot = oldState.guild.members.me;
        const botVoiceChannel = bot.voice.channel;

        if (!botVoiceChannel || botVoiceChannel.id !== oldState.channelId) return;
        
        if (botVoiceChannel.members.size === 1) {
            const connection = getVoiceConnection(guildId);
            if (connection) {
                const player = client.musicPlayers?.get(guildId);
                if (player && player.stop) {
                    player.stop();
                } else {
                    connection.destroy();
                }
            }
        }
    }
};