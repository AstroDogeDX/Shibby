const fs = require('fs');
const path = require('path');

function loadReminders(client) {
    const remindersPath = path.join(__dirname, '..', 'reminders.json');
    if (fs.existsSync(remindersPath)) {
        const data = fs.readFileSync(remindersPath, 'utf8');
        const reminders = JSON.parse(data);
        const now = Date.now();

        for (const [userId, reminder] of Object.entries(reminders)) {
            if (reminder.endTime > now) {
                const timeLeft = reminder.endTime - now;
                const timeout = setTimeout(() => {
                    client.users.fetch(userId).then(user => {
                        user.send("Your reminder is now!" + (reminder.message ? ` You wanted to be reminded to: "${reminder.message}"` : ''));
                        delete reminders[userId];
                        fs.writeFileSync(remindersPath, JSON.stringify(reminders, null, 2));
                    });
                }, timeLeft);

                client.commands.get('!remind').reminders.set(userId, { 
                    timeout, 
                    endTime: reminder.endTime, 
                    message: reminder.message 
                });
            } else {
                delete reminders[userId];
            }
        }

        fs.writeFileSync(remindersPath, JSON.stringify(reminders, null, 2));
    }
}

module.exports = loadReminders;