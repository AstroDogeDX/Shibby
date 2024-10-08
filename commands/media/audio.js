const { exec } = require('child_process');
const fs = require('fs');
const YT_DLP_PATH = 'yt-dlp.exe';
const MAX_AUDIO_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB in bytes

module.exports = {
    name: '!audio',
    execute: async (message, args) => {
        console.info(`[!audio] Info: User "${message.author.username}" invoked command...`);
        let url = args.shift(); // Remove the first argument (URL)
        let isDM = false;
        let additionalContent = '';

        if (!url) {
            message.reply('Please provide a valid URL.');
            console.error(`[!audio] Error: No URL provided, command terminated.`);
            return;
        }

        // Check for -dm flag
        if (args.length > 0 && args[0].toLowerCase() === '-dm') {
            isDM = true;
            args.shift(); // Remove the -dm flag
        }

        // Join remaining args as additional content
        additionalContent = args.join(' ');

        url = url.split('&')[0];

        try {
            const statusMessage = await message.reply('Fetching URL details...');
            console.info(`[!audio] Info: Fetching URL details...`);

            // Get title and uploader using yt-dlp
            exec(`${YT_DLP_PATH} -j --no-playlist --skip-download --cookies-from-browser firefox "${url}"`, { maxBuffer: 10 * 1024 * 1024 }, async (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    statusMessage.edit('An error occurred while fetching URL details.');
                    console.error(`[!audio] Error: An error occured while fetching URL details. Command terminated.`);
                    return;
                }

                let title, uploader;
                try {
                    const audioData = JSON.parse(stdout);
                    title = audioData.title;
                    uploader = audioData.uploader;
                } catch (parseError) {
                    console.error('Error parsing JSON:', parseError);
                    console.warn(`[!audio] Warn: An error occured while parsing JSON, using fallback.`);
                    title = `${message.author.id}_${Date.now()}`;
                    uploader = 'Unknown';
                }

                const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '_'); // Sanitizing the title to make it file-safe
                const audioName = `./temp/${sanitizedTitle.slice(0, 24)}.ogg`; // Changed extension to .ogg

                await statusMessage.edit(`Downloading audio from "${title}" by ${uploader}...`);
                console.info(`[!audio] Info: Downloading audio: ${title} - ${uploader}`);

                exec(`${YT_DLP_PATH} -o ${audioName} -f "bestaudio[ext=ogg]/bestaudio/best" --no-playlist --audio-format vorbis --cookies-from-browser firefox "${url}"`, { maxBuffer: 10 * 1024 * 1024 }, async (err, stdout, stderr) => {
                    if (err) {
                        console.error(`exec error: ${err}`);
                        statusMessage.edit('An error occurred while downloading the audio.');
                        console.error(`[!audio] Error: An error occured while downloading the audio. Command terminated.`);
                        return;
                    }
                    const audioSize = fs.statSync(audioName).size;
                    if (audioSize > MAX_AUDIO_SIZE_BYTES) {
                        statusMessage.edit('The audio is too large to upload to Discord. Please select a shorter audio.');
                        console.error(`[!audio] Error: Audio is too large to upload. Command terminated.`);
                        fs.unlinkSync(audioName);  // Delete the audio file since it's too large
                        return;
                    }
                    await statusMessage.edit('Uploading audio...');
                    console.info(`[!audio] Info: Uploading audio...`);

                    const sendFunction = isDM ? message.author.send.bind(message.author) : message.channel.send.bind(message.channel);
                    sendFunction({ 
                        content: additionalContent ? formatMentions(additionalContent) : undefined,
                        files: [audioName] 
                    })
                        .then(() => {
                            fs.unlinkSync(audioName);  // Delete the audio file after sending it
                            statusMessage.delete().catch(error => console.error(`Couldn't delete status message because of: ${error}`));
                            message.delete().catch(error => console.error(`Couldn't delete original command message because of: ${error}`));
                            console.log(`[!audio] Success: Successfully completed audio task. Command terminated.`);
                        })
                        .catch(err => {
                            console.error(err);
                            statusMessage.edit('An error occurred while uploading the audio.');
                            fs.unlinkSync(audioName); // Ensure the file is deleted even if upload fails
                            statusMessage.delete().catch(error => console.error(`Couldn't delete status message because of: ${error}`));
                            message.delete().catch(error => console.error(`Couldn't delete original command message because of: ${error}`));
                            console.error(`[!audio] Error: An error occurred while uploading the audio. Command terminated.`);
                        });
                });
            });
        } catch (error) {
            console.error(error);
            message.reply('An error occurred.');
            message.delete().catch(error => console.error(`Couldn't delete original command message because of: ${error}`));
        }
    }
};

function formatMentions(content) {
    return content.replace(/<@!?(\d+)>|@(\d+)/g, '<@$1$2>');
}