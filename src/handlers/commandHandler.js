const fs = require('fs');
const path = require('path');
require('@colors/colors');

/**
 * Loads all command files into the client's command collection.
 * Uses path.resolve to ensure correct pathing regardless of execution context.
 * @param {import('discord.js').Client} client
 */
function loadCommands(client) {
  const commandsPath = path.resolve(__dirname, '../commands');
  const commandFolders = fs.readdirSync(commandsPath);
  let loadedCount = 0;

  client.commandArray = []; 

  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    
    if (!fs.statSync(folderPath).isDirectory()) continue;
    
    const commandFiles = fs.readdirSync(folderPath).filter((file) => file.endsWith('.js'));
    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);
      try {
        const command = require(filePath);

        if (command && 'data' in command && 'execute' in command) {
          client.commands.set(command.data.name, command);
          client.commandArray.push(command.data.toJSON());
          loadedCount++;
        } else {
          console.warn(`[WARNING] The command at ${path.join(folder, file)} is missing a required "data" or "execute" property.`);
        }
      } catch (error) {
        console.error(`[ERROR] Failed to load command ${file}:`, error);
      }
    }
  }
  console.log(`[Commands]`.red + ` Successfully loaded ${loadedCount} command(s).`);
}

module.exports = { load: loadCommands };