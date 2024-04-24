const fs = require('fs');

module.exports = {
    name: '!help',
    execute: (message) => {
        message.author.send(`You can find comprehensive and up-to-date documentation on the bot's GitHub page: https://github.com/AstroDogeDX/Shibby/blob/main/README.md`);
        message.delete().catch(error => console.error(`Couldn't delete original command message because of: ${error}`));
    }
};