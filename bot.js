const Discord = require('discord.js');
const { DiscordAPIError } = require('discord.js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const getFiles = require('./lib/getFiles.js');
const clearDir = require('./lib/clearDir.js');
const loadReminders = require('./lib/loadReminders.js');

const YT_DLP_PATH = 'yt-dlp.exe';

const client = new Discord.Client({
    intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
        Discord.Intents.FLAGS.GUILD_VOICE_STATES
    ]
});

// Error handling utility function
const handleCommandError = (error, message, commandName) => {
    console.error(`Error executing command ${commandName}:`, error);
    
    let errorMessage = '❌ An unexpected error occurred. Please try again later.';
    
    if (error instanceof DiscordAPIError) {
        // Handle common Discord API errors
        switch (error.code) {
            case 50001:
                errorMessage = '❌ I don\'t have permission to do that!';
                break;
            case 50006:
                errorMessage = '❌ Cannot send an empty message.';
                break;
            case 50007:
                errorMessage = '❌ I cannot send you direct messages. Please enable DMs from server members.';
                break;
            case 50013:
                errorMessage = '❌ I don\'t have the required permissions to perform this action.';
                break;
            case 50034:
                errorMessage = '❌ You cannot edit this message.';
                break;
            case 50035:
                errorMessage = '❌ Invalid form body or invalid data provided.';
                break;
            case 10003:
            case 10004:
            case 10008:
                errorMessage = '❌ The target channel or message was not found.';
                break;
            case 30005:
                errorMessage = '❌ Maximum number of server roles reached.';
                break;
            case 40005:
                errorMessage = '❌ Request entity too large. Try with a smaller file.';
                break;
            default:
                errorMessage = `❌ Discord API Error: ${error.message}`;
        }
        
        // Log detailed API error information
        console.error('Discord API Error Details:', {
            code: error.code,
            status: error.httpStatus,
            method: error.method,
            path: error.path,
            requestData: error.requestData
        });
    } else {
        // For non-Discord API errors, log the stack trace
        console.error('Stack trace:', error.stack);
    }

    // Send error message to user
    message.reply({ 
        content: errorMessage,
        allowedMentions: { repliedUser: true }
    }).catch(err => {
        console.error('Failed to send error message to user:', err);
    });
};

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
    
    // Make sure the remind command is loaded before loading reminders
    if (client.commands.has('!remind')) {
        loadReminders(client).catch(error => {
            console.error('Failed to load reminders:', error);
        });
    } else {
        console.error('Warning: !remind command not found, skipping reminder loading');
    }
});

client.on('messageCreate', async message => {
    if (!message.content.startsWith('!') || message.author.bot) return;

    const args = message.content.split(' ');
    const commandName = args.shift().toLowerCase();

    if (!client.commands.has(commandName)) return;

    const command = client.commands.get(commandName);

    try {
        // Handle both Promise-based and regular commands
        await Promise.resolve(command.execute(message, args));
    } catch (error) {
        handleCommandError(error, message, commandName);
    }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});

client.login(TOKEN);