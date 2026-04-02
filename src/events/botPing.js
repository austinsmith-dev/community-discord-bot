const { Events, EmbedBuilder, ButtonStyle, ButtonBuilder, ActionRowBuilder, AttachmentBuilder } = require("discord.js");

module.exports = {
  name: Events.MessageCreate,

  async execute(message, client, interaction) {
    if (message.author.bot) return;
    if (message.content.includes(`<@${process.env.CLIENT_ID}>`))  {

      const attachment = new AttachmentBuilder('./assets/bot_icon.jpg');
      const pingEmbed = new EmbedBuilder()
      
        .setColor(process.env.SERVER_COLOR)
        .setTitle("🏓 • Who mentioned me??")
        .setDescription(
          `Hey there **${message.author.username}**!, here is some useful information about me.\n\n⁉️ • **How to view all commands?**\nEither use **/help** or do / to view a list of all the commands!\n\n⁉️ • **How to access modmail?**\nSend a direct message to the bot.\nThe bot will automatically send you a message asking you to proceed.\nOnce you receive the message, follow the instructions provided to communicate with the moderators.`
        )
        .addFields({ name: `**💣 • Commands:**`, value: `${client.commands.size}`, inline: true})
        .setTimestamp()
        .setThumbnail('attachment://bot_icon.jpg')
        .setFooter({text: `Requested by **${message.author.username}**.`})

      return message.reply({ embeds: [pingEmbed], files: [attachment] });
    }
  },
};
