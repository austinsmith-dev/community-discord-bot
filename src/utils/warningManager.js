const warningSchema = require("../Schemas/warnsSchema");
const { EmbedBuilder, MessageFlags } = require('discord.js');

/**
 * Generates a random alphanumeric code for a WarnID.
 * @param {number} length The length of the ID.
 * @returns {string} The generated ID.
 */
function generateRandomCode(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters[Math.floor(Math.random() * characters.length)];
    }
    return result;
}

/**
 * Adds a new warning to a user's record.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} targetUserId
 * @param {string} reason
 */
async function addWarn(interaction, targetUserId, reason) {
    const warningData = await warningSchema.findOneAndUpdate(
        { GuildID: interaction.guild.id, UserID: targetUserId },
        {
            $push: { 
                Content: {
                    ExecuterId: interaction.user.id,
                    ExecuterTag: interaction.user.tag,
                    Reason: reason,
                    WarnID: generateRandomCode(10),
                    Timestamp: Date.now()
                }
            },
            UserTag: (await interaction.guild.members.fetch(targetUserId)).user.tag
        },
        { new: true, upsert: true }
    );
 
    const warnEmbed = new EmbedBuilder()
        .setColor('#FFA500') 
        .setTitle(`✅ Warning Issued`)
        .setDescription(`User: <@${targetUserId}> has received a warning.`)
        .addFields(
            { name: "Reason", value: reason, inline: false },
            { name: "Warn ID", value: warningData.Content[warningData.Content.length - 1].WarnID, inline: false }
        )
        .setTimestamp();
 
    await interaction.reply({ embeds: [warnEmbed] });
}

/**
 * Edits the reason for an existing warning.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} targetUserId
 * @param {string} warnId
 * @param {string} newReason
 */
async function editWarn(interaction, targetUserId, warnId, newReason) {
    const warningData = await warningSchema.findOne({ GuildID: interaction.guild.id, UserID: targetUserId });
    const editEmbed = new EmbedBuilder().setColor('#FFA500'); 
 
    if (!warningData) {
        return interaction.reply({ content: `User <@${targetUserId}> has no warnings.`, flags: [MessageFlags.Ephemeral] });
    }
    
    const warningIndex = warningData.Content.findIndex(w => w.WarnID === warnId);
    if (warningIndex === -1) {
        return interaction.reply({ content: `Warn ID \`${warnId}\` not found for <@${targetUserId}>.`, flags: [MessageFlags.Ephemeral] });
    }
    
    const warning = warningData.Content[warningIndex];
    const oldReason = warning.Reason;

    warning.Reason = newReason;
    warning.Edits = warning.Edits || [];
    warning.Edits.push({
        EditedByExecuterId: interaction.user.id,
        EditedByExecuterTag: interaction.user.tag,
        NewReason: newReason,
        OldReason: oldReason,
        EditTimestamp: Date.now()
    });

    await warningData.save();

    editEmbed.setTitle(`✏️ Warning Updated for ${(await interaction.guild.members.fetch(targetUserId)).user.tag}`)
        .setDescription(`**Warn ID:** \`${warnId}\`\n**Old Reason:** ${oldReason}\n**New Reason:** ${newReason}`)
        .setTimestamp();
 
    await interaction.reply({ embeds: [editEmbed] });
}

/**
 * Clears all warnings for a specified user.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} targetUserId
 */
async function clearWarns(interaction, targetUserId) {
    const result = await warningSchema.findOneAndDelete({ GuildID: interaction.guild.id, UserID: targetUserId });

    if (!result) {
        return interaction.reply({ content: `User <@${targetUserId}> has no warnings to clear.`, flags: [MessageFlags.Ephemeral] });
    }
    
    const clearEmbed = new EmbedBuilder()
        .setColor('#00FF00') 
        .setTitle(`🗑️ Warnings Cleared`)
        .setDescription(`All ${result.Content.length} warnings for <@${targetUserId}> have been cleared.`)
        .setTimestamp();
 
    await interaction.reply({ embeds: [clearEmbed] });
}

/**
 * Removes a specific warning by ID.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} targetUserId
 * @param {string} warnId
 */
