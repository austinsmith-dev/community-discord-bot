const { Events, EmbedBuilder, AttachmentBuilder, PermissionsBitField, AuditLogEvent, ChannelType } = require('discord.js');
const Audit_Log = require('../Schemas/auditlog');

const COLOR = "#3498DB"; // Blue/Standard Log Color
const DELETE_COLOR = "#E74C3C"; // Red for deletions
const CREATE_COLOR = "#2ECC71"; // Green for creations
const MEMBER_COLOR = "#9B59B6"; // Purple for member/user changes

/**
 * Helper to retrieve audit log configuration and channel.
 * @param {import('discord.js').Guild} guild
 * @param {string} logType The log level value (e.g., 'guildMemberAdd')
 * @returns {Promise<import('discord.js').TextChannel | null>} The log channel if setup, null otherwise.
 */
const getLogChannel = async (guild, logType) => {
    const auditLogConfig = await Audit_Log.findOne({ Guild: guild.id });
    if (!auditLogConfig || !Array.isArray(auditLogConfig.LogLevel) || !auditLogConfig.LogLevel.includes(logType)) {
        return null;
    }
    const channel = guild.channels.cache.get(auditLogConfig.Channel);
    return channel?.isTextBased() ? channel : null;
};

// --- Listener Definitions (15 Total) ---

// 1. New Member Joined (guildMemberAdd)
module.exports.guildMemberAdd = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        if (member.user.bot) return;
        const logChannel = await getLogChannel(member.guild, "guildMemberAdd");
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setTitle("LOGS | New Member Joined")
            .setColor(CREATE_COLOR)
            .addFields(
                { name: "👤 Member", value: `${member.user.tag} (${member.id})`, inline: true },
                { name: "👥 Total Members", value: `${member.guild.memberCount}`, inline: true },
                { name: '\u200B', value: '\u200B', inline: true },
                { name: "📅 Joined Server", value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`, inline: false },
                { name: "📅 Account Created", value: `<t:${Math.floor(member.user.createdAt.getTime() / 1000)}:R>`, inline: false },
            )
            .setTimestamp()
            .setFooter({ text: "Member Join" })
            .setThumbnail(member.user.displayAvatarURL());

        await logChannel.send({ embeds: [embed] });
    }
};

// 2. Member Left (guildMemberRemove)
module.exports.guildMemberRemove = {
    name: Events.GuildMemberRemove,
    async execute(member) {
        const logChannel = await getLogChannel(member.guild, "guildMemberRemove");
        if (!logChannel) return;

        const auditLogs = await member.guild.fetchAuditLogs({ type: AuditLogEvent.MemberKick, limit: 1 }).catch(() => null);
        const logEntry = auditLogs?.entries.first();
        const kicked = logEntry && logEntry.target.id === member.id && logEntry.createdTimestamp > Date.now() - 5000;
        
        const reason = kicked ? `Kicked by ${logEntry.executor.tag} for: ${logEntry.reason || 'No reason provided'}` : 'Left the server';

        const embed = new EmbedBuilder()
            .setTitle("LOGS | Member Left")
            .setColor(DELETE_COLOR)
            .addFields([
                { name: "👤 Member", value: `${member.user.tag} (${member.id})`, inline: true },
                { name: "Reason", value: reason, inline: false },
            ])
            .setTimestamp()
            .setFooter({ text: "Member Removal" })
            .setThumbnail(member.user.displayAvatarURL());

        await logChannel.send({ embeds: [embed] });
    }
};

// 3. Channel Created (channelCreate)
module.exports.channelCreate = {
    name: Events.ChannelCreate,
    async execute(channel) {
        if (!channel.guild) return;
        const logChannel = await getLogChannel(channel.guild, "channelCreate");
        if (!logChannel) return;
        
        const embed = new EmbedBuilder()
            .setTitle("LOGS | Channel Created")
            .setColor(CREATE_COLOR)
            .addFields([
                { name: "📚 Channel", value: `<#${channel.id}>`, inline: true },
                { name: "Channel Type", value: ChannelType[channel.type], inline: true },
                { name: "Channel ID", value: channel.id, inline: false },
            ])
            .setDescription(`A new channel was created: **${channel.name}**`)
            .setTimestamp()
            .setFooter({ text: "Channel Creation" });

        await logChannel.send({ embeds: [embed] });
    }
};

