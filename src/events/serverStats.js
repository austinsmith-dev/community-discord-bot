const { Guild } = require('discord.js');

module.exports = {
    name: 'serverStats',
    once: true,
    execute(guild, client) {
        if (!guild || !guild.channels || !guild.channels.cache) {
            console.error("Guild or guild channels not found.");
            return;
        }

        const memberCountChannel = guild.channels.cache.get(process.env.MEMBERS_CHANNEL_ID);
        const botsChannel = guild.channels.cache.get(process.env.BOTS_CHANNEL_ID);
        const boostChannel = guild.channels.cache.get(process.env.BOOSTS_CHANNEL_ID);

        if (!memberCountChannel || !botsChannel || !boostChannel) {
            console.error("One or more channels not found.");
            return;
        }

        setInterval(() => {
            const boostCount = guild.premiumSubscriptionCount;
            const members = guild.memberCount;

            const bots = guild.members.cache.reduce(
                (acc, member) => (member.user.bot ? acc + 1 : acc),
                0
            );

            memberCountChannel.setName(`👥 Member: ${members}`);
            botsChannel.setName(`🤖 Bots: ${bots}`);
            boostChannel.setName(`💎 Boosts: ${boostCount}`);
        }, 5000);
    },
};
