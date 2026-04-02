const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const path = require('path');
const MusicPlayer = require('../../utils/musicPlayer');

const GENRE_PATHS = {
    wgm: 'wgm',
    christmas: 'christmas',
    lofi: 'lofi',
    ncs: 'ncs',
    minecraft: 'minecraft',
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play shuffled music from a specific genre.')
        .setDMPermission(false)
        .addStringOption(option =>
            option.setName('genre')
                .setDescription('The type of music to play')
                .setRequired(true)
                .addChoices(
                    { name: 'White Girl Music', value: 'wgm' },
                    { name: 'Christmas', value: 'christmas' },
                    { name: 'Lofi', value: 'lofi' },
                    { name: 'No Copyright Sounds', value: 'ncs' },
                    { name: 'Minecraft', value: 'minecraft' }
                )),

    async execute(interaction, client) {
        const { member, guild, options } = interaction;
        const voiceChannel = member.voice.channel;
        const guildId = guild.id;
        const genre = options.getString('genre');
        const genreValue = options.getString('genre');

        const genreNames = {
            wgm: 'White Girl Music',
            christmas: 'Christmas',
            lofi: 'Lofi',
            ncs: 'No Copyright Sounds',
            minecraft: 'Minecraft'
        };

        await interaction.deferReply();

        if (!voiceChannel) {
            return interaction.editReply({ content: 'You need to be in a voice channel to use this command!', flags: [MessageFlags.Ephemeral] });
        }

        const musicFolder = path.resolve(__dirname, '..', '..', '..', 'assets', GENRE_PATHS[genre]);

        let player = client.musicPlayers.get(guildId);

        if (player) {
            if (player.voiceChannelId !== voiceChannel.id) {
                player.stop();
                player = null;
            } else {
                player.musicFolder = musicFolder;
                player.genre = genreNames[genreValue];
                player.songQueue = [];
                player.playNextSong(interaction.channel);
                return interaction.editReply({ content: `🔄 Switched genre to **${genre.toUpperCase()}**!` });
            }
        }

        try {
            if (!player) {
                player = new MusicPlayer(voiceChannel, musicFolder);
                client.musicPlayers.set(guildId, player);
            }

            player.genre = genreNames[genreValue];
            player.start(guild, interaction.channel);
            await interaction.editReply({ content: `🎵 Now playing **${genre.toUpperCase()}** playlist!` });

        } catch (error) {
            console.error(`Failed to start music player for ${guildId}:`, error);
            if (player) player.stop();
            await interaction.editReply({
                content: `❌ Could not start the music. Error: ${error.message}`
            });
        }
    }
};