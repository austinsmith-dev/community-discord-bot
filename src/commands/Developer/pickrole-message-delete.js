const { PermissionFlagsBits, EmbedBuilder, SlashCommandBuilder, MessageFlags } = require(`discord.js`);
const roleSchema = require("../../Schemas/roleSchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reaction-role-delete")
    .setDescription("Delete messages by ID.")
    .setDMPermission(false)
    .addStringOption(option =>
      option.setName("messageid")
        .setDescription("ID of the message.")
        .setRequired(true)),
  async execute(interaction, client) {
    const {options} = interaction;

    // Permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: "\`❌\` You do not have (**\`Administrator\`**) permissions to use this commands!",
        flags: [MessageFlags.Ephemeral]
      });
    }

    const messageid = options.getString("messageid");

    const data = await roleSchema.findOne({ MessageID: messageid });

    if (!data) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription(`\`⚠️\` There are no messages corresponding to the provided ID!`)
        ],
        flags: [MessageFlags.Ephemeral]
      });
    }

    const channel = await client.channels.fetch(data.ChannelID);
    const message = await channel.messages.fetch(messageid);
    message.delete();

    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setDescription(`\`✅\` Corresponding message has been deleted!\n* Use (</reaction-role-create:0>) to recreate it.`)
      ], flags: [MessageFlags.Ephemeral]
    });

    await roleSchema.findOneAndDelete({MessageID: messageid});
  },
};
