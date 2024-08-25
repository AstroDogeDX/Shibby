const { exec } = require('child_process');
const fs = require('fs');
const YT_DLP_PATH = 'yt-dlp.exe';
const MAX_VIDEO_DURATION = 20; // 20 seconds

async function downloadAndConvertToGif(message, videoName, url, statusMessage, sendToDM, customMessage) {
    // Download and convert to GIF using yt-dlp
    const downloadCommand = `${YT_DLP_PATH} -o ${videoName}.mp4 --no-playlist --sponsorblock-remove sponsor,music_offtopic,outro --cookies-from-browser firefox "${url}" && ffmpeg -i ${videoName}.mp4 -vf "fps=30,scale=-1:500:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -c:v gif -f gif ${videoName}.gif`;
    exec(downloadCommand, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            statusMessage.edit('An error occurred while downloading and converting the video to GIF.');
            fs.unlinkSync(videoName + '.mp4'); // Delete the original MP4 file
            return;
        }

        // Check video duration
        const durationCheckCommand = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${videoName}.mp4`;
        exec(durationCheckCommand, (error, stdout, stderr) => {
            const duration = parseFloat(stdout);
            if (duration > MAX_VIDEO_DURATION) {
                console.error('[!gif] Error: Video is too long!');
                statusMessage.edit('The video is too long. Please provide a video less than 20 seconds.');
                fs.unlinkSync(videoName + '.mp4'); // Delete the original MP4 file
                return;
            }

            // Send GIF
            let sendFunction;
            if (sendToDM) {
                sendFunction = message.author.send.bind(message.author);
            } else {
                sendFunction = message.channel.send.bind(message.channel);
            }

            let messageContent = sendToDM ? undefined : customMessage;
            sendFunction({ 
                content: messageContent,
                files: [videoName + '.gif'] 
            })
                .then(() => {
                    fs.unlinkSync(videoName + '.mp4');  // Delete the original MP4 file
                    fs.unlinkSync(videoName + '.gif');  // Delete the GIF file
                    statusMessage.delete().catch(error => console.error(`Couldn't delete status message because of: ${error}`));
                    message.delete().catch(error => console.error(`Couldn't delete original command message because of: ${error}`));
                    console.log(`[!gif] Success: Successfully converted video to GIF.`);
                })
                .catch(err => {
                    console.error(err);
                    statusMessage.edit('An error occurred while uploading the GIF.');
                    fs.unlinkSync(videoName + '.mp4'); // Ensure the MP4 file is deleted even if upload fails
                    fs.unlinkSync(videoName + '.gif'); // Ensure the GIF file is deleted even if upload fails
                    statusMessage.delete().catch(error => console.error(`Couldn't delete status message because of: ${error}`));
                    message.delete().catch(error => console.error(`Couldn't delete original command message because of: ${error}`));
                });
        });
    });
}

module.exports = {
    name: '!gif',
    execute: async (message, args) => {
        console.info(`[!gif] Info: User "${message.author.username}" invoked command...`);
        let url = args.shift(); // Remove the first argument (URL) from args
        let isDM = false;
        let customMessage = '';

        if (!url) {
            message.reply('Please provide a valid URL.');
            console.error(`[!gif] Error: No URL provided, command terminated.`);
            return;
        }

        // Check for '-dm' flag
        if (args.includes('-dm')) {
            isDM = true;
            args = args.filter(arg => arg !== '-dm');
        }
        
        // Process custom message if not sending to DM
        if (!isDM && args.length > 0) {
            customMessage = args.join(' ');
            
            // Handle user mentions
            const mentionRegex = /@(\S+)/g;
            customMessage = await Promise.all(customMessage.split(' ').map(async (word) => {
                if (mentionRegex.test(word)) {
                    const username = word.slice(1);
                    try {
                        const user = await message.guild.members.fetch({ query: username, limit: 1 });
                        if (user.first()) {
                            return `<@${user.first().id}>`;
                        }
                    } catch (error) {
                        console.error(`Error fetching user: ${error}`);
                    }
                }
                return word;
            }));
            customMessage = customMessage.join(' ');

            // Sanitize the custom message (excluding user mentions)
            customMessage = customMessage.replace(/[^a-zA-Z0-9\s<@>]/g, '');
        }

        url = url.split('&')[0]; // Strips out additional URL parameters for simplicity

        try {
            const statusMessage = await message.reply('Fetching video details...');
            console.log(`[!gif] Info: Fetching URL details...`);

            // Extract video title for the filename
            exec(`${YT_DLP_PATH} -j --no-playlist --skip-download --cookies-from-browser firefox "${url}"`, { maxBuffer: 10 * 1024 * 1024 }, async (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    statusMessage.edit('An error occurred while fetching video details.');
                    return;
                }

                let videoData, title, ext;
                try {
                    videoData = JSON.parse(stdout);
                    title = videoData.title;
                    ext = videoData.ext;
                } catch (parseError) {
                    console.error('Error parsing JSON:', parseError);
                    title = `${message.author.id}_${Date.now()}`;
                }

                const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '_'); // Sanitizing the title to make it file-safe
                const videoName = `./temp/${sanitizedTitle.slice(0, 24)}`; // Saving as .mp4 for downloading

                await statusMessage.edit(`Downloading and converting video "${title}"...`);
                downloadAndConvertToGif(message, videoName, url, statusMessage, isDM, customMessage);
            });
        } catch (error) {
            console.error(error);
            message.reply('An error occurred.');
            message.delete().catch(err => console.error(`Couldn't delete original command message because of: ${err}`));
        }
    }
};