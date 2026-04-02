const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('emoji-info')
        .setDescription('Get information about all emojis in the server.')
        .setDMPermission(false),
    async execute(interaction) {
        const emojiList = interaction.guild.emojis.cache.map(emoji => `**EmojiIcon:** ${emoji}, **Name: ${emoji.name}**, **ID: ${emoji.id}**`).join('\n');
        
        if (emojiList) {
            await interaction.reply(emojiList);
        } else {
            await interaction.reply('No custom emojis found in this server.');
        }
    },
};
