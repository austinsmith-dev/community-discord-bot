const { Events, EmbedBuilder } = require('discord.js');
const roleSchema = require("../Schemas/roleSchema");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isButton()) return;
        
        const { customId, guild, member, message } = interaction;

        if (!customId.startsWith('rr-')) return;
        
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const data = await roleSchema.findOne({
            Guild: guild.id,
            MessageID: message.id
        });

        if (!data) {
            return interaction.editReply(`\`📛\` Error: Role configuration data not found for this message.`);
        }

        const buttonConfig = data.Buttons.find(b => b.CustomID === customId);
        if (!buttonConfig) {
            return interaction.editReply(`\`⚠️\` Error: Button configuration not found. Please contact an admin.`);
        }
        
        const role = guild.roles.cache.get(buttonConfig.RoleID);
        
        if (!role) {
            data.Buttons.pull({ CustomID: customId });
            await data.save();
            return interaction.editReply(`\`⚠️\` Role does not exist anymore. Entry removed.`);
        }
        
        try {
            if (member.roles.cache.has(role.id)) {
                await member.roles.remove(role);
                const embed = new EmbedBuilder()
                    .setColor("Green")
                    .setDescription(`\`✅\` The role **${role.name}** was removed.`);
                interaction.editReply({ embeds: [embed] });
            } else {
                await member.roles.add(role);
                const embed = new EmbedBuilder()
                    .setColor("Green")
                    .setDescription(`\`✅\` You have been given the role **${role.name}**.`);
                interaction.editReply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error handling reaction role click:', error);
            if (error.code === 50013) {
                return interaction.editReply(`\`❌\` Error: I do not have permission to manage the role **${role.name}** (role hierarchy too low).`);
            }
            return interaction.editReply(`\`❌\` An unknown error occurred while trying to manage your role.`);
        }
    }
};
