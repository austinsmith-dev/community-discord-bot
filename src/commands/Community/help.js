const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commandFolders = fs.readdirSync(path.join(__dirname, '../../commands'));

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('List all available commands and their usage.')
        .addStringOption(option => {
            option.setName('category')
                .setDescription('The category of commands you want to see.')
                .setRequired(true);
            
            for (const folder of commandFolders) {
                option.addChoices({ name: capitalize(folder), value: folder.toLowerCase() });
            }

            return option;
        })
        .setDMPermission(false),

    async execute(interaction) {
        const { client } = interaction;
        const requestedCategory = interaction.options.getString('category');
        const embedColor = process.env.SERVER_COLOR || 0x0099ff;

        const categoryPath = path.join(__dirname, `../../commands/${capitalize(requestedCategory)}`);
        
        if (!fs.existsSync(categoryPath)) {
             return interaction.reply({ content: `❌ Command category **${capitalize(requestedCategory)}** not found.`, flags: [MessageFlags.Ephemeral] });
        }
        
        const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));
        
        const categoryCommands = [];

        for (const file of commandFiles) {
            const commandName = file.split('.')[0];
            const command = client.commands.find(cmd => cmd.data.name.toLowerCase() === commandName.toLowerCase());
            
            if (command) {
                let usage = `/${command.data.name}`;
                
                const subcommandGroupOptions = command.data.options.find(opt => opt.type === 2);
                const subcommandOptions = command.data.options.filter(opt => opt.type === 1);
                
                if (subcommandGroupOptions || subcommandOptions.length > 0) {
                    usage = `See autocomplete or type \`/${command.data.name}\` for usage details.`;
                }

                categoryCommands.push({
                    name: `/${command.data.name}`,
                    description: command.data.description,
                    usage: usage
                });
            }
        }

        if (categoryCommands.length === 0) {
             return interaction.reply({ content: `The **${capitalize(requestedCategory)}** category appears to be empty or failed to load.`, flags: [MessageFlags.Ephemeral] });
        }
        
        const commandEmbed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle(`📚 ${capitalize(requestedCategory)} Command List`)
            .setDescription(`Here is a list of commands available in the **${capitalize(requestedCategory)}** category:`)
            .setTimestamp();
        
        categoryCommands.forEach(command => {
            commandEmbed.addFields({
                name: command.name,
                value: `**Description:** ${command.description}\n**Usage:** \`${command.usage}\``,
                inline: false
            });
        });

        await interaction.reply({ embeds: [commandEmbed] });
    }
};