// 4. Channel Updated (channelUpdate)
module.exports.channelUpdate = {
    name: Events.ChannelUpdate,
    async execute(oldChannel, newChannel) {
        if (!newChannel.guild) return;
        const logChannel = await getLogChannel(newChannel.guild, "channelUpdate");
        if (!logChannel) return;

        const changes = [];
        if (oldChannel.name !== newChannel.name) changes.push(`Name: **${oldChannel.name}** ➔ **${newChannel.name}**`);
        if (oldChannel.topic !== newChannel.topic) changes.push(`Topic was updated`);
        if (oldChannel.nsfw !== newChannel.nsfw) changes.push(`NSFW status changed to **${newChannel.nsfw ? 'Yes' : 'No'}**`);
        if (oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) changes.push(`Slow mode: **${oldChannel.rateLimitPerUser}s** ➔ **${newChannel.rateLimitPerUser}s**`);
        if (oldChannel.rawPosition !== newChannel.rawPosition) changes.push(`Position changed`);
        
        if (oldChannel.permissionOverwrites.cache.size !== newChannel.permissionOverwrites.cache.size) changes.push(`Permissions were modified`);

        if (changes.length === 0) return;

        const embed = new EmbedBuilder()
            .setTitle("LOGS | Channel Updated")
            .setColor(COLOR)
            .setDescription(`**${newChannel.name}** was updated:\n- ${changes.join('\n- ')}`)
            .setTimestamp()
            .setFooter({ text: "Channel Update" });

        await logChannel.send({ embeds: [embed] });
    }
};

// 5. Channel Deleted (channelDelete)
module.exports.channelDelete = {
    name: Events.ChannelDelete,
    async execute(channel) {
        if (!channel.guild) return;
        const logChannel = await getLogChannel(channel.guild, "channelDelete");
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setTitle("LOGS | Channel Deleted")
            .setColor(DELETE_COLOR)
            .addFields([
                { name: "📚 Channel Name", value: channel.name, inline: true },
                { name: "Channel Type", value: ChannelType[channel.type], inline: true },
                { name: "Channel ID", value: channel.id, inline: false },
            ])
            .setDescription(`A channel was deleted: **${channel.name}**`)
            .setTimestamp()
            .setFooter({ text: "Channel Deletion" });

        await logChannel.send({ embeds: [embed] });
    }
};

// 6. Message Sent (messageCreate - simplified for logging)
module.exports.messageCreate = {
    name: Events.MessageCreate,
    async execute(message) {
        if (!message.guild || message.author.bot) return;
        const logChannel = await getLogChannel(message.guild, "messageCreate");
        if (!logChannel) return;
        
        const contentPreview = message.content.slice(0, 1000) || "No text content";

        const embed = new EmbedBuilder()
            .setTitle("LOGS | Message Created")
            .setColor(CREATE_COLOR)
            .addFields([
                { name: "👤 Author", value: message.author.tag, inline: true },
                { name: "📚 Channel", value: `<#${message.channel.id}>`, inline: true },
                { name: "📄 Content", value: `\`\`\`${contentPreview}\`\`\``, inline: false },
            ])
            .setTimestamp()
            .setFooter({ text: "Message Creation" });

        await logChannel.send({ embeds: [embed] });
    }
};

// 7. Message Edited (messageUpdate)
module.exports.messageUpdate = {
    name: Events.MessageUpdate,
    async execute(oldMessage, newMessage) {
        if (oldMessage.partial || newMessage.partial) {
            return;
        }
        if (oldMessage.author.bot || oldMessage.content === newMessage.content) return;
        if (!newMessage.guild) return;

        const logChannel = await getLogChannel(newMessage.guild, "messageUpdate");
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setTitle("LOGS | Message Edited")
            .setColor(COLOR)
            .addFields([
                { name: "👤 Author", value: `${newMessage.author.tag}`, inline: true },
                { name: "📚 Channel", value: `${newMessage.channel}`, inline: true },
                { name: "📄 Before", value: oldMessage.content ? oldMessage.content.substring(0, 500) : "No Content / Embed", inline: false },
                { name: "📄 After", value: newMessage.content.substring(0, 500), inline: false },
                { name: "Message Link", value: `[Jump to message](${newMessage.url})`, inline: true },
            ])
            .setTimestamp()
            .setFooter({ text: "Message Update" });

        await logChannel.send({ embeds: [embed] });
    }
};

