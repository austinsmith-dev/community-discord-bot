const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');
const moduses = require('../Schemas/modmailuses');
const modschema = require('../Schemas/modmail');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        
        if (!message.guild && !message.author.bot) {
            const usesdata = await moduses.findOne({ User: message.author.id });

            if (usesdata) {
                const sendchannel = client.channels.cache.get(usesdata.Channel);
                if (!sendchannel) {
                    await message.reply('**Oops!** Your **modmail** seems **corrupted**, it has been **closed** for you.');
                    return await moduses.deleteOne({ User: usesdata.User });
                }

                const msgembed = new EmbedBuilder()
                    .setColor(process.env.SERVER_COLOR)
                    .setAuthor({ name: `${message.author.username}`, iconURL: `${message.author.displayAvatarURL()}`})
                    .setFooter({ text: `📞 Modmail Message - ${message.author.id}`})
                    .setTimestamp()
                    .setDescription(message.content || `**No message provided.**`);
                
                if (message.attachments.size > 0) {
                    msgembed.setImage(message.attachments.first()?.url);
                }

                try {
                    await sendchannel.send({ embeds: [msgembed] });
                    message.react('📧');
                } catch (err) {
                    console.error('Failed to send Modmail message to guild channel:', err);
                    message.react('❌');
                }
                return;
            } 
            
            message.react('👋');
            const modselect = new EmbedBuilder()
                .setColor(process.env.SERVER_COLOR)
                .setTitle('> Select a Server for Modmail')
                .setDescription(`Please submit the **Server's ID** you are trying to contact in the modal displayed when pressing the button below!`);
            
            const button = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('selectmodmail_btn')
                    .setLabel('• Select your Server')
                    .setStyle(ButtonStyle.Secondary)
            );
            
            await message.reply({ embeds: [modselect], components: [button] });
            return;
        }

        if (message.guild && !message.author.bot) {
            const modmailConfig = await modschema.findOne({ Guild: message.guild.id });
            if (!modmailConfig) return;

            const sendchanneldata = await moduses.findOne({ Channel: message.channel.id });
            if (!sendchanneldata) return;

            const member = await client.users.fetch(sendchanneldata.User).catch(() => null);
            if (!member) return message.reply(`⚠ User with ID ${sendchanneldata.User} is **not** a valid Discord user.`);

            const msgembed = new EmbedBuilder()
                .setColor(process.env.SERVER_COLOR)
                .setAuthor({ name: `${message.author.username} (Staff)`, iconURL: `${message.author.displayAvatarURL()}`})
                .setFooter({ text: `📞 Modmail Received - ${message.author.id}`})
                .setTimestamp()
                .setDescription(message.content || `**No message provided.**`);

            if (message.attachments.size > 0) {
                 msgembed.setImage(message.attachments.first()?.url);
            }

            try {
                await member.send({ embeds: [msgembed] });
                message.react('📧');
            } catch (err) {
                message.reply(`⚠ I **couldn't** DM **${member.tag}**! They may have DMs disabled.`);
                message.react('❌');
            }
        }
    }
};

