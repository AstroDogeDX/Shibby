const fs = require('fs');
const bothelp = fs.readFileSync('./README.md', 'utf8');

module.exports = {
    name: '!help',
    execute: (message) => {
        message.author.send(bothelp);
        message.delete().catch(error => console.error(`Couldn't delete original command message because of: ${error}`));
    }
};