const fs = require('fs');
const path = require('path');

function saveReminders(reminders) {
    const remindersObj = {};
    for (const [userId, reminder] of reminders) {
        remindersObj[userId] = {
            endTime: reminder.endTime,
            message: reminder.message
        };
    }
    const remindersPath = path.join(__dirname, '..', 'reminders.json');
    fs.writeFileSync(remindersPath, JSON.stringify(remindersObj, null, 2));
}

module.exports = saveReminders;