const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

const MAX_FETCH = 100; // Max messages to fetch per API call
const API_WAIT_TIME = 1000; // Wait time between bulkDelete calls

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Deletes up to 1000 messages based on user and type.')
    .setDMPermission(false)
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Type of messages to delete')
        .setRequired(true)
        .addChoices(
          { name: 'All', value: 'all' },
          { name: 'Text Only', value: 'text' },
          { name: 'Embeds', value: 'embed' },
          { name: 'Attachments', value: 'attachment' },
          { name: 'Links', value: 'links' },
          { name: 'Mentions', value: 'mentions' },
          { name: 'Messages With Reactions', value: 'reactions' },
          { name: 'Messages With Emojis', value: 'emojis' },
        ))
    .addUserOption(option => option.setName('target').setDescription('Select a user').setRequired(false))
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Number of messages to consider/delete (Max 1000)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(1000)),
  
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      await interaction.reply({ content: 'You do not have permission to use this command.', flags: [MessageFlags.Ephemeral] });
      return;
    }

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const targetUser = interaction.options.getUser('target');
    const type = interaction.options.getString('type', true);
    let targetAmount = interaction.options.getInteger('amount') || 100;
    targetAmount = Math.min(targetAmount, 1000);

    let messagesToDelete = [];
    let lastId;
    let messagesChecked = 0;
    
    const fourteenDaysAgo = Date.now() - (1000 * 60 * 60 * 24 * 14);

    try {
      while (messagesToDelete.length < targetAmount && messagesChecked < 1000) {
        const fetchLimit = Math.min(MAX_FETCH, targetAmount - messagesToDelete.length);
        
        const messages = await interaction.channel.messages.fetch({
            limit: fetchLimit,
            before: lastId
        });
        
        if (messages.size === 0) break;

        const messagesArray = Array.from(messages.values());
        lastId = messagesArray[messagesArray.length - 1].id;
        messagesChecked += messages.size;

        const filtered = messagesArray.filter(m => {
          if (m.createdTimestamp < fourteenDaysAgo) return false;
            
          if (targetUser && m.author.id !== targetUser.id) return false;

          switch (type) {
            case 'all':
              return true;
            case 'text':
              return m.content && !m.attachments.size && !m.embeds.length;
            case 'embed':
              return m.embeds.length > 0;
            case 'attachment':
              return m.attachments.size > 0;
            case 'links':
              return m.content.includes('http://') || m.content.includes('https://');
            case 'mentions':
              return m.mentions.users.size > 0 || m.mentions.roles.size > 0;
            case 'reactions':
              return m.reactions.cache.size > 0;
            case 'emojis':
              return m.content.match(/<:\w+:\d+>/g) || m.content.match(/<a:\w+:\d+>/g);
            default:
                return false;
          }
        });

        messagesToDelete.push(...filtered);
        
        if (messagesChecked >= 1000) break;
      }
      
      const messagesToBulkDelete = messagesToDelete.slice(0, targetAmount);
      
      if (messagesToBulkDelete.length === 0) {
        return interaction.followUp({ content: 'No messages found matching the criteria in the latest history.', flags: [MessageFlags.Ephemeral] });
      }

      let finalDeletedCount = 0;
      
      for (let i = 0; i < messagesToBulkDelete.length; i += MAX_FETCH) {
          const chunk = messagesToBulkDelete.slice(i, i + MAX_FETCH);
          if (chunk.length === 0) break;
          
          await interaction.channel.bulkDelete(chunk, true);
          finalDeletedCount += chunk.length;
          
          if (i + MAX_FETCH < messagesToBulkDelete.length) {
             await new Promise(resolve => setTimeout(resolve, API_WAIT_TIME));
          }
      }

      const userTag = targetUser ? ` from ${targetUser.username}` : '';
      await interaction.followUp({ content: `✅ Successfully deleted **${finalDeletedCount}** messages${userTag}.`, flags: [MessageFlags.Ephemeral] });

    } catch (error) {
      console.error(error);
      if (error.code === 50035) {
         await interaction.followUp({ content: '❌ Error: Messages older than 14 days cannot be bulk deleted.', flags: [MessageFlags.Ephemeral] });
      } else if (error.code === 50013) {
         await interaction.followUp({ content: '❌ Error: I do not have permissions to manage messages in this channel.', flags: [MessageFlags.Ephemeral] });
      } else {
         await interaction.followUp({ content: '❌ An unexpected error occurred while trying to purge messages.', flags: [MessageFlags.Ephemeral] });
      }
    }
  },
};