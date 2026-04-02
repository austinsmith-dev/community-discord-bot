const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, MessageFlags } = require("discord.js");
const roleSchema = require("../../Schemas/roleSchema");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reaction-role-add')
        .setDescription('Add a button to an existing reaction role message.')
        .setDMPermission(false)
        .addStringOption(option =>
            option.setName("messageid")
                .setDescription("ID of the reaction role message.")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("button")
                .setDescription("Button label (max 80 chars).")
                .setRequired(true))
        .addRoleOption(option => 
            option.setName('role')
                .setDescription('The role this button will give.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName("emoji")
                .setDescription("Custom emoji (e.g., <:name:id>) or a Unicode emoji.")
                .setRequired(false)),
    
    async execute(interaction, client) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: "\`❌\` You need the (**`Administrator`**) permission to use this command!", flags: [MessageFlags.Ephemeral] });
        }
        
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const messageID = interaction.options.getString("messageid");
        const buttonLabel = interaction.options.getString("button").substring(0, 80);
        const role = interaction.options.getRole("role");
        const emojiInput = interaction.options.getString("emoji");

        const data = await roleSchema.findOne({ Guild: interaction.guild.id, MessageID: messageID });
        if (!data) {
            return interaction.editReply({ content: "\`⚠️\` There are no messages corresponding to the provided ID!" });
        }

        if (interaction.guild.members.me.roles.highest.position <= role.position) {
            return interaction.editReply(`\`⚠️\` The role provided (**${role.name}**) is higher than or equal to the bot's highest role. Please choose a lower role.`);
        }
        
        if (data.Buttons.length >= 25) {
             return interaction.editReply(`\`❌\` This message has reached the maximum of 25 buttons.`);
        }
        
        if (data.Buttons.some(b => b.RoleID === role.id)) {
            return interaction.editReply(`\`⚠️\` A button already exists for the role **${role.name}**.`);
        }

        const newButton = {
            ButtonLabel: buttonLabel,
            RoleID: role.id,
            CustomID: `rr-${role.id}`,
            EmojiID: emojiInput ? emojiInput.match(/<a?:\w+:(\d+)>|(\p{Emoji})/u)?.[1] || emojiInput : undefined, // Extract custom emoji ID or keep unicode
        };
        
        if (newButton.EmojiID && newButton.EmojiID.length > 20) {
            return interaction.editReply(`\`⚠️\` Invalid custom emoji format. Use <:name:id> or a standard Unicode emoji.`);
        }

        data.Buttons.push(newButton);
        await data.save();

        const newComponents = [];
        let currentRow = new ActionRowBuilder();
        
        data.Buttons.forEach((buttonData, index) => {
            const button = new ButtonBuilder()
                .setCustomId(buttonData.CustomID)
                .setLabel(buttonData.ButtonLabel)
                .setStyle(ButtonStyle.Secondary);

            if (buttonData.EmojiID) {
                if (!isNaN(buttonData.EmojiID) && buttonData.EmojiID.length > 1) { 
                    button.setEmoji(buttonData.EmojiID);
                } else {
                    button.setEmoji(buttonData.EmojiID);
                }
            }

            if (currentRow.components.length < 5) {
                currentRow.addComponents(button);
            } else {
                newComponents.push(currentRow);
                currentRow = new ActionRowBuilder().addComponents(button);
            }
        });

        if (currentRow.components.length > 0) {
            newComponents.push(currentRow);
        }

        try {
            const channel = await client.channels.fetch(data.ChannelID);
            const message = await channel.messages.fetch(messageID);
            
            const existingEmbed = message.embeds[0] || new EmbedBuilder().setTitle(data.Title || 'Reaction Roles').setDescription(data.Description || 'Select your roles below.');
            
            await message.edit({ embeds: [existingEmbed], components: newComponents });
        
            await interaction.editReply({ 
                content: `\`✅\` Added button: **${buttonLabel}** (Role: <@&${role.id}>). The message has been updated.`, 
            });
        } catch (error) {
            console.error('Failed to update reaction role message:', error);
            await interaction.editReply({ 
                content: `\`❌\` An error occurred while updating the message. Check if the message/channel still exists.`,
            });
        }
    },
};
