const Discord = require('discord.js');
const dotenv = require('dotenv');
const fs = require('fs');
const { exec } = require('child_process');

const getFiles = require('./lib/getFiles.js');
const clearDir = require('./lib/clearDir.js');

const YT_DLP_PATH = 'yt-dlp.exe';

const client = new Discord.Client({
    intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
        Discord.Intents.FLAGS.GUILD_VOICE_STATES
    ]
});

dotenv.config();

const TOKEN = process.env.BOT_TOKEN;

exec(`${YT_DLP_PATH} -U`);

if (!fs.existsSync('./temp/')) {
    fs.mkdirSync('./temp/');
} else {
    clearDir('./temp/');
}

client.commands = new Discord.Collection();
const commandFiles = getFiles('./commands');

for (const file of commandFiles) {
    const command = require(`./${file}`);
    client.commands.set(command.name, command);
};

client.once('ready', () => {
    console.log('Bot is online!');
});

client.on('messageCreate', message => {
    if (!message.content.startsWith('!') || message.author.bot) return;

    const args = message.content.split(' ');
    const commandName = args.shift().toLowerCase();

    if (!client.commands.has(commandName)) return;

    const command = client.commands.get(commandName);

    try {
        command.execute(message, args);
    } catch (error) {
        console.error(error);
        message.reply('There was an error executing that command!');
    }
});

client.login(TOKEN);
