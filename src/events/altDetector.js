const { EmbedBuilder, Events, AttachmentBuilder } = require('discord.js');
const { AltDetector } = require("discord-alt-detector");

const BOT_ICON_PATH = './assets/bot_icon.jpg';

// --- Alt Detector Initialization ---

const detector = new AltDetector({
  ageWeight: 1,
  statusWeight: 1,
  activityWeight: 1,
  usernameWordsWeight: 1,
  usernameSymbolsWeight: 1,
  displaynameWordsWeight: 1,
  displaynameCapsWeight: 1,
  displaynameSymbolsWeight: 1,
  flagsWeight: 1,
  boosterWeight: 1,
  pfpWeight: 1,
  bannerWeight: 1,
  customWeight: 1
}, (member, user) => {
  return 1;
});

module.exports = {
    name: Events.GuildMemberAdd,
    once: false,
    /**
     * Executes when a new member joins the guild to check for suspicious accounts.
     * @param {import('discord.js').GuildMember} member 
     * @param {import('discord.js').Client} client 
     */
    async execute(member, client) {
        if (member.user.bot) return;

        try {
            const result = detector.check(member);
            const category = detector.getCategory(result);
            const color = process.env.SERVER_COLOR || 0x3498DB;
            
            let embedColor;
            if (category === "mega-suspicious") {
                embedColor = 0xFF0000; // Red
            } else if (category === "highly-suspicious") {
                embedColor = 0xFFA500; // Orange
            } else {
                embedColor = 0x00FF00; // Green (Low suspicion)
            }

            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setTitle(`🚨 Account Check: ${category.toUpperCase()}`)
                .setDescription(`A new member, **${member.user.tag}**, has joined and been checked for suspicious activity.`)
                .addFields(
                    { name: 'Username', value: member.user.tag, inline: true },
                    { name: 'Suspicion Score', value: `\`${result.total.toFixed(2)}\``, inline: true },
                    { name: 'Account Age', value: `<t:${Math.floor(member.user.createdAt.getTime() / 1000)}:R>`, inline: false },
                    { name: 'Profile Badges', value: `${result.categories.flags}`, inline: false },
                )
                .setThumbnail(member.user.displayAvatarURL())
                .setFooter({ text: 'Alt Detector Scan' })
                .setTimestamp();

            const staffChannel = await client.channels.fetch(process.env.STAFF_CHANNEL_ID).catch(() => null);

            if (staffChannel) {
                const files = staffChannel.type === 0 ? [new AttachmentBuilder(BOT_ICON_PATH)] : [];
                await staffChannel.send({ embeds: [embed], files: files });
            } else {
                console.error("Staff channel not found! Check STAFF_CHANNEL_ID in .env.");
            }
        } catch (error) {
            console.error("Error executing Alt Detector check:", error);
        }
    }
};
