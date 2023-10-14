// Import required modules
const Discord = require('discord.js');
const client = new Discord.Client();

const dotenv = require('dotenv');
dotenv.config();



// Define your token here. Make sure to keep it secret!
const TOKEN = process.env.BOT_TOKEN;

client.once('ready', () => {
    console.log('Bot is online!');
});

client.on('message', message => {
    // If the message is from a bot, ignore it
    if (message.author.bot) return;

    // If the message content matches "!hello", reply with "Hello!"
    if (message.content.toLowerCase() === '!hello') {
        message.reply('Hello!');
    }
});

// Log in to Discord with the app's token
client.login(TOKEN);