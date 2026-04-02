const { EmbedBuilder, AttachmentBuilder } = require("discord.js");

module.exports = {
    name: "timeout",

    async execute(member, time, reason, byAutoMod) {
        console.log(`Attempting to send staff notification for user: ${member.user.id}`);
        try {
            const staffChannel = await member.guild.channels.fetch(process.env.STAFF_CHANNEL_ID);
            if (!staffChannel) {
                return;
            }

            const timeinmin = time.length / 1000 / 60;

            let staffEmbed;
            if (byAutoMod) {
                // Notification for timeouts by the automod system
                staffEmbed = new EmbedBuilder()
                    .setTitle("User Timed Out by Auto Mod")
                    .setColor(process.env.SERVER_COLOR)
                    .setTimestamp()
                    .setThumbnail('attachment://bot_icon.jpg')
                    .setDescription(`User: ${member.user}\nUser ID: ${member.id}\nMessage: "${time.message.content}"\nLength of Timeout: ${timeinmin} minutes\nReason: ${reason}`);
            } else {
                // Notification for timeouts by staff members
                staffEmbed = new EmbedBuilder()
                    .setTitle("User Timed Out")
                    .setColor(process.env.SERVER_COLOR)
                    .setTimestamp()
                    .setThumbnail('attachment://bot_icon.jpg')
                    .setDescription(`User: ${member.user}\nUser ID: ${member.id}\nLength of Timeout: ${timeinmin} minutes\nStaff Member: ${time.executor}\nReason: ${reason}`);
            }

            // Send the embed
            const embedMessage = await staffChannel.send({
                embeds: [staffEmbed],
                files: [new AttachmentBuilder('./assets/bot_icon.jpg')],
                allowedMentions: {
                    roles: byAutoMod ? [process.env.STAFF_ROLE_ID] : [] // Only ping staff role for automod timeouts
                }
            });

            // Mention the staff role separately in the message content
            await staffChannel.send(`<@&${process.env.STAFF_ROLE_ID}>`);

        } catch (error) {
            console.error('Failed to send notification to staff channel', error);
        }
    }
};
