const { EmbedBuilder, Events } = require('discord.js');

module.exports = {
    name: Events.GuildMemberUpdate,
    once: false,
    /**
     * Executes when a guild member's details change, specifically checking for a new server boost.
     * @param {import('discord.js').GuildMember} oldMember 
     * @param {import('discord.js').GuildMember} newMember 
     * @param {import('discord.js').Client} client 
     */
    async execute(oldMember, newMember, client) {
        if (!oldMember.premiumSince && newMember.premiumSince) {
            const welcomeChannelId = process.env.WELCOME_CHANNEL_ID;
            const color = process.env.SERVER_COLOR || 'Gold';
            
            const channel = client.channels.cache.get(welcomeChannelId);
            if (!channel) {
                console.error(`[Boost Notifier] Welcome channel (ID: ${welcomeChannelId}) not found.`);
                return;
            }

            let avatarURL = newMember.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });

            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle("🚀 Thank You for Boosting!")
                .setDescription(`Thank you **${newMember.user}**, for making **${newMember.guild.name}** even better! Your boost is highly appreciated.`)
                .setThumbnail(newMember.user.displayAvatarURL({ format: "png", dynamic: true }))
                .setImage(`https://api.aggelos-007.xyz/boostcard?avatar=${avatarURL}&username=${newMember.user.username}`)
                .setTimestamp()
                .setFooter({ text: 'Server Booster' });
                
            await channel.send({ 
                content: `Thank you for the boost, ${newMember.user}!`,
                embeds: [embed] 
            }).catch(error => {
                console.error('Error sending boost notification:', error);
            });
        }
    }
};
