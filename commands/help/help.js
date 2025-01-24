const fs = require('fs');

module.exports = {
    name: '!help',
    execute: async (message) => {
        const helpMessage = await message.channel.send(`Hi ${message.author}, you can find all of my commands here: https://github.com/AstroDogeDX/Shibby/blob/main/README.md\n-# This message will auto-delete in 10 seconds`);
        
        // Delete both messages after 10 seconds
        setTimeout(() => {
            helpMessage.delete().catch(error => console.error(`Couldn't delete help message because of: ${error}`));
            message.delete().catch(error => console.error(`Couldn't delete original command message because of: ${error}`));
        }, 10000);
    }
};