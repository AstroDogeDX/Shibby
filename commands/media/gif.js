const { exec } = require('child_process');
const fs = require('fs');
const YT_DLP_PATH = 'yt-dlp.exe';
const MAX_VIDEO_DURATION = 20; // 20 seconds

async function downloadAndConvertToGif(message, videoName, url, statusMessage) {
    // Download video
    const downloadCommand = `${YT_DLP_PATH} -o ${videoName} --no-playlist --merge-output-format mp4 --sponsorblock-remove sponsor,music_offtopic,outro --netrc-location ".netrc" --netrc "${url}"`;
    exec(downloadCommand, { maxBuffer: 10 * 1024 * 1024 }, async (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            statusMessage.edit('An error occurred while downloading the video.');
            return;
        }

        // Check video duration
        const durationCheckCommand = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${videoName}`;
        exec(durationCheckCommand, (error, stdout, stderr) => {
            const duration = parseFloat(stdout);
            if (duration > MAX_VIDEO_DURATION) {
                console.error('[!gif] Error: Video is too long!');
                statusMessage.edit('The video is too long. Please provide a video less than 20 seconds.');
                fs.unlinkSync(videoName);
                return;
            }

            // Convert to GIF
            const gifOutput = videoName.replace(/\.[^/.]+$/, '.gif'); // Replace extension with .gif
            const convertCommand = `ffmpeg -i ${videoName} -vf "fps=20,scale=320:-1:flags=lanczos" -c:v gif -f gif ${gifOutput}`;
            exec(convertCommand, (error, stdout, stderr) => {
                if (error) {
                    console.error(`[!gif] exec error: ${error}`);
                    statusMessage.edit('An error occurred while converting the video to GIF.');
                    fs.unlinkSync(videoName);
                    return;
                }

                // Send GIF
                message.channel.send({ files: [gifOutput] })
                    .then(() => {
                        fs.unlinkSync(videoName);  // Delete the original video file
                        fs.unlinkSync(gifOutput);  // Delete the GIF file
                        statusMessage.delete().catch(error => console.error(`Couldn't delete status message because of: ${error}`));
                        message.delete().catch(error => console.error(`Couldn't delete original command message because of: ${error}`));
                        console.log(`[!gif] Success: Successfully converted video to GIF.`);
                    })
                    .catch(err => {
                        console.error(err);
                        statusMessage.edit('An error occurred while uploading the GIF.');
                        fs.unlinkSync(videoName); // Ensure the video file is deleted even if upload fails
                        fs.unlinkSync(gifOutput); // Ensure the GIF file is deleted even if upload fails
                        statusMessage.delete().catch(error => console.error(`Couldn't delete status message because of: ${error}`));
                        message.delete().catch(error => console.error(`Couldn't delete original command message because of: ${error}`));
                    });
            });
        });
    });
}

module.exports = {
    name: '!gif',
    execute: async (message, args) => {
        console.info(`[!gif] Info: User "${message.author.username}" invoked command...`);
        let url = args[0];

        if (!url) {
            message.reply('Please provide a valid URL.');
            console.error(`[!gif] Error: No URL provided, command terminated.`);
            return;
        }

        url = url.split('&')[0]; // Strips out additional URL parameters for simplicity

        try {
            const statusMessage = await message.reply('Fetching video details...');
            console.log(`[!gif] Info: Fetching URL details...`);

            // Extract video title for the filename
            exec(`${YT_DLP_PATH} -j --no-playlist --skip-download --netrc-location ".netrc" --netrc "${url}"`, { maxBuffer: 10 * 1024 * 1024 }, async (error, stdout, stderr) => {
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
                const videoName = `./temp/${sanitizedTitle.slice(0, 24)}.mp4`; // Saving as .mp4 for downloading

                await statusMessage.edit(`Downloading and converting video "${title}"...`);
                downloadAndConvertToGif(message, videoName, url, statusMessage);
            });
        } catch (error) {
            console.error(error);
            message.reply('An error occurred.');
            message.delete().catch(err => console.error(`Couldn't delete original command message because of: ${err}`));
        }
    }
};
