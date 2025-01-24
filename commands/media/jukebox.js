const { exec } = require('child_process');
const { 
    getVoiceConnection, 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource,
    AudioPlayerStatus,
    NoSubscriberBehavior
} = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');
const YT_DLP_PATH = 'yt-dlp.exe';

// Store queues for each guild
const queues = new Map();

// Timeout handles for auto-disconnect
const disconnectTimeouts = new Map();

const DISCONNECT_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

// Ensure temp directory exists
const tempDir = path.join(__dirname, '../../temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

function createQueue(guildId) {
    const player = createAudioPlayer({
        behaviors: {
            noSubscriber: NoSubscriberBehavior.Play
        }
    });

    return {
        songs: [],
        connection: null,
        player: player,
        guildId: guildId,
        currentSong: null
    };
}

async function playSong(queue) {
    if (!queue.songs.length) {
        // No more songs to play
        startDisconnectTimeout(queue);
        return;
    }

    // Clear any existing disconnect timeout
    clearDisconnectTimeout(queue.guildId);

    const song = queue.songs[0];
    queue.currentSong = song;
    
    try {
        if (!fs.existsSync(song.file)) {
            console.error(`File not found: ${song.file}`);
            cleanupSong(queue);
            playSong(queue);
            return;
        }

        const resource = createAudioResource(song.file, {
            inlineVolume: true
        });
        
        resource.volume.setVolume(0.25);
        queue.player.play(resource);
    } catch (error) {
        console.error(`Error playing song: ${error}`);
        cleanupSong(queue);
        playSong(queue);
    }
}

function cleanupSong(queue) {
    if (queue.currentSong && queue.currentSong.file) {
        try {
            if (fs.existsSync(queue.currentSong.file)) {
                fs.unlinkSync(queue.currentSong.file);
            }
        } catch (error) {
            console.error(`Failed to delete file: ${error.message}`);
        }
    }
    queue.songs.shift();
    queue.currentSong = null;
}

function startDisconnectTimeout(queue) {
    const timeoutId = setTimeout(() => {
        if (queue.connection) {
            queue.connection.destroy();
            queues.delete(queue.guildId);
        }
    }, DISCONNECT_TIMEOUT);
    
    disconnectTimeouts.set(queue.guildId, timeoutId);
}

function clearDisconnectTimeout(guildId) {
    const timeoutId = disconnectTimeouts.get(guildId);
    if (timeoutId) {
        clearTimeout(timeoutId);
        disconnectTimeouts.delete(guildId);
    }
}

async function downloadSong(url, message) {
    const fileName = path.join(tempDir, `juke-${message.author.id}_${Date.now()}.mp3`);
    
    return new Promise((resolve, reject) => {
        // First get metadata
        exec(`${YT_DLP_PATH} --dump-json ${url}`, async (error, stdout, stderr) => {
            if (error || stderr) {
                console.error(`Metadata error: ${error || stderr}`);
                reject(new Error('Failed to fetch video metadata'));
                return;
            }

            try {
                const metadata = JSON.parse(stdout);
                const songTitle = `${metadata.title} - ${metadata.uploader}`;

                // Download the audio
                const downloadProcess = exec(`${YT_DLP_PATH} --no-playlist -x --audio-format mp3 -o "${fileName}" ${url}`);
                
                // Wait for the download to complete
                downloadProcess.on('close', (code) => {
                    if (code !== 0) {
                        reject(new Error('Failed to download audio'));
                        return;
                    }

                    // Add a small delay to ensure the file is fully written
                    setTimeout(() => {
                        // Verify the file exists before resolving
                        if (!fs.existsSync(fileName)) {
                            reject(new Error('Downloaded file not found'));
                            return;
                        }

                        resolve({
                            title: songTitle,
                            file: fileName
                        });
                    }, 1000); // 1 second delay
                });

                downloadProcess.stderr.on('data', (data) => {
                    console.error(`Download stderr: ${data}`);
                });
            } catch (error) {
                console.error(`JSON parse error: ${error}`);
                reject(error);
            }
        });
    });
}

module.exports = {
    name: '!jukebox',
    execute: async (message, args) => {
        console.log(`[!jukebox] Info: User "${message.author.username}" invoked command...`);

        // Check if user is in a voice channel
        const voiceChannelId = message.member.voice.channelId;
        if (!voiceChannelId) {
            return message.reply("You must be in a voice channel to use this command!");
        }

        // Get or create queue for this guild
        let queue = queues.get(message.guild.id);
        if (!queue) {
            queue = createQueue(message.guild.id);
            queues.set(message.guild.id, queue);
        }

        // Handle commands
        if (!args.length) {
            // Just join the voice channel if no arguments
            if (!queue.connection) {
                queue.connection = joinVoiceChannel({
                    channelId: voiceChannelId,
                    guildId: message.guild.id,
                    adapterCreator: message.guild.voiceAdapterCreator,
                });
                queue.connection.subscribe(queue.player);
                message.reply("Joined your voice channel!");
                
                // Start disconnect timeout if not playing anything
                if (!queue.currentSong) {
                    startDisconnectTimeout(queue);
                }
            } else {
                message.reply("I'm already in a voice channel!");
            }
            return;
        }

        const command = args[0].toLowerCase();

        switch (command) {
            case 'leave':
                if (queue.connection) {
                    queue.connection.destroy();
                    queues.delete(message.guild.id);
                    clearDisconnectTimeout(message.guild.id);
                    message.reply("Left the voice channel!");
                } else {
                    message.reply("I'm not in any voice channel!");
                }
                break;

            case 'stop':
                if (queue.player) {
                    queue.player.stop();
                    queue.songs = [];
                    cleanupSong(queue);
                    message.reply("Stopped playing and cleared the queue!");
                    startDisconnectTimeout(queue);
                } else {
                    message.reply("Nothing is playing right now!");
                }
                break;

            case 'skip':
                if (queue.currentSong) {
                    queue.player.stop();
                    message.reply("Skipped the current song!");
                } else {
                    message.reply("Nothing is playing right now!");
                }
                break;

            case 'queue':
                if (!queue.songs.length && !queue.currentSong) {
                    message.reply("The queue is empty!");
                    return;
                }
                
                let queueList = queue.currentSong ? `Now Playing: ${queue.currentSong.title}\n\n` : '';
                if (queue.songs.length) {
                    queueList += 'Up Next:\n' + queue.songs.map((song, index) => 
                        `${index + 1}. ${song.title}`
                    ).join('\n');
                }
                message.reply(queueList);
                break;

            default:
                // Assume it's a URL
                try {
                    const statusMsg = await message.reply("Processing your request...");
                    
                    try {
                        const song = await downloadSong(args[0], message);
                        
                        // Add song to queue
                        queue.songs.push(song);
                        
                        // If not connected, join voice channel
                        if (!queue.connection) {
                            queue.connection = joinVoiceChannel({
                                channelId: voiceChannelId,
                                guildId: message.guild.id,
                                adapterCreator: message.guild.voiceAdapterCreator,
                            });
                            queue.connection.subscribe(queue.player);
                        }
                        
                        statusMsg.edit(`Added to queue: ${song.title}`);
                        
                        // Delete the original command message
                        message.delete().catch(error => console.error(`Couldn't delete original command message because of: ${error}`));
                        
                        // If nothing is playing, start playing
                        if (!queue.currentSong) {
                            playSong(queue);
                        }
                    } catch (error) {
                        statusMsg.edit("Failed to process the URL. Make sure it's a valid video URL!");
                        console.error(`[!jukebox] Error: ${error.message}`);
                    }
                } catch (error) {
                    message.reply("An error occurred while processing your request.");
                    console.error(`[!jukebox] Error: ${error.message}`);
                }
                break;
        }

        // Set up player event handlers if not already set
        if (!queue.player.listenerCount(AudioPlayerStatus.Idle)) {
            queue.player.on(AudioPlayerStatus.Idle, () => {
                cleanupSong(queue);
                playSong(queue);
            });
        }
    }
};
