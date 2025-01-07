module.exports = {
    name: '!notify',
    execute: async (message, args) => {
        console.info(`[!notify] Info: User "${message.author.username}" invoked command...`);
        
        // Check if 'Ping' role exists in the server
        const pingRole = message.guild.roles.cache.find(role => role.name === 'Ping');
        if (!pingRole) {
            console.error(`[!notify] Error: 'Ping' role not found in server ${message.guild.name}`);
            message.delete().catch(error => 
                console.error(`Couldn't delete command message because of: ${error}`)
            );
            return;
        }

        const member = message.member;
        
        try {
            if (member.roles.cache.has(pingRole.id)) {
                // Remove role if user has it
                await member.roles.remove(pingRole);
                await message.channel.send(`${message.author}, you will no longer be notified.`)
                    .then(msg => {
                        setTimeout(() => msg.delete(), 5000);
                    });
                console.log(`[!notify] Success: Removed 'Ping' role from ${message.author.username}`);
            } else {
                // Add role if user doesn't have it
                await member.roles.add(pingRole);
                await message.channel.send(`${message.author}, you will now be notified.`)
                    .then(msg => {
                        setTimeout(() => msg.delete(), 5000);
                    });
                console.log(`[!notify] Success: Added 'Ping' role to ${message.author.username}`);
            }
            
            // Delete the command message
            message.delete().catch(error => 
                console.error(`Couldn't delete command message because of: ${error}`)
            );
            
        } catch (error) {
            console.error(`[!notify] Error: ${error}`);
            message.reply('An error occurred while managing your role.')
                .then(msg => {
                    setTimeout(() => msg.delete(), 5000); // Delete error message after 5 seconds
                });
        }
    }
};
