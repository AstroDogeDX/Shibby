# Shibby v0.3.0

🎈 **Fun Commands**
- `!hello` - Responds with "Hi!"
- `!goodbot` - Time to praise the bot!
- `!badbot` - If you need to scold the bot...

📺 **Media Commands**
- `!audio <url> [-dm] [additional text]` - Fetches audio from the provided URL and reuploads as a `.ogg` file
- `!video <url> [-dm] [additional text]` - Fetches video from the provided URL and reuploads as a `.mp4` file
- `!gif <url> [-dm] [additional text]` - Fetches video from the provided URL and converts to an animated `.gif` (max 20 secs)

  For all media commands:
  - `-dm`: Optional flag to send the output to your DM instead of the channel
  - `[additional text]`: Optional text to include with the media (can include mentions)
  
  Examples:
  - `!video https://example.com/video.mp4 Check this out @user!`
  - `!audio https://example.com/song.mp3 Great song!`
  - `!gif https://example.com/clip.mp4 -dm Funny moment from the stream`

🎲 **Random Number Commands**
- `!roll xdy` - Rolls `x` number of `y`-sided dice
  - Example: `!roll 1d20`
- `!flip` - Flips a coin. Will it be heads or tails?
- `!pick <option1> or <option2> [or <option3>...]` - Picks one thing from a supplied list
  - Example: `!pick chocolate cake or fruit candy or strawberry ice cream`

🛠️ **Utility Commands**
- `!timestamp <hh:mm> [dd/mm/yyyy] [utc+/-] [format]` - Generates a Discord timestamp code and provides a preview
  - `hh:mm` - Hours and minutes (required)
  - `dd/mm/yyyy` - Day, month, and year (optional, full year or just 2 digits are acceptable)
  - `utc+/-` - Define **your timezone** in UTC (optional, defaults to `UTC-0`)
  - `format` - Choose your desired date format (optional, defaults to `R`)
  
  Example: `!timestamp 20:30 25/10/23 +1 F`

- `!remind <time> [what]` - Sets a reminder
  - `<time>` - Duration in seconds (s), minutes (m), or hours (h) (required, max 24 hours)
  - `[what]` - What you want to be reminded about (optional)
  
  Additional commands:
  - `!remind check` - Check if you have a reminder and how long remains
  - `!remind cancel` - Cancel a set reminder if you have one

  Example: `!remind 60m Push Update to Shibby`

  Note: Reminders are currently only stored in memory and lost when the bot restarts, which happens frequently. Don't rely on this feature for critical reminders.