const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, AttachmentBuilder } = require("discord.js");
const Schema = require("../../Schemas/auditlog");

module.exports = {
    data: new SlashCommandBuilder()
    .setName("auditlog-delete")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDescription("Delete the audit log system in your server.")
    .setDMPermission(false),
    async execute(interaction) {
        await interaction.deferReply();

        const { guild } = interaction;
 
        const data = await Schema.findOne({
            Guild: guild.id,
        });
        if (!data) {
            return await interaction.editReply("🚫 You don't have an audit log system set up in this server!");
        }

        await Schema.deleteMany({
            Guild: guild.id,
        });

        const attachment = new AttachmentBuilder('./assets/bot_icon.jpg');
        const embed = new EmbedBuilder()
        .setTitle("✅ Audit Log Deleted")
        .setDescription(`The audit log system has been successfully deleted from **${guild.name}**. To set it up again, use the setup command!`)
        .setColor("Blue")
        .setThumbnail('attachment://bot_icon.jpg')
        .setFooter({ text: "TIW Bot", iconURL: "attachment://bot_icon.jpg" })
        .setTimestamp();
 
        return await interaction.editReply({
            embeds: [embed], files: [attachment],
        });
    }
};
