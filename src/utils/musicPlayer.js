const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    getVoiceConnection,
    VoiceConnectionStatus,
} = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');
const { Dynamic } = require("musicard");
const { AttachmentBuilder } = require('discord.js');

/**
 * Manages the state and playback logic for a single guild's music session.
 */
class MusicPlayer {
    /**
     * @param {import('discord.js').VoiceChannel} voiceChannel
     * @param {string} musicFolder Path to the directory containing music files
     */
    constructor(voiceChannel, musicFolder) {
        this.guildId = voiceChannel.guild.id;
        this.voiceChannelId = voiceChannel.id;
        this.musicFolder = musicFolder;
        this.audioPlayer = createAudioPlayer();
        this.songQueue = [];
        this.isPlaying = false;
        this.connection = null;
        this.textChannel = null;
        this.genre = "Music";
        this.currentMessage = null;

        this._setupListeners();
        this._setupAloneCheck(voiceChannel);
    }

    _setupListeners() {
        this.audioPlayer.on(AudioPlayerStatus.Idle, () => {
            if (this.connection) {
                this.playNextSong();
            }
        });

        this.audioPlayer.on('error', error => {
            console.error(`[MusicPlayer Error] Player error in ${this.guildId}: ${error.message}`);
            this.playNextSong();
        });
    }

    /**
     * Sets up a check to destroy the connection if the bot is alone.
     * @param {import('discord.js').VoiceChannel} voiceChannel
     */
    _setupAloneCheck(voiceChannel) {
        const checkIfAlone = setInterval(() => {
            const currentConnection = getVoiceConnection(this.guildId);
            if (currentConnection && voiceChannel.members.size === 1) {
                this.stop();
                clearInterval(checkIfAlone);
            }
        }, 15000);
    }


    _shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    _loadSongs() {
        try {
            const files = fs.readdirSync(this.musicFolder).filter(file => file.endsWith('.mp3'));
            this.songQueue = this._shuffleArray(files);
            if (this.songQueue.length === 0) {
                console.warn(`[MusicPlayer] No MP3 files found in ${this.musicFolder}`);
            }
        } catch (e) {
            console.error(`[MusicPlayer] Error reading music directory: ${e.message}`);
        }
    }

    /**
     * Starts the playback and joins the voice channel.
     * @param {import('discord.js').Guild} guild
     */
    start(guild, textChannel) {
        this.textChannel = textChannel;

        if (this.connection && this.connection.state.status !== VoiceConnectionStatus.Disconnected) {
            this.audioPlayer.unpause();
            return;
        }

        this.connection = joinVoiceChannel({
            channelId: this.voiceChannelId,
            guildId: this.guildId,
            adapterCreator: guild.voiceAdapterCreator,
        });

        this.connection.subscribe(this.audioPlayer);
        this.isPlaying = true;

        this.playNextSong(this.textChannel);

        this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
            try {
                await Promise.race([
                    this.connection.rejoin(),
                    new Promise((resolve, reject) => setTimeout(reject, 5000))
                ]);
            } catch (error) {
                this.stop();
                console.error(`Connection failed to rejoin for ${this.guildId}. Destroyed.`, error);
            }
        });
    }

    /**
     * Plays the next song in the queue or reloads the queue if empty.
     */
    async playNextSong(textChannel) {
        const channelToSend = textChannel || this.textChannel;

        if (this.songQueue.length === 0) {
            this._loadSongs();
        }

        if (this.songQueue.length === 0) {
            console.warn(`[MusicPlayer] Queue is empty after reload. Stopping player for ${this.guildId}.`);
            this.stop();
            return;
        }

        const song = this.songQueue.shift();
        const songPath = path.join(this.musicFolder, song);

    try {
        const resource = createAudioResource(songPath);
        this.audioPlayer.play(resource);

        const card = await Dynamic({
            thumbnailImage: "https://cdn.pixabay.com/photo/2019/08/11/18/27/icon-4399630_1280.png",
            backgroundColor: "#070707",
            name: song.replace('.mp3', ''),
            author: this.genre || "Music",
            progress: null,
        });

        const attachment = new AttachmentBuilder(card, { name: 'nowplaying.png' });

        if (channelToSend) {
                if (this.currentMessage) {
                    try {
                        await this.currentMessage.edit({
                            content: `🎶 **Now Playing:**`,
                            files: [attachment]
                        });
                    } catch (err) {
                        this.currentMessage = await channelToSend.send({
                            content: `🎶 **Now Playing:**`,
                            files: [attachment]
                        });
                    }
                } else {
                    this.currentMessage = await channelToSend.send({
                        content: `🎶 **Now Playing:**`,
                        files: [attachment]
                    });
                }
            }

        } catch (e) {
            console.error(`[MusicPlayer] Failed to play: ${song}`, e);
            this.playNextSong(channelToSend);
        }
    }

    /**
     * Stops playback and destroys the voice connection.
     */
    stop() {
        this.currentMessage = null;
        if (this.connection) {
            this.audioPlayer.stop();
            this.connection.destroy();
            this.connection = null;
        }
        this.isPlaying = false;
        const { client } = require('../index');
        if (client && client.musicPlayers) {
            client.musicPlayers.delete(this.guildId);
        }
    }
}

module.exports = MusicPlayer;