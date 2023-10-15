const reminders = new Map();

module.exports = {
    name: '!remind',
    execute: (message, args) => {
        if (args.length === 0) return message.reply("Please specify the time for the reminder.");

        if (args[0] === 'check') {
            if (!reminders.has(message.author.id)) {
                return message.reply("You don't have any active reminders.");
            }

            const reminder = reminders.get(message.author.id);
            const timeLeft = reminder.endTime - Date.now();
            const minutesLeft = Math.floor(timeLeft / (60 * 1000));
            const secondsLeft = Math.floor((timeLeft % (60 * 1000)) / 1000);
            return message.reply(`You have a reminder in ${minutesLeft} minutes and ${secondsLeft} seconds.`);
        }

        if (args[0] === 'cancel') {
            if (!reminders.has(message.author.id)) {
                return message.reply("You don't have any active reminders to cancel.");
            }

            clearTimeout(reminders.get(message.author.id).timeout);
            reminders.delete(message.author.id);
            return message.reply("Your reminder has been canceled.");
        }

        const regex = /^(\d+)(s|m|h)$/;
        const match = args[0].match(regex);

        if (!match) return message.reply("Invalid time format. Please use s, m, or h after the number.");

        const amount = parseInt(match[1]);
        const type = match[2];
        let ms;

        switch (type) {
            case 's':
                ms = amount * 1000;
                break;
            case 'm':
                ms = amount * 60 * 1000;
                break;
            case 'h':
                ms = amount * 60 * 60 * 1000;
                break;
        }

        if (ms > 24 * 60 * 60 * 1000) {
            return message.reply('Cannot set a reminder for more than 24 hours.');
        }

        // Getting the reminder message, if any
        const reminderMessage = args.slice(1).join(' ') || null;
        message.reply(`Reminder set for ${amount}${type} from now!` + (reminderMessage ? ` You wanted to be reminded to: "${reminderMessage}"` : ''));

        // Cancel any existing reminder for the user
        if (reminders.has(message.author.id)) {
            clearTimeout(reminders.get(message.author.id).timeout);
        }

        const reminderTimeout = setTimeout(() => {
            message.author.send("Your reminder is now!" + (reminderMessage ? ` You wanted to be reminded to: "${reminderMessage}"` : ''));
            reminders.delete(message.author.id);
        }, ms);

        reminders.set(message.author.id, { timeout: reminderTimeout, endTime: Date.now() + ms });
    }
};
