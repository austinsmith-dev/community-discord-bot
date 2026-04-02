const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { RockPaperScissors } = require('discord-gamecord');

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rps")
    .setDescription("Starts a game of Rock Paper Scissors with another user.")
    .setDMPermission(false)
    .addUserOption(option =>
      option
        .setName("opponent")
        .setDescription("The user you want to play against.")
        .setRequired(true)
    ),
  async execute(interaction, client) {
    const opponent = interaction.options.getUser("opponent");
    if (!opponent)
      return interaction.reply(
        "Please mention the user you want to play against."
      );

    if (opponent.id === client.user.id) {
      return interaction.reply({
        content: "You can't play against the bot!",
        flags: [MessageFlags.Ephemeral]
      });
    } else if (opponent.id === interaction.user.id) {
      return interaction.reply({
        content: "You can't play against yourself!",
        flags: [MessageFlags.Ephemeral]
      });
    }

    try {
      const game = new RockPaperScissors({
        message: interaction,
        isSlashGame: true,
        opponent: opponent,
        embed: {
          title: 'Rock Paper Scissors',
          color: '#5865F2',
          description: 'Press a button below to make a choice.'
        },
        buttons: {
          rock: 'Rock',
          paper: 'Paper',
          scissors: 'Scissors'
        },
        emojis: {
          rock: '🌑',
          paper: '📰',
          scissors: '✂️'
        },
        mentionUser: true,
        timeoutTime: 60000,
        buttonStyle: 'PRIMARY',
        pickMessage: 'You choose {emoji}.',
        winMessage: '**{player}** won the Game! Congratulations!',
        tieMessage: 'The Game tied! No one won the Game!',
        timeoutMessage: 'The Game went unfinished! No one won the Game!',
        playerOnlyMessage: 'Only {player} and {opponent} can use these buttons.'
      });

      game.startGame();
      game.on("gameOver", () => {});
    } catch (error) {
      console.error("Error starting the game:", error);
    }
  },
};
