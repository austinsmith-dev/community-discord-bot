const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const config = require('../../autoMod.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('testautomod')
        .setDescription('Test the automod functionality with a sample message.')
        .addStringOption(option => 
            option.setName('message')
            .setDescription('Enter the message to test automod')
            .setRequired(true)),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return await interaction.reply({ content: `You can't use this command!`, flags: [MessageFlags.Ephemeral] });
        }

        const inputMessage = interaction.options.getString('message');

        // Function to remove symbols but keep spaces
        const removeSymbols = (str) => {
            return str.replace(/[!#$%^&*()_+\[\]{}\\|;:'",.<>?/`~=-]/g, '').toLowerCase();
        };

        const cleanedContent = removeSymbols(inputMessage);
        const originalContent = inputMessage.toLowerCase();

        // Explicit check for @here and @everyone
        if (originalContent.includes('@here') || originalContent.includes('@everyone')) {
            const embed = new EmbedBuilder()
                .setTitle("Auto Moderation Test")
                .setColor(process.env.SERVER_COLOR)
                .setDescription(`The message contains a filtered word!`)
                .addFields(
                    { name: 'Detected Word', value: originalContent.includes('@here') ? '@here' : '@everyone' }, // Show the mention
                    { name: 'Detected in cleaned content', value: cleanedContent },
                    { name: 'Detected in original content', value: originalContent },
                    { name: 'Original Message', value: inputMessage }
                )
                .setTimestamp();

            return await interaction.reply({ embeds: [embed] });
        }

        // Function to check for filtered words
        const containsFilteredWord = (messageContent, filteredWords) => {
            for (const filteredWord of filteredWords) {
                const cleanFilteredWord = removeSymbols(filteredWord); // Clean filtered word
                const regex = new RegExp(`\\b${filteredWord}\\b`, 'i'); // Original word check
                const combinedWordCheck = messageContent.includes(cleanFilteredWord); // Check for combined words

                if (regex.test(messageContent) || combinedWordCheck) {
                    return filteredWord; // Return the detected word
                }
            }
            return null;
        };

        const filteredWords = config.moderationWords.map(word => word.toLowerCase());

        const detectedInCleanedContent = containsFilteredWord(cleanedContent, filteredWords);
        const detectedInOriginalContent = containsFilteredWord(originalContent, filteredWords);

        if (detectedInCleanedContent || detectedInOriginalContent) {
            const detectedWord = detectedInCleanedContent || detectedInOriginalContent;
            const embed = new EmbedBuilder()
                .setTitle("Auto Moderation Test")
                .setColor(process.env.SERVER_COLOR)
                .setDescription(`The message contains a filtered word!`)
                .addFields(
                    { name: 'Detected Word', value: detectedWord }, // Show the detected word
                    { name: 'Detected in cleaned content', value: cleanedContent },
                    { name: 'Detected in original content', value: originalContent },
                    { name: 'Original Message', value: inputMessage }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } else {
            const embed = new EmbedBuilder()
                .setTitle("Auto Moderation Test")
                .setColor(process.env.SERVER_COLOR)
                .setDescription(`No filtered words found.`)
                .addFields({ name: 'Original Message', value: inputMessage })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
    },
};