module.exports.listeners = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (interaction.isButton() && interaction.customId === 'selectmodmail_btn') {
            const selectmodal = new ModalBuilder()
                .setTitle('• Modmail Selector')
                .setCustomId('selectmodmailmodal');
            const serverIdInput = new TextInputBuilder()
                .setCustomId('serverid')
                .setRequired(true)
                .setLabel(`• Enter the Server ID`)
                .setPlaceholder(`Right-click server icon > Copy ID`)
                .setStyle(TextInputStyle.Short);
            const subjectInput = new TextInputBuilder()
                .setCustomId('subject')
                .setRequired(true)
                .setLabel(`• What's the reason for contacting us?`)
                .setPlaceholder(`Example: "There is a scammer or a compromised account"`)
                .setStyle(TextInputStyle.Paragraph);
            
            selectmodal.addComponents(
                new ActionRowBuilder().addComponents(serverIdInput),
                new ActionRowBuilder().addComponents(subjectInput)
            );
            await interaction.showModal(selectmodal);
        }

        if (interaction.isModalSubmit() && interaction.customId === 'selectmodmailmodal') {
            const data = await moduses.findOne({ User: interaction.user.id });
            if (data) return interaction.reply({ content: `You have **already** opened a **modmail**!`, flags: [MessageFlags.Ephemeral] });

            const serverid = interaction.fields.getTextInputValue('serverid');
            const subject = interaction.fields.getTextInputValue('subject');

            const server = client.guilds.cache.get(serverid);
            if (!server) return interaction.reply({ content: `**Oops!** That **server** does not **exist** or I am **not** in it!`, flags: [MessageFlags.Ephemeral] });

            const executor = server.members.cache.get(interaction.user.id);
            if (!executor) return interaction.reply({ content: `You **must** be a member of **${server.name}** to open a modmail there!`, flags: [MessageFlags.Ephemeral] });

            const modmaildata = await modschema.findOne({ Guild: server.id });
            if (!modmaildata) return interaction.reply({ content: `Specified server has their **modmail** system **disabled**!`, flags: [MessageFlags.Ephemeral] });

            const channel = await server.channels.create({
                name: `modmail-${interaction.user.username}`,
                parent: modmaildata.Category,
                permissionOverwrites: [
                    {
                        id: server.roles.everyone,
                        deny: ['ViewChannel'],
                    },
                ]
            }).catch(err => {
                console.error('Modmail channel creation error:', err);
                return interaction.reply({ content: `I **couldn't** create your **modmail** in **${server.name}**!`, flags: [MessageFlags.Ephemeral] });
            });

            await moduses.create({ Guild: server.id, User: interaction.user.id, Channel: channel.id });

            const embed = new EmbedBuilder()
                .setColor(process.env.SERVER_COLOR)
                .setTitle(`> ${interaction.user.username}'s Modmail`)
                .addFields({ name: `• Subject`, value: `> ${subject}`})
                .setTimestamp()
                .setFooter({ text: `📞 Modmail Opened | ID: ${interaction.user.id}`});

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('deletemodmail').setEmoji('❌').setLabel('Delete').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('closemodmail').setEmoji('🔒').setLabel('Close').setStyle(ButtonStyle.Secondary)
            );

            await interaction.reply({ content: `Your **modmail** has been opened in **${server.name}**!`, flags: [MessageFlags.Ephemeral] });
            await channel.send({ content: `<@&${process.env.STAFF_ROLE_ID}> New Modmail!`, embeds: [embed], components: [buttons] });
        }

        if (interaction.isButton() && ['deletemodmail', 'closemodmail'].includes(interaction.customId)) {
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

            const clchannel = interaction.channel;
            const userdata = await moduses.findOne({ Channel: clchannel.id });

            if (!userdata) return interaction.editReply(`🔒 This **modmail** is already **closed** or was never opened.`);

            const closeembed = new EmbedBuilder()
                .setColor(process.env.SERVER_COLOR)
                .setTitle('> Your Modmail was Closed')
                .addFields({ name: `• Server`, value: `> ${interaction.guild.name}`})
                .setTimestamp();
            
            const executor = await client.users.fetch(userdata.User).catch(() => null);

            if (interaction.customId === 'closemodmail') {
                await moduses.deleteOne({ User: userdata.User });
                if (executor) executor.send({ embeds: [closeembed] }).catch(() => console.warn('Could not DM user close notification.'));
                return interaction.editReply(`🔒 **Closed!** ${executor?.tag || 'User'} can **no longer** reply, but you can still view the logs.`);
            }

            if (interaction.customId === 'deletemodmail') {
                await moduses.deleteOne({ User: userdata.User });
                if (executor) executor.send({ embeds: [closeembed] }).catch(() => console.warn('Could not DM user delete notification.'));
                await interaction.editReply('❌ **Deleting** this **modmail**..');
                setTimeout(() => clchannel.delete().catch(e => console.error('Failed to delete modmail channel:', e)), 1500);
            }
        }
    }
};
