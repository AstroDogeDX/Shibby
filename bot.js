const Discord = require('discord.js');
const client = new Discord.Client({
    intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MESSAGES
    ]
});

const { exec } = require('child_process');
const fs = require('fs');

const bothelp = fs.readFileSync('help.txt', 'utf8');

const dotenv = require('dotenv');
dotenv.config();

const TOKEN = process.env.BOT_TOKEN;
const YT_DLP_PATH = 'yt-dlp.exe';

client.once('ready', () => {
    console.log('Bot is online!');
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const args = message.content.split(' ');
    const command = args.shift().toLowerCase();

    if (command === '!help') {
        message.author.send(bothelp);
    }

    if (command === '!hello') {
        message.reply('Hello!');
    }

    if (command === '!goodbot') {
        message.reply('<a:inupet:905641258922434582>');
    }

    if (command === '!badbot') {
        message.reply('<:inusad:744694454979395684>');
    }

    if (command === '!roll') {
        if (args.length === 0) {
            return message.reply("Please provide arguments in the format xdy, where x is the number of dice and y is the number of sides.");
        }

        // Extract x and y from the format xdy
        const [x, y] = args[0].split('d').map(Number);

        if (isNaN(x) || isNaN(y) || x <= 0 || y <= 0) {
            return message.reply("Invalid format. Use **x**d**y**, where **x** is the number of dice and **y** is the number of sides.");
        }

        // Limit the number of dice to 10
        if (x > 10) {
            return message.reply("You can roll a maximum of 10 dice at a time.");
        }

        // Limit the number of sides to 100
        if (y > 100) {
            return message.reply("Dice can have a maximum of 100 sides.");
        }

        let results = [];
        let sum = 0;

        for (let i = 0; i < x; i++) {
            const roll = Math.floor(Math.random() * y) + 1;
            results.push(roll);
            sum += roll;
        }

        message.reply(`You rolled: ${results.join(', ')}\nTotal: ${sum}`);
    }

    if (command === '!flip') {
        // Generate a random number between 0 and 1
        const randomNumber = Math.random();

        let result;

        if (randomNumber < 0.00001) { // 0.001% chance for "edge coin"
            result = 'edge coin :o';
        } else if (randomNumber < 0.5) {
            result = 'heads';
        } else {
            result = 'tails';
        }

        message.reply(`You flipped: ${result}`);
    }

    if (command === '!video') {
        let url = args[0];

        if (!url) {
            message.reply('Please provide a valid URL.');
            return;
        }

        url = url.split('&')[0];

        try {
            const statusMessage = await message.reply('Fetching video details...');

            // Get title and uploader using yt-dlp
            exec(`${YT_DLP_PATH} -j --no-playlist --skip-download ${url}`, { maxBuffer: 10 * 1024 * 1024 }, async (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    statusMessage.edit('An error occurred while fetching video details.');
                    return;
                }

                const videoData = JSON.parse(stdout);
                const title = videoData.title;
                const uploader = videoData.uploader;

                const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '_'); // Sanitizing the title to make it file-safe
                const videoName = `${sanitizedTitle.slice(0, 24)}.mp4`;

                await statusMessage.edit(`Downloading video "${title}" by ${uploader}...`);

                exec(`${YT_DLP_PATH} -o ${videoName} -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]" --no-playlist --merge-output-format mp4 ${url}`, { maxBuffer: 10 * 1024 * 1024 }, async (err, stdout, stderr) => {
                    if (error) {
                        console.error(`exec error: ${error}`);
                        statusMessage.edit('An error occurred while downloading the video.');
                        return;
                    }
                    await statusMessage.edit('Uploading video...');
                    message.channel.send({ files: [videoName] })
                        .then(() => {
                            fs.unlinkSync(videoName);  // Delete the video file after sending it
                            statusMessage.delete().catch(error => console.error(`Couldn't delete status message because of: ${error}`));
                            message.delete().catch(error => console.error(`Couldn't delete original command message because of: ${error}`));
                        })
                        .catch(err => {
                            console.error(err);
                            statusMessage.edit('An error occurred while uploading the video.');
                            statusMessage.delete().catch(error => console.error(`Couldn't delete status message because of: ${error}`));
                            message.delete().catch(error => console.error(`Couldn't delete original command message because of: ${error}`));
                        });
                });
            });
        } catch (error) {
            console.error(error);
            message.reply('An error occurred.');
            message.delete().catch(error => console.error(`Couldn't delete original command message because of: ${error}`));
        }
    }

    if (command === '!audio') {
        let url = args[0];

        if (!url) {
            message.reply('Please provide a valid URL.');
            return;
        }

        url = url.split('&')[0];

        try {
            const statusMessage = await message.reply('Fetching URL details...');

            // Get title and uploader using yt-dlp
            exec(`${YT_DLP_PATH} -j --no-playlist --skip-download ${url}`, { maxBuffer: 10 * 1024 * 1024 }, async (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    statusMessage.edit('An error occurred while fetching URL details.');
                    return;
                }

                const videoData = JSON.parse(stdout);
                const title = videoData.title;
                const uploader = videoData.uploader;

                const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '_'); // Sanitizing the title to make it file-safe
                const audioName = `${sanitizedTitle.slice(0, 24)}.mp3`;

                await statusMessage.edit(`Downloading audio from "${title}" by ${uploader}...`);

                exec(`${YT_DLP_PATH} -o ${audioName} -f "bestaudio[ext=m4a]/best[ext=mp3]" --no-playlist --audio-format mp3 ${url}`, { maxBuffer: 10 * 1024 * 1024 }, async (err, stdout, stderr) => {
                    if (err) {
                        console.error(`exec error: ${err}`);
                        statusMessage.edit('An error occurred while downloading the audio.');
                        return;
                    }

                    await statusMessage.edit('Uploading audio...');
                    message.channel.send({ files: [audioName] })
                        .then(() => {
                            fs.unlinkSync(audioName);  // Delete the audio file after sending it
                            statusMessage.delete().catch(error => console.error(`Couldn't delete status message because of: ${error}`));
                            message.delete().catch(error => console.error(`Couldn't delete original command message because of: ${error}`));
                        })
                        .catch(err => {
                            console.error(err);
                            statusMessage.edit('An error occurred while uploading the audio.');
                            statusMessage.delete().catch(error => console.error(`Couldn't delete status message because of: ${error}`));
                            message.delete().catch(error => console.error(`Couldn't delete original command message because of: ${error}`));
                        });
                });
            });
        } catch (error) {
            console.error(error);
            message.reply('An error occurred.');
            message.delete().catch(error => console.error(`Couldn't delete original command message because of: ${error}`));
        }
    }


});

client.login(TOKEN);
