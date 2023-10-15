module.exports = {
    name: '!timestamp',
    execute: (message, args) => {
        if (args.length < 1) {
            return message.reply("Please provide at least the time (hhmm or hh:mm).");
        }

        let currentDate = new Date();
        const timeInput = args[0];

        // Set defaults
        let dateInput = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`;
        let utcOffset = '0';
        let formatModifier = 'R';

        let valid = true; // Assume input is valid initially

        const timeRegex = /^(?:[01]\d|2[0-3]):?[0-5]\d$/;
        const dateRegex = /^\d{2}[/:]\d{2}[/:]\d{2,4}$/;
        const utcOffsetRegex = /^[+-]\d+$/;
        const formatModifierRegex = /^[tTdDfFR]$/;
        
        if (!timeRegex.test(args[0])) {
            valid = false; // Time format is invalid
        }
        
        for (let i = 1; i < args.length; i++) {
            const arg = args[i];
        
            if (utcOffsetRegex.test(arg)) {
                utcOffset = arg;
            } else if (dateRegex.test(arg)) {
                dateInput = arg;
            } else if (formatModifierRegex.test(arg)) {
                formatModifier = arg;
            } else {
                valid = false; // Argument format is invalid or unexpected extra input
            }
        }
        
        // If any format was invalid, send a rejection message
        if (!valid) {
            return message.reply("Invalid input or unexpected extra input. Please check the command format.");
        }

        const [hours, minutes] = timeInput.includes(':') ? timeInput.split(':') : [timeInput.slice(0, 2), timeInput.slice(2, 4)];
        let [day, month, year] = dateInput.includes('/') ? dateInput.split('/') : dateInput.split(':');
        
        if (year && year.length === 2) {
            year = '20' + year;
        }
        
        // Adjust hours based on the UTC offset before the UTC date creation
        const adjustedHours = parseInt(hours, 10) - Number(utcOffset);
        const dt = new Date(Date.UTC(year, month - 1, day, adjustedHours, minutes));
        
        const unixTimestamp = Math.floor(dt.getTime() / 1000);
        
        const output = `Here's your timestamp: \\<t:${unixTimestamp}:${formatModifier}> <t:${unixTimestamp}:${formatModifier}>`;
        message.reply(output);
        
    }
};