// 8. Message Deleted (messageDelete)
module.exports.messageDelete = {
    name: Events.MessageDelete,
    async execute(message) {
        if (!message.guild || message.system || message.author?.bot) return;
        const logChannel = await getLogChannel(message.guild, "messageDelete");
        if (!logChannel) return;

        const contentPreview = message.content ? message.content.slice(0, 1000) : "No text content (could be an embed or attachment)";
        
        const embed = new EmbedBuilder()
            .setTitle("LOGS | Message Deleted")
            .setColor(DELETE_COLOR)
            .addFields([
                { name: "👤 Author", value: message.author?.tag || "Unknown Author", inline: true },
                { name: "📚 Channel", value: `<#${message.channel.id}>`, inline: true },
                { name: "📄 Content", value: `\`\`\`${contentPreview}\`\`\``, inline: false },
            ])
            .setTimestamp()
            .setFooter({ text: "Message Deletion" });

        await logChannel.send({ embeds: [embed] });
    }
};

// 9. Voice Channel Activity (voiceChannelActivity)
module.exports.voiceChannelActivity = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        if (!newState.guild) return;

        const logChannel = await getLogChannel(newState.guild, "voiceChannelActivity");
        if (!logChannel) return;

        let description = "";
        let memberCount = newState.channel ? newState.channel.members.size : 0;
        const memberTag = newState.member?.user.tag;

        if (!oldState.channel && newState.channel) {
            description = `${memberTag} joined **${newState.channel.name}**. \nMembers now: **${memberCount}**.`;
        } else if (oldState.channel && !newState.channel) {
            description = `${memberTag} left **${oldState.channel.name}**.`;
        } else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
            description = `${memberTag} switched from **${oldState.channel.name}** to **${newState.channel.name}**.\nMembers now in new channel: **${memberCount}**.`;
        } else if (oldState.mute !== newState.mute) {
            description = `${memberTag} was **${newState.mute ? 'server muted' : 'server unmuted'}**.`;
        } else if (oldState.deaf !== newState.deaf) {
            description = `${memberTag} was **${newState.deaf ? 'server deafened' : 'server undeafened'}**.`;
        } else {
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle("LOGS | Voice Channel Activity")
            .setColor(MEMBER_COLOR)
            .setDescription(description)
            .setTimestamp()
            .setFooter({ text: "Voice Channel Update" });

        await logChannel.send({ embeds: [embed] });
    }
};

// 10. Guild Ban Added (guildBanAdd)
module.exports.guildBanAdd = {
    name: Events.GuildBanAdd,
    async execute(ban) {
        const logChannel = await getLogChannel(ban.guild, "guildBanAdd");
        if (!logChannel) return;

        // Fetch audit log to get executor and reason
        const auditLogs = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 }).catch(() => null);
        const logEntry = auditLogs?.entries.first();

        let executor = "Unknown";
        let reason = ban.reason || "No reason provided";

        if (logEntry && logEntry.target.id === ban.user.id && logEntry.createdTimestamp > Date.now() - 5000) {
            executor = logEntry.executor.tag;
            reason = logEntry.reason || reason;
        }

        const embed = new EmbedBuilder()
            .setTitle("LOGS | Member Banned")
            .setColor(DELETE_COLOR)
            .addFields(
                { name: "👤 User", value: `${ban.user.tag} (${ban.user.id})`, inline: false },
                { name: "🔨 Banned By", value: executor, inline: true },
                { name: "📝 Reason", value: reason, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: "Guild Ban Add" })
            .setThumbnail(ban.user.displayAvatarURL());

        await logChannel.send({ embeds: [embed] });
    }
};

