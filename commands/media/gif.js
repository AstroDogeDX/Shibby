const { exec } = require('child_process');
const fs = require('fs');
const YT_DLP_PATH = 'yt-dlp.exe';
const MAX_VIDEO_DURATION = 20; // 20 seconds

async function downloadAndConvertToGif(message, videoName, url, statusMessage, sendToDM, additionalContent, titleInfo) {
    // Download and convert to GIF using yt-dlp
    const downloadCommand = `${YT_DLP_PATH} -o ${videoName}.mp4 --no-playlist --sponsorblock-remove sponsor,music_offtopic,outro "${url}" && ffmpeg -i ${videoName}.mp4 -vf "fps=30,scale=-1:500:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -c:v gif -f gif ${videoName}.gif`;
    exec(downloadCommand, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            if (stderr.includes("Unable to download webpage")) {
                statusMessage.edit('Unable to access the video. The URL might be invalid or require authentication.');
            } else {
                statusMessage.edit('An error occurred while downloading and converting the video to GIF.');
            }
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

            const formattedMessage = `${additionalContent ? additionalContent + '\n' : ''}-# ${titleInfo}, requested by ${message.author.username}`;

            sendFunction({ 
                content: formattedMessage,
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

function formatMentions(content) {
    return content.replace(/<@!?(\d+)>|@(\d+)/g, '<@$1$2>');
}

module.exports = {
    name: '!gif',
    execute: async (message, args) => {
        console.info(`[!gif] Info: User "${message.author.username}" invoked command...`);
        let url = args.shift(); // Remove the first argument (URL)
        let isDM = false;
        let additionalContent = '';

        if (!url) {
            message.reply('Please provide a valid URL.');
            console.error(`[!gif] Error: No URL provided, command terminated.`);
            return;
        }

        // Check for -dm flag
        if (args.length > 0 && args[0].toLowerCase() === '-dm') {
            isDM = true;
            args.shift(); // Remove the -dm flag
        }

        // Join remaining args as additional content
        additionalContent = args.join(' ');

        // Replace 'x.com' with 'twitter.com'
        url = url.replace('x.com', 'twitter.com');
        url = url.split('&')[0];

        try {
            const statusMessage = await message.reply('Downloading and converting video...');
            console.log(`[!gif] Info: Starting download and conversion...`);

            // First get title and uploader info
            exec(`${YT_DLP_PATH} --print "%(title)s - %(uploader)s" --no-playlist "${url}"`, async (error, stdout, stderr) => {
                if (error) {
                    console.error(`Metadata error: ${error}`);
                    statusMessage.edit('An error occurred while fetching video details.');
                    return;
                }

                const titleInfo = stdout.trim() || 'Unknown - Unknown';
                const videoName = `./temp/${message.author.id}_${Date.now()}`;
                downloadAndConvertToGif(message, videoName, url, statusMessage, isDM, additionalContent, titleInfo);
            });
        } catch (error) {
            console.error(error);
            message.reply('An error occurred.');
            message.delete().catch(err => console.error(`Couldn't delete original command message because of: ${err}`));
        }
    }
};