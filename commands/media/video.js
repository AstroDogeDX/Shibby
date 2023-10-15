const { exec } = require('child_process');
const fs = require('fs');
const YT_DLP_PATH = 'yt-dlp.exe';

module.exports = {
    name: '!video',
    execute: async (message, args) => {
        let url = args[0];

        if (!url) {
            message.reply('Please provide a valid URL.');
            return;
        }

        url = url.split('&')[0];

        try {
            const statusMessage = await message.reply('Fetching video details...');

            // Get title and uploader using yt-dlp
            exec(`${YT_DLP_PATH} -j --no-playlist --skip-download ${url}`, { maxBuffer: 10 * 1024 * 1024 }, async (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    statusMessage.edit('An error occurred while fetching video details.');
                    return;
                }

                const videoData = JSON.parse(stdout);
                const title = videoData.title;
                const uploader = videoData.uploader;

                const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '_'); // Sanitizing the title to make it file-safe
                const videoName = `${sanitizedTitle.slice(0, 24)}.mp4`;

                await statusMessage.edit(`Downloading video "${title}" by ${uploader}...`);

                exec(`${YT_DLP_PATH} -o ${videoName} -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]" --no-playlist --merge-output-format mp4 ${url}`, { maxBuffer: 10 * 1024 * 1024 }, async (err, stdout, stderr) => {
                    if (error) {
                        console.error(`exec error: ${error}`);
                        statusMessage.edit('An error occurred while downloading the video.');
                        return;
                    }
                    await statusMessage.edit('Uploading video...');
                    message.channel.send({ files: [videoName] })
                        .then(() => {
                            fs.unlinkSync(videoName);  // Delete the video file after sending it
                            statusMessage.delete().catch(error => console.error(`Couldn't delete status message because of: ${error}`));
                            message.delete().catch(error => console.error(`Couldn't delete original command message because of: ${error}`));
                        })
                        .catch(err => {
                            console.error(err);
                            statusMessage.edit('An error occurred while uploading the video.');
                            statusMessage.delete().catch(error => console.error(`Couldn't delete status message because of: ${error}`));
                            message.delete().catch(error => console.error(`Couldn't delete original command message because of: ${error}`));
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