const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, AttachmentBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rules')
        .setDescription('Sends a message with the rules in current channel.')
        .setDMPermission(false),
        
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) && interaction.user.id !== process.env.OWNER_ID) return await interaction.reply({ content: 'You **do not** have the permission to do that!', flags: [MessageFlags.Ephemeral] });
        const attachment = new AttachmentBuilder('./assets/bot_icon.jpg');
        const rulesEmbed = new EmbedBuilder()
            .setColor(process.env.SERVER_COLOR)
            .setTitle('Server Rules')
            .setThumbnail('attachment://bot_icon.jpg')
            .setDescription(`**• Rule 1 - Abide by Discord TOS**
You must abide by ToS in Discord, this includes but is not limited to:
- Sharing gore or disturbing imagery
- Being under the age of 13
- Sexualizing minors
- Discussion of illegal drugs/illegal drinking
You may also reference this link to see the full list: [Discord Guidelines](https://discord.com/guidelines)

**• Rule 2 - No homophobic, transphobic, sexist, or racist slurs/messages**
${interaction.guild.name} is a safe space for all people, and it is self-explanatory no hate speech here is allowed.

**• Rule 3 - Have respect for everyone**
In ${interaction.guild.name}, you should have respect for all members of the server, staff, and all groups of people. Respect gender identities and pronouns. Try your best to make sure everyone is happy!

**• Rule 4 - No toxicity**
This rule is especially important in ${interaction.guild.name}, toxicity can be anything from making rude remarks to others, to starting drama, or to arguing. In order to ensure you are as less toxic as possible, please abide by the other rules mentioned here in this rule list.

**• Rule 5 - No advertising, spamming, or raiding**
Self-explanatory rules. Any form of advertisements is ban-able. Spamming will be caught by our automod, and if you are trying to bypass it you will be punished.

**• Rule 6 - Be civil: No gore, NSFW, or anything related. This server is PG-13**
This means that overly-NSFW jokes are not allowed in this server, any joke that can be classified as PG-13 is allowed, however. No gore or NSFW things should be posted anywhere, and results in a blacklist to the void and having your message deleted and reported.

**• Rule 7 - Utilize common sense**
Finding loopholes in the rules are not allowed, and often will result in more punishment anyway. A user who consistently stands on the server's "gray lines" so-to-speak in terms of rules just for the purpose of being controversial will end up banished in The Void forever.

**• Rule 8 - Use channels properly**
Keep bot commands and music commands in #bot-commands and #music-commands, excessive media/memes in ⁠#media, and so forth. Channel misusage is only a warning, and you will be notified once a staff catches you.
If you consistently do this, you will only receive a mute at worst.

**• Rule 9 - Spreading Server Hate**
Spreading server hate is not allowed, this includes saying things like "You're better off on a different server" or, "${interaction.guild.name} isn't a good server". You cannot say these things in the main chat, or any chats. If you feel like a legitimate issue lies within the server keeping it from being better, make a suggestion directly to the owner. Do not say the latter just to annoy staff members or to ward away new members. However, saying things like "I don't really like ${interaction.guild.name}" or "I don't care for the server" is okay.

**• Rule 10 - No controversial topics**
Discussion of religion should be limited, and debates about it are not allowed, nor is any other debates about things like politics allowed. This is to ensure there is little to no fighting at all within the server. Be cautious of what you discuss and make sure it is not something that can easily start fights.`);

        await interaction.reply({ embeds: [rulesEmbed], files: [attachment] });
    },
};
