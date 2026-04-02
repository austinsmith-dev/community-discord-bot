const fs = require('fs');
const path = require('path');
require('@colors/colors');

/**
 * Loads all event files into the client's listeners.
 * @param {import('discord.js').Client} client
 */
function loadEvents(client) {
  const eventDir = path.resolve(__dirname, '../events');
  const files = fs.readdirSync(eventDir).filter(file => file.endsWith('.js'));
  let loadedCount = 0;

  for (const file of files) {
    const eventFile = require(path.join(eventDir, file));
    
    if (eventFile.name && eventFile.execute) {
        registerEvent(client, eventFile);
        loadedCount++;
    } else {
        for (const key in eventFile) {
            const event = eventFile[key];
            if (event && event.name && event.execute) {
                registerEvent(client, event);
                loadedCount++;
            }
        }
    }
  }
  console.log(`[Events]`.cyan + ` Successfully loaded ${loadedCount} event listener(s).`);
}

/**
 * Registers a single event listener on the client or rest manager.
 * @param {import('discord.js').Client} client 
 * @param {{name: string, once?: boolean, rest?: boolean, execute: function}} event 
 */
function registerEvent(client, event) {
    const emitter = event.rest ? client.rest : client;
    
    const handler = event.name === 'ready' || event.name === 'raw' 
        ? (...args) => event.execute(...args, client) 
        : (...args) => event.execute(...args, client); 

    if (event.once) {
        emitter.once(event.name, handler);
    } else {
        emitter.on(event.name, handler);
    }
}

module.exports = { load: loadEvents };