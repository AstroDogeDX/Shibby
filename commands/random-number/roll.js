module.exports = {
    name: '!roll',
    execute: (message, args) => {
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
};