// 11. Guild Ban Removed (guildBanRemove)
module.exports.guildBanRemove = {
    name: Events.GuildBanRemove,
    async execute(ban) {
        const logChannel = await getLogChannel(ban.guild, "guildBanRemove");
        if (!logChannel) return;

        const auditLogs = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanRemove, limit: 1 }).catch(() => null);
        const logEntry = auditLogs?.entries.first();

        let executor = "Unknown";
        
        if (logEntry && logEntry.target.id === ban.user.id && logEntry.createdTimestamp > Date.now() - 5000) {
            executor = logEntry.executor.tag;
        }

        const embed = new EmbedBuilder()
            .setTitle("LOGS | Member Unbanned")
            .setColor(CREATE_COLOR)
            .addFields(
                { name: "👤 User", value: `${ban.user.tag} (${ban.user.id})`, inline: false },
                { name: "✅ Unbanned By", value: executor, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: "Guild Ban Remove" })
            .setThumbnail(ban.user.displayAvatarURL());

        await logChannel.send({ embeds: [embed] });
    }
};

// 12. Role Created (roleCreate)
module.exports.roleCreate = {
    name: Events.RoleCreate,
    async execute(role) {
        const logChannel = await getLogChannel(role.guild, "roleCreate");
        if (!logChannel) return;

        const auditLogs = await role.guild.fetchAuditLogs({ type: AuditLogEvent.RoleCreate, limit: 1 }).catch(() => null);
        const logEntry = auditLogs?.entries.first();
        let executor = "Unknown";
        
        if (logEntry && logEntry.target.id === role.id && logEntry.createdTimestamp > Date.now() - 5000) {
            executor = logEntry.executor.tag;
        }

        const embed = new EmbedBuilder()
            .setTitle("LOGS | Role Created")
            .setColor(CREATE_COLOR)
            .addFields([
                { name: "Role Name", value: role.name, inline: true },
                { name: "Role ID", value: role.id, inline: true },
                { name: "Created By", value: executor, inline: false },
                { name: "Mentionable", value: role.mentionable ? "Yes" : "No", inline: true },
                { name: "Hoisted", value: role.hoist ? "Yes" : "No", inline: true },
                { name: "Permissions", value: role.permissions.toArray().length > 0 ? role.permissions.toArray().slice(0, 5).join(', ') + (role.permissions.toArray().length > 5 ? '...' : '') : 'No special permissions.', inline: false }
            ])
            .setTimestamp()
            .setFooter({ text: "Role Creation" });

        await logChannel.send({ embeds: [embed] });
    }
};

// 13. Role Updated (roleUpdate)
module.exports.roleUpdate = {
    name: Events.RoleUpdate,
    async execute(oldRole, newRole) {
        const logChannel = await getLogChannel(newRole.guild, "roleUpdate");
        if (!logChannel) return;

        let changes = [];

        if (oldRole.name !== newRole.name) {
            changes.push({ name: "Role Name", value: `From \`${oldRole.name}\` to \`${newRole.name}\`` });
        }
        if (oldRole.hexColor !== newRole.hexColor) {
            changes.push({ name: "Color", value: `From \`${oldRole.hexColor}\` to \`${newRole.hexColor}\`` });
        }

        const oldPermissions = new PermissionsBitField(oldRole.permissions.bitfield);
        const newPermissions = new PermissionsBitField(newRole.permissions.bitfield);
        const addedPermissions = newPermissions.missing(oldPermissions).toArray();
        const removedPermissions = oldPermissions.missing(newPermissions).toArray();

        if (addedPermissions.length > 0) {
            changes.push({ name: "Added Permissions", value: addedPermissions.join(", ") });
        }
        if (removedPermissions.length > 0) {
            changes.push({ name: "Removed Permissions", value: removedPermissions.join(", ") });
        }

        if (oldRole.mentionable !== newRole.mentionable) {
            changes.push({ name: "Mentionable", value: `Changed to **${newRole.mentionable ? 'Yes' : 'No'}**` });
        }
        
        if (oldRole.hoist !== newRole.hoist) {
            changes.push({ name: "Hoisted (Separate)", value: `Changed to **${newRole.hoist ? 'Yes' : 'No'}**` });
        }

        if (changes.length === 0) return;

        const embed = new EmbedBuilder()
            .setTitle("LOGS | Role Updated")
            .setColor(COLOR)
            .addFields(changes)
            .setTimestamp()
            .setFooter({ text: `Role Update - ID: ${newRole.id}` });

        await logChannel.send({ embeds: [embed] });
    }
};

