module.exports = {
    name: '!pick',
    execute: (message, args) => {
        // Check if there are enough arguments
        if (args.length < 2) {
            return message.reply("Please provide at least two options separated by 'or'.");
        }

        // Rejoin the args and then split by ' or ' to handle multi-word choices
        const choices = args.join(' ').split(' or ').map(choice => choice.trim());

        // Randomly select a choice
        const randomChoice = choices[Math.floor(Math.random() * choices.length)];

        message.reply(`I pick: **${randomChoice}**!`);
    }
};
