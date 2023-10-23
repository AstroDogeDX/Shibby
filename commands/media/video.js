const { exec } = require('child_process');
const fs = require('fs');
const YT_DLP_PATH = 'yt-dlp.exe';
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB in bytes

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

        url = url.split('&')[0];

        try {
            const statusMessage = await message.reply('Fetching video details...');
            console.log(`[!video] Info: Fetching URL details...`);

            // Get title and uploader using yt-dlp
            exec(`${YT_DLP_PATH} -j --no-playlist --skip-download ${url}`, { maxBuffer: 10 * 1024 * 1024 }, async (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    statusMessage.edit('An error occurred while fetching video details.');
                    console.error(`[!video] Error: An error occured while fetching URL details. Command terminated.`);
                    return;
                }
            
                let title, uploader;
                try {
                    const videoData = JSON.parse(stdout);
                    title = videoData.title;
                    uploader = videoData.uploader;
                } catch (parseError) {
                    console.error('Error parsing JSON:', parseError);
                    console.warn(`[!video] Warn: An error occured while parsing JSON, using fallback.`);
                    title = `${message.author.id}_${Date.now()}`;
                    uploader = 'Unknown';
                }
            
                const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '_'); // Sanitizing the title to make it file-safe
                const videoName = `./temp/${sanitizedTitle.slice(0, 24)}.mp4`;
            
                await statusMessage.edit(`Downloading video "${title}" by ${uploader}...`);
                console.info(`[!video] Info: Downloading video: ${title} - ${uploader}`);

                exec(`${YT_DLP_PATH} -o ${videoName} -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]" --no-playlist --merge-output-format mp4 ${url}`, { maxBuffer: 10 * 1024 * 1024 }, async (err, stdout, stderr) => {
                    if (error) {
                        console.error(`exec error: ${error}`);
                        statusMessage.edit('An error occurred while downloading the video.');
                        console.error(`[!video] Error: An error occured while downloading the video. Command terminated.`);
                        return;
                    }
                    const videoSize = fs.statSync(videoName).size;
                    if (videoSize > MAX_VIDEO_SIZE_BYTES) {
                        statusMessage.edit('The video is too large to upload to Discord. Please select a shorter video.');
                        console.error(`[!video] Error: Video is too large to upload. Command terminated.`);
                        fs.unlinkSync(videoName);  // Delete the video file since it's too large
                        return;
                    }
                    await statusMessage.edit('Uploading video...');
                    console.info(`[!video] Info: Uploading video...`);
                    message.channel.send({ files: [videoName] })
                        .then(() => {
                            fs.unlinkSync(videoName);  // Delete the video file after sending it
                            statusMessage.delete().catch(error => console.error(`Couldn't delete status message because of: ${error}`));
                            message.delete().catch(error => console.error(`Couldn't delete original command message because of: ${error}`));
                            console.log(`[!video] Success: Successfully completed video task. Command terminated.`);
                        })
                        .catch(err => {
                            console.error(err);
                            statusMessage.edit('An error occurred while uploading the video.');
                            statusMessage.delete().catch(error => console.error(`Couldn't delete status message because of: ${error}`));
                            message.delete().catch(error => console.error(`Couldn't delete original command message because of: ${error}`));
                            console.error(`[!video] Error: An error occured while uploading the video. Command terminated.`);
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