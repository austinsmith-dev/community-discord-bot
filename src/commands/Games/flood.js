const { SlashCommandBuilder} = require('discord.js')
const { Flood } = require('discord-gamecord');
module.exports = {
  data: new SlashCommandBuilder()
      .setName(`flood`)
      .setDescription(`Play a game of flood`)
      .setDMPermission(false),
      async execute (interaction) {
    
    const Game = new Flood({
      message: interaction,
      isSlashGame: true,
      embed: {
        title: 'Flood',
        color: '#5865F2',
      },
      difficulty: 13,
      timeoutTime: 60000,
      buttonStyle: 'PRIMARY',
      emojis: ['🟥', '🟦', '🟧', '🟪', '🟩'],
      winMessage: 'You won! You took **{turns}** turns.',
      loseMessage: 'You lost! You took **{turns}** turns.',
      playerOnlyMessage: 'Only {player} can use these buttons.'
    });
      
    Game.startGame();
  },
};