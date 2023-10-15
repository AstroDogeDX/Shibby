const fs = require('fs');
const bothelp = fs.readFileSync('help.txt', 'utf8');

module.exports = {
    name: '!help',
    execute: (message) => {
        message.author.send(bothelp);
    }
};