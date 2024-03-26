const Discord = require('discord.js');
const dotenv = require('dotenv');
const axios = require('axios').default;
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

client.on('messageCreate', async message => {
    if (message.author.bot) {
        return;
    };

    if (message.content.startsWith('!')) { // If it's a plain command.
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
        return;
    }

    else if (message.mentions.has(client.user.id)) { // If the bot has been mentioned, go AI mode.
        await message.channel.sendTyping();  // Discord reports that the Bot is Typing while waiting for a response from LLM server

        try {
            // Send request to your LLM server
            const response = await axios({
                method: "post",
                url: process.env.LLM_SERVER_URL,   // URL of your LLM server
                data: {
                    messages: [
                        { "role": "system", "content": process.env.LLM_SYSTEM_PROMPT },
                        { "role": "user", "content": message.content }
                    ],
                    temperature: 0.7,
                    max_tokens: -1,
                    stream: false
                },
                headers: { 'Content-Type': 'application/json' }
            });

            // Process the response from LLM server and send it back to Discord
            let aiResponse = response.data.choices[0].message.content;

            await message.channel.send(aiResponse);  // Reply back to the prompt with the result from LLM server
        } catch (error) {
            console.log('Error:', error);
            message.reply(`My AI brain is offline - only !commands are available.`);
        }
    }
});

client.login(TOKEN);
