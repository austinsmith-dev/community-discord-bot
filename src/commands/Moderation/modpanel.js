const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } = require("discord.js");

const TIMEOUT_DURATIONS = {
    "to-5m": 300000,
    "to-10m": 600000,
    "to-1h": 3600000,
    "to-1d": 86400000,
    "to-1w": 604800000,
};

const sendDmNotification = async (target, title, message, color) => {
    const dmEmbed = new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(message)
        .setTimestamp();
    
    await target.send({ embeds: [dmEmbed] }).catch(() => {
        console.warn(`Could not send DM to user ${target.id}`);
    });
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName("modpanel")
        .setDescription("Moderate a user with a panel interface.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false)
        .addUserOption(option => option
            .setName("target")
            .setDescription("The target of the moderation action.")
            .setRequired(true)
        )
        .addStringOption(option => option
            .setName("reason")
            .setDescription("The reason for your action.")
            .setRequired(false)
            .setMaxLength(512)
        ),

    async execute (interaction) {
        const { guild, options, user: moderator } = interaction;
        const targetUser = options.getMember("target");
        const reason = options.getString("reason") || "No reason given";
        const color = process.env.SERVER_COLOR || "Blue";

        if (!targetUser) {
            return interaction.reply({ content: "That user is no longer in the server.", flags: [MessageFlags.Ephemeral] });
        }
        if (targetUser.id === moderator.id) {
            return interaction.reply({ content: "You can't moderate yourself!", flags: [MessageFlags.Ephemeral] });
        }
        if (targetUser.roles.highest.position >= interaction.member.roles.highest.position) {
             return interaction.reply({ content: `You cannot moderate **${targetUser.user.tag}** because their role is higher or equal to yours.`, flags: [MessageFlags.Ephemeral] });
        }
        if (targetUser.id === guild.ownerId) {
             return interaction.reply({ content: `You cannot moderate the server owner.`, flags: [MessageFlags.Ephemeral] });
        }

        // --- Buttons & Components ---

        const modRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("mod-ban")
                .setLabel("Ban")
                .setEmoji("🔨")
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId("mod-kick")
                .setLabel("Kick")
                .setEmoji("🔨")
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId("mod-untimeout")
                .setEmoji("✅")
                .setLabel("Untimeout")
                .setStyle(ButtonStyle.Success),
        );
        
        const tRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("to-5m").setLabel("TO 5 Minutes").setEmoji("⛔").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("to-10m").setLabel("TO 10 Minutes").setEmoji("⛔").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("to-1h").setLabel("TO 1 Hour").setEmoji("⛔").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("to-1d").setLabel("TO 1 Day").setEmoji("⛔").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("to-1w").setLabel("TO 1 Week").setEmoji("⛔").setStyle(ButtonStyle.Secondary),
        );

        const embed = new EmbedBuilder()
            .setTitle("Moderation Panel")
            .setColor(color)
            .setDescription(`Control panel for moderating **${targetUser.user.tag}**.`)
            .addFields(
                { name: "Target User", value: `<@${targetUser.id}>`, inline: true },
                { name: "Target ID", value: `${targetUser.id}`, inline: true },
                { name: "Reason", value: `${reason}`, inline: false }
            )
            .setThumbnail(targetUser.user.displayAvatarURL())
            .setTimestamp()
            .setFooter({ text: `Moderator: ${moderator.tag}` });

        const reply = await interaction.reply({
            embeds: [embed],
            components: [modRow, tRow],
            flags: [MessageFlags.Ephemeral],
            fetchReply: true
        });

        // --- Button Collector Logic ---

        const filter = i => i.user.id === moderator.id;
        const collector = reply.createMessageComponentCollector({ filter, time: 300000 });

        collector.on('collect', async i => {
            await i.deferUpdate();

            const customId = i.customId;
            let responseMessage = "";
            let actionTaken = false;
            
            const hasPermissions = (perms) => i.member.permissions.has(perms);

            if (customId.startsWith('to-')) {
                if (!hasPermissions(PermissionFlagsBits.ModerateMembers)) {
                    responseMessage = "❌ You don't have the permission to **TIMEOUT** members!";
                } else {
                    const durationMs = TIMEOUT_DURATIONS[customId];
                    const durationText = customId.split('-').slice(1).join(' ').toUpperCase();
                    
                    await targetUser.timeout(durationMs, reason).catch(e => {
                         console.error(`Error timing out user ${targetUser.id}:`, e);
                         responseMessage = `❌ There was an error applying the timeout to ${targetUser.user.tag}.`;
                    });

                    if (!responseMessage) {
                        await sendDmNotification(
                            targetUser, 
                            "Timeout Applied", 
                            `You have been put in timeout in **${guild.name}** for **${durationText}**.\n\n**Reason:** ${reason}`,
                            color
                        );
                        responseMessage = `✅ **${targetUser.user.tag}** has been put in timeout for **${durationText}**.`;
                        actionTaken = true;
                    }
                }
            } 
            else if (customId === 'mod-untimeout') {
                if (!hasPermissions(PermissionFlagsBits.ModerateMembers)) {
                    responseMessage = "❌ You don't have the permission to **UN-TIMEOUT** members!";
                } else {
                    await targetUser.timeout(null, reason).catch(e => {
                        console.error(`Error un-timing out user ${targetUser.id}:`, e);
                        responseMessage = `❌ There was an error removing the timeout from ${targetUser.user.tag}.`;
                    });

                    if (!responseMessage) {
                        await sendDmNotification(
                            targetUser, 
                            "Timeout Removed", 
                            `Your timeout in **${guild.name}** has been removed.\n\n**Reason:** ${reason}`,
                            color
                        );
                        responseMessage = `✅ **${targetUser.user.tag}**'s timeout has been removed.`;
                        actionTaken = true;
                    }
                }
            } else if (customId === 'mod-ban') {
                if (!hasPermissions(PermissionFlagsBits.BanMembers)) {
                    responseMessage = "❌ You don't have the permission to **BAN** members!";
                } else {
                    await guild.members.ban(targetUser, { reason }).catch(e => {
                        console.error(`Error banning user ${targetUser.id}:`, e);
                        responseMessage = `❌ There was an error banning ${targetUser.user.tag}.`;
                    });

                    if (!responseMessage) {
                         await sendDmNotification(
                            targetUser, 
                            "You Have Been Banned", 
                            `You have been banned from **${guild.name}**.\n\n**Reason:** ${reason}`,
                            DELETE_COLOR
                        );
                        responseMessage = `✅ **${targetUser.user.tag}** has been **BANNED**!`;
                        actionTaken = true;
                        collector.stop('action_taken');
                    }
                }
            } else if (customId === 'mod-kick') {
                if (!hasPermissions(PermissionFlagsBits.KickMembers)) {
                    responseMessage = "❌ You don't have the permission to **KICK** members!";
                } else {
                    await targetUser.kick(reason).catch(e => {
                        console.error(`Error kicking user ${targetUser.id}:`, e);
                        responseMessage = `❌ There was an error kicking ${targetUser.user.tag}.`;
                    });

                    if (!responseMessage) {
                         await sendDmNotification(
                            targetUser, 
                            "You Have Been Kicked", 
                            `You have been kicked from **${guild.name}**.\n\n**Reason:** ${reason}`,
                            DELETE_COLOR
                        );
                        responseMessage = `✅ **${targetUser.user.tag}** has been **KICKED**!`;
                        actionTaken = true;
                        collector.stop('action_taken');
                    }
                }
            }

            if (responseMessage) {
                await interaction.followUp({ content: responseMessage, flags: [MessageFlags.Ephemeral] });
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                interaction.editReply({ 
                    content: `Mod panel for ${targetUser.user.tag} expired.`, 
                    embeds: [embed.setTitle("Moderation Panel (Expired)")], 
                    components: [] 
                }).catch(() => {});
            } else if (reason === 'action_taken') {
            }
        });
    }
};