async function removeWarn(interaction, targetUserId, warnId) {
    const warningData = await warningSchema.findOne({ GuildID: interaction.guild.id, UserID: targetUserId });
 
    if (!warningData) {
        return interaction.reply({ content: `User <@${targetUserId}> has no warnings.`, flags: [MessageFlags.Ephemeral] });
    }
    
    const initialCount = warningData.Content.length;
    
    const newContent = warningData.Content.filter(w => w.WarnID !== warnId);

    if (newContent.length === initialCount) {
        return interaction.reply({ content: `Warn ID \`${warnId}\` not found for <@${targetUserId}>.`, flags: [MessageFlags.Ephemeral] });
    }
    
    warningData.Content = newContent;
    await warningData.save();
    
    const removeEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle(`✅ Warning Removed`)
        .setDescription(`Warn ID \`${warnId}\` has been successfully removed from <@${targetUserId}>.`)
        .setTimestamp();
 
    await interaction.reply({ embeds: [removeEmbed] });
}

/**
 * Lists all warnings for a user, or the command user.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} targetUserId
 */
async function listWarns(interaction, targetUserId) {
    const targetUser = await interaction.guild.members.fetch(targetUserId);
    const warningData = await warningSchema.findOne({ GuildID: interaction.guild.id, UserID: targetUserId });
    
    const listEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`📝 Warnings for ${targetUser.user.tag}`)
        .setThumbnail(targetUser.user.displayAvatarURL());
 
    if (!warningData || !warningData.Content.length) {
        listEmbed.setDescription(`This user has no recorded warnings.`);
    } else {
        const warnDetails = warningData.Content.map((w, index) => 
            `**#${index + 1}** | ID: \`${w.WarnID}\`\nReason: *${w.Reason.slice(0, 50)}${w.Reason.length > 50 ? '...' : ''}*\nIssued: <t:${Math.floor(w.Timestamp / 1000)}:R>`
        ).join('\n\n');
        
        listEmbed.setDescription(`**Total Warnings:** ${warningData.Content.length}\n\n${warnDetails}`);
    }
 
    await interaction.reply({ embeds: [listEmbed] });
}

/**
 * Gets detailed information about a specific warning ID.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} targetUserId
 * @param {string} warnId
 */
async function getWarnInfo(interaction, targetUserId, warnId) {
    const targetUser = await interaction.guild.members.fetch(targetUserId);
    const warningData = await warningSchema.findOne({ GuildID: interaction.guild.id, UserID: targetUserId });
    const infoEmbed = new EmbedBuilder().setColor('#0099ff');
 
    if (!warningData) {
        return interaction.reply({ content: `User <@${targetUserId}> has no warnings.`, flags: [MessageFlags.Ephemeral] });
    }
    
    const warning = warningData.Content.find(w => w.WarnID === warnId);
    
    if (!warning) {
        return interaction.reply({ content: `Warn ID \`${warnId}\` not found for <@${targetUserId}>.`, flags: [MessageFlags.Ephemeral] });
    }
    
    infoEmbed.setTitle(`📋 Warning Info: #${warnId}`)
        .setDescription(`**Target:** ${targetUser.user.tag} (${targetUserId})`)
        .addFields(
            { name: "Issued By", value: warning.ExecuterTag, inline: true },
            { name: "Issued On", value: `<t:${Math.floor(warning.Timestamp / 1000)}:f>`, inline: true },
            { name: "Current Reason", value: warning.Reason, inline: false }
        );

    if (warning.Edits && warning.Edits.length > 0) {
        const editLogs = warning.Edits.map((edit, index) => 
            `**Edit ${index + 1}** by ${edit.EditedByExecuterTag}:\n- Old: *${edit.OldReason.slice(0, 50)}${edit.OldReason.length > 50 ? '...' : ''}*\n- New: *${edit.NewReason.slice(0, 50)}${edit.NewReason.length > 50 ? '...' : ''}*\n- Time: <t:${Math.floor(edit.EditTimestamp / 1000)}:R>`
        ).join('\n\n');
        
        infoEmbed.addFields({ name: `Reason Edit History (${warning.Edits.length})`, value: editLogs, inline: false });
    }
 
    await interaction.reply({ embeds: [infoEmbed] });
}

module.exports = {
    addWarn,
    editWarn,
    clearWarns,
    removeWarn,
    listWarns,
    getWarnInfo
};
