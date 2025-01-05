const { exec } = require('child_process');
const fs = require('fs');
const YT_DLP_PATH = 'yt-dlp.exe';
const MAX_VIDEO_SIZE = "50M";

function downloadAndUploadVideo(message, videoName, url, statusMessage, sendToDM, additionalContent, clipTimeframe) {
    let clipParameters = clipTimeframe != null ? `--force-keyframes-at-cuts --download-sections "*${clipTimeframe}"` : "";
    const command = `${YT_DLP_PATH} -o ${videoName} --no-playlist ${clipParameters} -S "size:${MAX_VIDEO_SIZE}" --merge-output-format mp4 --cookies-from-browser firefox "${url}"`;

    exec(command, { maxBuffer: 10 * 1024 * 1024 }, async (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            statusMessage.edit('An error occurred while downloading the video.');
            return;
        }

        if (fs.statSync(videoName).size > 52428800) {
            console.error('[!video] Error: Video was still too big! (>50MB)');
            statusMessage.edit('I tried my best but the video was still too big to upload! <:inusad:744694454979395684>');
            fs.unlinkSync(videoName);
            return;
        }

        await statusMessage.edit('Uploading video...');
        let sendFunction;
        if (sendToDM) {
            sendFunction = message.author.send.bind(message.author);
        } else {
            sendFunction = message.channel.send.bind(message.channel);
        }

        sendFunction({ 
            content: additionalContent ? formatMentions(additionalContent) : undefined,
            files: [videoName] 
        })
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

function formatMentions(content) {
    return content.replace(/<@!?(\d+)>|@(\d+)/g, '<@$1$2>');
}


function convertTime(timeString) {
    if(timeString.includes(':')){
        let allTimes = timeString.split(':');
        let timeValueInSeconds = 0;

        if(allTimes.length > 3){
            console.log(`Time is longer than a day, time is invalid`);
            return NaN;
        }
        for(let i = 0; allTimes.length > i; i++){
            timeValueInSeconds += Number(allTimes[i]) * Math.pow(60, Math.abs(i - (allTimes.length - 1)));
        } 
        return timeValueInSeconds;
    }

    return Number(timeString);
}

module.exports = {
    name: '!video',
    execute: async (message, args) => {
        console.info(`[!video] Info: User "${message.author.username}" invoked command...`);
        let url = args.shift(); // Remove the first argument (URL)
        let isDM = false;
        let additionalContent = '';
        let clipTimeframe = null;


        if (!url) {
            message.reply('Please provide a valid URL.');
            console.error(`[!video] Error: No URL provided, command terminated.`);
            return;
        }

        // Gert Clip Parameters
        if (args.includes('-clip')) {
            let index = args.indexOf('-clip');
            if(args.length + 2 > index){
                let nextElement = args[index+1];
                let splitParanmeter = nextElement.split('-'); //parsing the input into numbers to ensure that no command line funny business happens
                if(splitParanmeter.length == 2){
                    let startTime = convertTime(splitParanmeter[0]);
                    let endTime = convertTime(splitParanmeter[1]);
                    if(!isNaN(startTime) && !isNaN(endTime) && startTime < endTime){
                        clipTimeframe = startTime + "-" + endTime;
                    }
                }
                args.splice(index, 2)
            }else{
                args.splice(index, 1)
            }

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

        url = url.split('&')[0]; // Strips out additional URL parameters for simplicity

        try {
            const statusMessage = await message.reply('Fetching video details...');
            console.log(`[!video] Info: Fetching URL details...`);

            // Get title and uploader using yt-dlp
            exec(`${YT_DLP_PATH} -j --no-playlist -S "size:${MAX_VIDEO_SIZE}" --merge-output-format mp4 --skip-download --cookies-from-browser firefox "${url}"`, { maxBuffer: 10 * 1024 * 1024 }, async (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    statusMessage.edit('An error occurred while fetching video details.');
                    return;
                }

                let videoData, title, uploader, ext;
                try {
                    videoData = JSON.parse(stdout);
                    title = videoData.title;
                    uploader = videoData.uploader;
                    ext = videoData.ext;
                } catch (parseError) {
                    console.error('Error parsing JSON:', parseError);
                    title = `${message.author.id}_${Date.now()}`;
                    uploader = 'Unknown';
                }

                const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '_'); // Sanitizing the title to make it file-safe
                const videoName = `./temp/${sanitizedTitle.slice(0, 24)}.${ext}`;

                await statusMessage.edit(`Downloading video "${title}" by ${uploader}...`);
                downloadAndUploadVideo(message, videoName, url, statusMessage, isDM, additionalContent, clipTimeframe);
            });
        } catch (error) {
            console.error(error);
            message.reply('An error occurred.');
            message.delete().catch(err => console.error(`Couldn't delete original command message because of: ${err}`));
        }
    }
};