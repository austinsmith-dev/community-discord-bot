const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { Events } = require('discord.js');

const welcomeChannelId = process.env.WELCOME_CHANNEL_ID;
const inviteLink = process.env.INVITE_LINK;
const unverifiedRoleId = process.env.UNVERIFIED_ROLE_ID;

module.exports = {
    name: 'guildMemberAdd',
    once: false,
    async execute(member) {
        const { guild } = member;

        if (member.partial) await member.fetch();
        if (guild) {

            if (unverifiedRoleId) {
                try {
                    const unverifiedRole = guild.roles.cache.get(unverifiedRoleId);
                    if (unverifiedRole) {
                        await member.roles.add(unverifiedRole);
                        console.log(`Successfully assigned unverified role to ${member.user.tag}`);
                    } else {
                        console.error(`Unverified role with ID ${unverifiedRoleId} not found in guild ${guild.name}.`);
                    }
                } catch (error) {
                    console.error(`Error assigning unverified role to ${member.user.tag}. Check bot permissions and role hierarchy:`, error);
                }
            } else {
                console.warn('UNVERIFIED_ROLE_ID is not set in environment variables. Skipping unverified role assignment.');
            }


            const welcomeChannel = guild.channels.cache.get(welcomeChannelId);
            if (welcomeChannel) {
                const guildName = guild.name;
                const memberName = member.displayName;
                const memberCount = guild.memberCount;

                const attachment = new AttachmentBuilder('./assets/bot_icon.jpg');
                const embed = new EmbedBuilder()
                    .setTitle(`Welcome to ${guildName}`)
                    .setDescription(`Welcome, ${memberName} to ${guildName}! We're thrilled to have you on board with us.\n\n${inviteLink}`)
                    .setColor(process.env.SERVER_COLOR)
                    .setThumbnail(member.user.displayAvatarURL())
                    .setTimestamp()
                    .setFooter({ text: `Thank you for joining ${guildName}!\nMembers: ${memberCount}`, iconURL: 'attachment://bot_icon.jpg' });

                try {
                    await welcomeChannel.send({ embeds: [embed], files: [attachment] });
                } catch (error) {
                    console.error('Error sending welcome embed:', error);
                }
            } else {
                console.error('Welcome channel not found.');
            }
        }
    }
};
