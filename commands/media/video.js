const { exec } = require('child_process');
const fs = require('fs');
const YT_DLP_PATH = 'yt-dlp.exe';
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB in bytes

function downloadAndUploadVideo(message, videoName, url, quality, statusMessage) {
    exec(`${YT_DLP_PATH} -o ${videoName} -f ${quality} --no-playlist --merge-output-format mp4 ${url}`, { maxBuffer: 10 * 1024 * 1024 }, async (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            statusMessage.edit('An error occurred while downloading the video.');
            return;
        }

        const videoSize = fs.statSync(videoName).size;
        if (videoSize > MAX_VIDEO_SIZE_BYTES) {
            if (quality === 'best') { // First attempt with best quality
                console.info(`[!video] Info: Video too large, trying lower quality...`);
                // Try to download at a lower quality
                downloadAndUploadVideo(message, videoName, url, 'worst', statusMessage);
            } else { // Second attempt with lowest quality
                statusMessage.edit('The video is too large to upload to Discord, even at lower quality.');
                console.error(`[!video] Error: Video is too large to upload, even at lower quality.`);
                fs.unlinkSync(videoName);  // Delete the video file since it's too large
            }
            return;
        }

        await statusMessage.edit('Uploading video...');
        message.channel.send({ files: [videoName] })
            .then(() => {
                fs.unlinkSync(videoName);  // Delete the video file after sending it
                statusMessage.delete().catch(error => console.error(`Couldn't delete status message because of: ${error}`));
                message.delete().catch(error => console.error(`Couldn't delete original command message because of: ${error}`));
                console.log(`[!video] Success: Successfully completed video task.`);
            })
            .catch(err => {
                console.error(err);
                statusMessage.edit('An error occurred while uploading the video.');
                fs.unlinkSync(videoName); // Ensure the file is deleted even if upload fails
                statusMessage.delete().catch(error => console.error(`Couldn't delete status message because of: ${error}`));
                message.delete().catch(error => console.error(`Couldn't delete original command message because of: ${error}`));
            });
    });
}

module.exports = {
    name: '!video',
    execute: async (message, args) => {
        console.info(`[!video] Info: User "${message.author.username}" invoked command...`);
        let url = args[0];

        if (!url) {
            message.reply('Please provide a valid URL.');
            console.error(`[!video] Error: No URL provided, command terminated.`);
            return;
        }

        url = url.split('&')[0]; // Strips out additional URL parameters for simplicity

        try {
            const statusMessage = await message.reply('Fetching video details...');
            console.log(`[!video] Info: Fetching URL details...`);

            // Get title and uploader using yt-dlp
            exec(`${YT_DLP_PATH} -j --no-playlist --skip-download ${url}`, { maxBuffer: 10 * 1024 * 1024 }, async (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    statusMessage.edit('An error occurred while fetching video details.');
                    return;
                }

                let videoData, title, uploader;
                try {
                    videoData = JSON.parse(stdout);
                    title = videoData.title;
                    uploader = videoData.uploader;
                } catch (parseError) {
                    console.error('Error parsing JSON:', parseError);
                    title = `${message.author.id}_${Date.now()}`;
                    uploader = 'Unknown';
                }

                const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '_'); // Sanitizing the title to make it file-safe
                const videoName = `./temp/${sanitizedTitle.slice(0, 24)}.mp4`;

                await statusMessage.edit(`Downloading video "${title}" by ${uploader}...`);
                // Start the download and upload process with the highest quality
                downloadAndUploadVideo(message, videoName, url, 'best[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]', statusMessage);
            });
        } catch (error) {
            console.error(error);
            message.reply('An error occurred.');
            message.delete().catch(err => console.error(`Couldn't delete original command message because of: ${err}`));
        }
    }
};