// 14. Emoji Created (emojiCreate)
module.exports.emojiCreate = {
    name: Events.GuildEmojiCreate,
    async execute(emoji) {
        const logChannel = await getLogChannel(emoji.guild, "emojiCreate");
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setTitle("LOGS | 🆕 Emoji Created")
            .setColor(CREATE_COLOR)
            .setDescription(`A new emoji has been added: ${emoji}`)
            .addFields(
                { name: "Name", value: emoji.name, inline: true },
                { name: "ID", value: emoji.id, inline: true },
                { name: "Animated", value: emoji.animated ? 'Yes' : 'No', inline: true }
            )
            .setThumbnail(emoji.url)
            .setTimestamp()
            .setFooter({ text: "Emoji Creation" });

        await logChannel.send({ embeds: [embed] });
    }
};

// 15. Emoji Updated (emojiUpdate)
module.exports.emojiUpdate = {
    name: Events.GuildEmojiUpdate,
    async execute(oldEmoji, newEmoji) {
        const logChannel = await getLogChannel(newEmoji.guild, "emojiUpdate");
        if (!logChannel) return;

        const changes = [];
        if (oldEmoji.name !== newEmoji.name) {
            changes.push(`Name: \`${oldEmoji.name}\` ➔ \`${newEmoji.name}\``);
        }
        
        if (changes.length === 0) return;
        
        const embed = new EmbedBuilder()
            .setTitle("LOGS | 🔧 Emoji Updated")
            .setColor(COLOR)
            .setDescription(`Emoji ${newEmoji} was updated:\n- ${changes.join('\n- ')}`)
            .setThumbnail(newEmoji.url)
            .setTimestamp()
            .setFooter({ text: "Emoji Update" });

        await logChannel.send({ embeds: [embed] });
    }
};

// 16. Emoji Deleted (emojiDelete)
module.exports.emojiDelete = {
    name: Events.GuildEmojiDelete,
    async execute(emoji) {
        const logChannel = await getLogChannel(emoji.guild, "emojiDelete");
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setTitle("LOGS | ❌ Emoji Deleted")
            .setColor(DELETE_COLOR)
            .setDescription(`An emoji was removed: \`${emoji.name}\``)
            .addFields(
                { name: "Name", value: emoji.name, inline: true },
                { name: "ID", value: emoji.id, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: "Emoji Deletion" });

        await logChannel.send({ embeds: [embed] });
    }
};

// 17. User/Member Updated (userUpdates)
module.exports.userUpdates = {
    name: Events.GuildMemberUpdate,
    async execute(oldMember, newMember) {
        const guild = newMember.guild;

        const logChannel = await getLogChannel(guild, "userUpdates");
        if (!logChannel) return;

        let description = `**User Update Detected for ${newMember.user.tag}**\n`;
        let fieldsChanged = false;

        if (oldMember.nickname !== newMember.nickname) {
            description += `\n**Nickname Changed**\nFrom \`${oldMember.nickname || 'None'}\` to \`${newMember.nickname || 'None'}\``;
            fieldsChanged = true;
        }

        const oldRoles = oldMember.roles.cache;
        const newRoles = newMember.roles.cache;

        const addedRoles = newRoles.filter(role => !oldRoles.has(role.id));
        const removedRoles = oldRoles.filter(role => !newRoles.has(role.id));

        if (addedRoles.size > 0) {
            description += `\n**Roles Added:** ${addedRoles.map(role => role.toString()).join(", ")}`;
            fieldsChanged = true;
        }
        if (removedRoles.size > 0) {
            description += `\n**Roles Removed:** ${removedRoles.map(role => role.toString()).join(", ")}`;
            fieldsChanged = true;
        }

        if (oldMember.communicationDisabledUntilTimestamp !== newMember.communicationDisabledUntilTimestamp) {
            const timeoutStatus = newMember.communicationDisabledUntilTimestamp ? `until <t:${Math.floor(newMember.communicationDisabledUntilTimestamp / 1000)}:f>` : 'removed';
            description += `\n**Timeout**\nTimeout **${timeoutStatus}**`;
            fieldsChanged = true;
        }

        if (!fieldsChanged) return;

        const embed = new EmbedBuilder()
            .setTitle(`LOGS | User Update - ${newMember.user.tag}`)
            .setColor(MEMBER_COLOR)
            .setDescription(description)
            .setTimestamp()
            .setThumbnail(newMember.user.displayAvatarURL())
            .setFooter({ text: `User ID: ${newMember.id}` });

        await logChannel.send({ embeds: [embed] });
    }
};

