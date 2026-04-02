const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('testerror')
        .setDescription('Test the bot\'s error handler and crash system.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false)
        .addStringOption(option =>
            option.setName('type')
                .setDescription('The type of error to trigger.')
                .setRequired(true)
                .addChoices(
                    { name: 'Reference Error (Sync)', value: 'reference' },
                    { name: 'Type Error (Sync)', value: 'type' },
                    { name: 'Unhandled Rejection (Async)', value: 'unhandled' }
                )
        ),
        
    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        const errorType = interaction.options.getString('type');
        const color = process.env.SERVER_COLOR || 0x0099ff;

        // Acknowledge the command first, as the actual error will be sent to the webhook
        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('🚨 Error Handler Test Initiated')
                    .setColor(color)
                    .setDescription(`Attempting to trigger a **${errorType.toUpperCase().replace('-', ' ')}**. Check your bot console and webhook channel for the report in a moment.`)
                    .setTimestamp()
            ],
            flags: [MessageFlags.Ephemeral]
        });

        // Use a short timeout to ensure the reply goes through before crashing/logging
        setTimeout(() => {
            try {
                switch (errorType) {
                    case 'reference':
                        // Triggers a synchronous ReferenceError (e.g., trying to call an undefined variable)
                        return undefinedFunction(); 
                        
                    case 'type':
                        // Triggers a synchronous TypeError (e.g., trying to read a property of null)
                        const obj = null;
                        return obj.someProperty;

                    case 'unhandled':
                        // Triggers an unhandled promise rejection (async error)
                        // The error handler should catch this via the process listener.
                        return Promise.reject(new Error('Test: Async Unhandled Rejection Error'));
                        
                    default:
                        // Should not happen, but good practice
                        console.error('Unknown error type requested for test.');
                        break;
                }
            } catch (err) {
                // Synchronous errors should technically be caught by the general interaction handler,
                // but if they are outside a try/catch, they are caught by uncaughtException.
                // We re-throw or log to ensure they hit the top-level handlers.
                console.error(`Caught error during switch case:`, err);
                throw err;
            }
        }, 1000); 
    }
};