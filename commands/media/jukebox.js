const { exec } = require('child_process');
const { getVoiceConnection, joinVoiceChannel, entersState, VoiceConnectionStatus, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const fs = require('fs');  // Add this for file operations
const YT_DLP_PATH = 'yt-dlp.exe';
const queues = new Map();

module.exports = {
    name: '!jukebox',
    execute: async (message, args) => {
        console.log(`[!jukebox] Info: User "${message.author.username}" invoked command...`);

        let queue = queues.get(message.guild.id);
        if (!queue) {
            queue = {
                songs: [],
                skipVotes: new Set(),
                connection: null,
                player: createAudioPlayer(),
            };
            queues.set(message.guild.id, queue);
        }

        const voiceChannelId = message.member.voice.channelId;
        if (!voiceChannelId) {
            return message.reply("You must be in a voice channel to use this command!");
        }

        const connection = getVoiceConnection(message.guild.id);
        if (args[0] === 'leave') {
            if (connection) {
                connection.destroy();
                message.reply("I've disconnected from the voice channel.");
            } else {
                message.reply("I'm not in any voice channel right now!");
            }
            return;
        }

        if (args[0] === 'stop') {
            if (connection) {
                connection.destroy();
                message.reply("Stopped playing and disconnected from the voice channel.");
            } else {
                message.reply("I'm not playing anything right now!");
            }
            return;
        }

        if (args[0] === 'skip') {
            if (!queue.connection) return message.reply("Nothing is playing right now.");

            const totalMembers = message.member.voice.channel.members.size - 1; // Exclude the bot
            queue.skipVotes.add(message.author.id);
            const voteCount = queue.skipVotes.size;

            if (voteCount >= totalMembers / 2) {
                queue.player.stop();
                message.reply("The song has been skipped!");
            } else {
                message.reply(`Skip votes: ${voteCount}/${Math.ceil(totalMembers / 2)}`);
            }
            return;
        }

        if (args[0] === 'queue') {
            if (!queue.songs.length) return message.reply("The queue is empty.");
            const songsList = queue.songs.map((song, index) => `${index + 1}. ${song.title}`).join('\n');
            message.reply(`Current Queue:\n${songsList}`);
            return;
        }


        if (!args[0]) {
            if (connection && connection.joinConfig.channelId === voiceChannelId) {
                return message.reply("I'm already in this voice channel!");
            }

            const voiceConnection = joinVoiceChannel({
                channelId: voiceChannelId,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
            });

            const player = createAudioPlayer();
            voiceConnection.subscribe(player);
            return;
        }

        // Assume args[0] is a URL at this point
        const fileName = `./temp/juke-${message.author.id}_${Date.now()}.mp3`;

        console.log(`[!jukebox] Attempting to download audio from ${args[0]}...`);

        function playSong(queue, song) {
            // Shift the song from the queue right at the start
            queue.songs.shift();
            const stream = fs.createReadStream(song.file);
            const resource = createAudioResource(stream, { inlineVolume: true });
            resource.volume.setVolume(0.25);
            queue.player.play(resource);
            queue.player.once('idle', () => {
                console.log("Song finished. Cleaning up...");
                try {
                    fs.unlinkSync(song.file);
                    console.log("File deleted.");
                } catch (error) {
                    console.error(`Failed to delete file: ${error.message}`);
                }
                console.log("Song removed from queue.");
                if (queue.songs.length > 0) {
                    console.log("Playing next song...");
                    playSong(queue, queue.songs[0]);
                } else {
                    console.log("No more songs in the queue. Leaving channel.");
                    queue.connection.destroy();
                    queues.delete(queue.guildId);
                }
            });
        }        

        exec(`${YT_DLP_PATH} -x --audio-format mp3 -o "${fileName}" ${args[0]}`, async (error) => {           
            if (error) {
                console.error(`[!jukebox] Error downloading audio: ${error}`);
                return message.reply("An error occurred trying to download the audio.");
            }

            const song = {
                title: args[0], // this is a placeholder, ideally you'd get the actual song title from yt-dlp
                file: fileName,
            };
            if (queue.connection) {
                queue.songs.push(song);
                message.reply(`Added ${song.title} to the queue!`);
                return;
            } else {
                queue.connection = joinVoiceChannel({
                    channelId: voiceChannelId,
                    guildId: message.guild.id,
                    adapterCreator: message.guild.voiceAdapterCreator,
                });
                queue.connection.subscribe(queue.player);
                queue.songs.push(song);
                playSong(queue, queue.songs[0]);
                message.reply(`Now playing: ${song.title}`);
            }

        });
    }
};
