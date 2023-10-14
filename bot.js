// Import required modules
const Discord = require('discord.js');
const client = new Discord.Client({
    intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MESSAGES
    ]
});

const { exec } = require('child_process');
const fs = require('fs');

const dotenv = require('dotenv');
dotenv.config();

// Define your token here. Make sure to keep it secret!
const TOKEN = process.env.BOT_TOKEN;

const YT_DLP_PATH = 'yt-dlp.exe';

client.once('ready', () => {
    console.log('Bot is online!');
});

client.on('messageCreate', message => {
    // If the message is from a bot, ignore it
    if (message.author.bot) return;

    const args = message.content.split(' ');
    const command = args.shift().toLowerCase();

    // If the message content matches "!hello", reply with "Hello!"
    if (command === '!hello') {
        console.log("I saw hello!");
        message.reply('Hello!');
    }

    if (command === '!video') {
        const url = args[0];

        if (!url) {
            message.reply('Please provide a valid URL.');
            return;
        }

        try {
            message.reply('Downloading video...');
            const videoName = `video-${Date.now()}.mp4`;

            // Use yt-dlp executable to download the video
            exec(`${YT_DLP_PATH} -o ${videoName} -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]" --merge-output-format mp4 ${url}`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    message.reply('An error occurred while downloading the video.');
                    return;
                }
                message.reply('Uploading video...');
                message.channel.send({ files: [videoName] })
                    .then(() => {
                        fs.unlinkSync(videoName);  // Delete the video file after sending it
                        message.delete().catch(error => console.error(`Couldn't delete message because of: ${error}`));
                    })
                    .catch(err => {
                        console.error(err);
                        message.reply('An error occurred while uploading the video.');
                        message.delete().catch(error => console.error(`Couldn't delete message because of: ${error}`));
                    });
            });

        } catch (error) {
            console.error(error);
            message.reply('An error occurred.');
            message.delete().catch(error => console.error(`Couldn't delete message because of: ${error}`));
        }
    }
});

// Log in to Discord with the app's token
client.login(TOKEN);