module.exports = {
    name: '!flip',
    execute: (message) => {
        // Generate a random number between 0 and 1
        const randomNumber = Math.random();

        let result;

        if (randomNumber < 0.00001) { // 0.001% chance for "edge coin"
            result = 'edge coin :o';
        } else if (randomNumber < 0.5) {
            result = 'heads';
        } else {
            result = 'tails';
        }

        message.reply(`You flipped: ${result}`);
    }
};