const { SlashCommandBuilder, MessageFlags }  = require("discord.js");
const { TicTacToe } = require("discord-gamecord");


module.exports = {
  data: new SlashCommandBuilder()
    .setName("tic-tac-toe")
    .setDescription("Starts a game of Tic Tac Toe with another user.")
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
      const game = new TicTacToe({
        message: interaction,
        isSlashGame: true,
        opponent: opponent,
        embed: {
          title: "Tic Tac Toe",
          color: "#5865F2",
          statusTitle: "Status",
          overTitle: "Game Over",
        },
        emojis: {
          xButton: "❌",
          oButton: "⭕",
          blankButton: "➖",
        },
        mentionUser: true,
        timeoutTime: 60000,
        xButtonStyle: "DANGER",
        oButtonStyle: "PRIMARY",
        turnMessage: "{emoji} | It's {player}'s turn.",
        winMessage: "{emoji} | **{player}** won the game!",
        tieMessage: "The game ended in a tie!",
        timeoutMessage: "The game ended due to inactivity.",
        playerOnlyMessage:
          "Only {player} and {opponent} can use these buttons.",
      });

      game.startGame();
      game.on("gameOver", () => {});
    } catch (error) {
    }
  },
};
