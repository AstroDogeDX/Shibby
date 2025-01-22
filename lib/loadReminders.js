const fs = require('fs').promises;
const path = require('path');

async function loadReminders(client) {
    try {
        const remindersPath = path.join(__dirname, '..', 'reminders.json');
        
        // Check if file exists
        try {
            await fs.access(remindersPath);
        } catch {
            // If file doesn't exist, create it with empty reminders
            await fs.writeFile(remindersPath, '{}');
            return;
        }

        const data = await fs.readFile(remindersPath, 'utf8');
        const reminders = JSON.parse(data);
        const now = Date.now();

        for (const [userId, reminder] of Object.entries(reminders)) {
            if (reminder.endTime > now) {
                const timeLeft = reminder.endTime - now;
                const timeout = setTimeout(async () => {
                    try {
                        const user = await client.users.fetch(userId);
                        await user.send("Your reminder is now!" + (reminder.message ? ` You wanted to be reminded to: "${reminder.message}"` : ''));
                        delete reminders[userId];
                        await fs.writeFile(remindersPath, JSON.stringify(reminders, null, 2));
                    } catch (error) {
                        console.error('Error sending reminder:', error);
                    }
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

        await fs.writeFile(remindersPath, JSON.stringify(reminders, null, 2));
    } catch (error) {
        console.error('Error loading reminders:', error);
        throw error; // Re-throw to be caught by the caller
    }
}

module.exports = loadReminders;