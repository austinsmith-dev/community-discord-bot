const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.TOKEN;

/**
 * Registers all application commands with Discord's API.
 * This should only be run once the client is ready.
 * @param {import('discord.js').Client} client
 */
module.exports = (client) => {
    const commandsToDeploy = client.commandArray; 
    
    if (!commandsToDeploy || commandsToDeploy.length === 0) {
        console.error('Deployment skipped: No commands found in client.commandArray.');
        return;
    }

    const rest = new REST().setToken(token);

    (async () => {
        try {
            console.log(`Started refreshing ${commandsToDeploy.length} application (/) commands.`);
            
            await rest.put(
                Routes.applicationCommands(clientId), 
                { body: [] }, 
            );
            console.log(`Successfully cleared old global commands.`);

            const data = await rest.put(
                Routes.applicationGuildCommands(clientId, guildId), 
                { body: commandsToDeploy },
            );

            console.log(`Successfully reloaded ${data.length} guild application (/) commands.`);
        } catch (error) {
            console.error('Error during command deployment:', error);
        }
    })();
};