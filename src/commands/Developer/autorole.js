const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, EmbedBuilder, AttachmentBuilder, MessageFlags } = require('discord.js');
const roleschema = require('../../Schemas/autoroleschema');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('auto-role')
    .setDMPermission(false)
    .setDescription('Configure an automatic role that is given to your members when joining.')
    .addSubcommand(command => command.setName('set').setDescription('Set your auto-role.').addRoleOption(option => option.setName('role').setDescription('Specified role will be your auto-role.').setRequired(true)))
    .addSubcommand(command => command.setName('remove').setDescription('Removes your auto-role.')),
    async execute(interaction) {
        
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles) && interaction.user.id !== process.env.OWNER_ID) return await interaction.reply({ content: 'You **do not** have the permission to do that!', flags: [MessageFlags.Ephemeral] });
        const sub = interaction.options.getSubcommand();

        switch (sub) {
            case 'set':

            const role = interaction.options.getRole('role');

            const roledata = await roleschema.findOne({ Guild: interaction.guild.id });
            if (roledata) return await interaction.reply({ content: `You **already** have an auto-role set up! (<@&${roledata.Role}>)`, flags: [MessageFlags.Ephemeral] })
            else {

            await roleschema.create({
                Guild: interaction.guild.id,
                Role: role.id
            })

            const attachment = new AttachmentBuilder('./assets/bot_icon.jpg');
            const embed = new EmbedBuilder()
            .setColor("DarkRed")
            .setTitle('> Auto role has been \n> successfully set!')
            .setAuthor({ name: `⚙️ Auto-Role tool`})
            .setFooter({ text: `⚙️ Do /auto-role remove to undo`})
            .setThumbnail('attachment://bot_icon.jpg')
            .addFields({ name: `• Auto Role was set`, value: `> New Auto-Role is ${role}`})

            await interaction.reply({ embeds: [embed], files: [attachment] });
        }

        break;
            case 'remove':

            const removedata = await roleschema.findOne({ Guild: interaction.guild.id });
            if (!removedata) return await interaction.reply({ content: `You **do not** have an auto role set up! **Cannot** remove **nothing**..`, flags: [MessageFlags.Ephemeral] })
            else {

                await roleschema.deleteMany({
                    Guild: interaction.guild.id
                })

                const attachment = new AttachmentBuilder('./assets/bot_icon.jpg');
                const embed = new EmbedBuilder()
                .setColor("DarkRed")
                .setTitle('> Auto role has been \n> successfully disabled!')
                .setAuthor({ name: `⚙️ Auto-Role tool`})
                .setFooter({ text: `⚙️ Do /auto-role set to undo`})
                .setThumbnail('attachment://bot_icon.jpg')
                .addFields({ name: `• Auto Role was disabled`, value: `> Your members will no longer receive \n> your auto role`})

                await interaction.reply({ embeds: [embed], files: [attachment] });
            }
        }
    }
}