// 18. Invite Created (inviteCreate)
module.exports.inviteCreate = {
    name: Events.InviteCreate,
    async execute(invite) {
        if (!invite.guild) return;

        const logChannel = await getLogChannel(invite.guild, "inviteCreate");
        if (!logChannel) return;

        const expire = invite.expiresAt ? `<t:${Math.floor(invite.expiresAt.getTime() / 1000)}:F>` : 'Never';

        const embed = new EmbedBuilder()
            .setTitle("LOGS | 🔗 Invite Created")
            .setColor(CREATE_COLOR)
            .setDescription(`An invite has been created by **${invite.inviter?.tag || 'Unknown'}**.`)
            .addFields(
                { name: "Channel", value: `${invite.channel.name}`, inline: true },
                { name: "Code", value: invite.code, inline: true },
                { name: "Expires", value: expire, inline: true },
                { name: "Max Uses", value: `${invite.maxUses === 0 ? 'Unlimited' : invite.maxUses}`, inline: true },
                { name: "Temporary", value: `${invite.temporary ? 'Yes' : 'No'}`, inline: true },
                { name: "Max Age", value: `${invite.maxAge === 0 ? 'Unlimited' : `${invite.maxAge} seconds`}`, inline: true }
            )
            .setFooter({ text: `Invite ID: ${invite.code}` })
            .setTimestamp();

        await logChannel.send({ embeds: [embed] });
    }
};

// 19. Invite Deleted (inviteDelete)
module.exports.inviteDelete = {
    name: Events.InviteDelete,
    async execute(invite) {
        if (!invite.guild) return;

        const logChannel = await getLogChannel(invite.guild, "inviteDelete");
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setTitle("LOGS | ❌ Invite Deleted")
            .setColor(DELETE_COLOR)
            .setDescription(`An invite link was deleted or expired.`)
            .addFields(
                { name: "Channel", value: `${invite.channel?.name || 'Unknown Channel'}`, inline: true },
                { name: "Code", value: invite.code, inline: true },
                { name: "Inviter", value: invite.inviter?.tag || 'Unknown', inline: true },
            )
            .setFooter({ text: `Invite ID: ${invite.code}` })
            .setTimestamp();

        await logChannel.send({ embeds: [embed] });
    }
};

// 20. Guild Updated (guildUpdate)
module.exports.guildUpdate = {
    name: Events.GuildUpdate,
    async execute(oldGuild, newGuild) {
        const logChannel = await getLogChannel(newGuild, "guildUpdate");
        if (!logChannel) return;
        
        const changes = [];

        if (oldGuild.name !== newGuild.name) changes.push(`Name: \`${oldGuild.name}\` ➔ \`${newGuild.name}\``);
        if (oldGuild.iconURL() !== newGuild.iconURL()) changes.push(`Icon was updated`);
        if (oldGuild.ownerId !== newGuild.ownerId) changes.push(`Owner changed: <@${oldGuild.ownerId}> ➔ <@${newGuild.ownerId}>`);
        if (oldGuild.rulesChannelId !== newGuild.rulesChannelId) changes.push(`Rules channel changed: ${oldGuild.rulesChannelId ? `<#${oldGuild.rulesChannelId}>` : 'None'} ➔ ${newGuild.rulesChannelId ? `<#${newGuild.rulesChannelId}>` : 'None'}`);

        if (changes.length === 0) return;

        const embed = new EmbedBuilder()
            .setTitle("LOGS | Server Updated")
            .setColor(COLOR)
            .setDescription(`The server was updated:\n- ${changes.join('\n- ')}`)
            .setTimestamp()
            .setFooter({ text: "Guild Update" });

        await logChannel.send({ embeds: [embed] });
    }
};
