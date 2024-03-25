# Shibby v0.2.1-AI_TEST

🤖 **AI Interaction**
- Shibby will respond to any message it is mentioned in (e.g. `@Shibby how are you today?`)
- Current limitations:
  - No recall - Shibby can't recall any previous messages or conversation threads.
  - No channel context - Shibby can't read any other channel messages, only the one that prompts it.
  - Only works when AI Server is Online - Will give an error if the server is offline.

🎈 **Fun Commands**
- `!hello` - Responds with "Hi!"
- `!goodbot` - Time to praise the bot!
- `!badbot` - If you need to scold the bot...

📺 **Media Commands**
- `!audio <url>` - Fetches video/audio from the provided URL and reuploads as a `.mp3`
- `!video <url>` - Fetches video from the provided URL and reuploads as a `.mp4`
- `!gif <url>` - Fetches video from the provided URL and converts as an animated `.gif` (max 20 secs)

🎲 **Random Number Commands**
- `!roll xdy` - Rolls `x` number of `y`-sided dice. (e.g., `!roll 1d20`)
- `!flip` - Flips a coin. Will it be heads or tails?
- `!pick this or that` - Picks one thing from a supplied list; type as many options as you want separated by 'or'.
  - Example: `!pick chocolate cake or fruit candy or strawberry ice cream`

🛠️ **Utility Commands**
- `!timestamp hh:mm` (Optional: `dd/mm/yyyy` `utc+/-` `format`)
  - Generates a Discord timestamp code and provides a preview.
  - Example: `!timestamp 20:30 25/10/23 +1 F`
    - `hh:mm` - Hours and minutes.
    - `dd/mm/yyyy` - Day, month, and year (full year or just 2 digits are acceptable).
    - `utc+/-` - Define **your timezone** in UTC (defaults to `UTC-0`).
    - `format` - Choose your desired date format. Defaults to `R` (e.g., "in 3 hours" or "10 minutes ago").
- `!remind <time>` (Optional `<what>`)
  - Example: `!remind 60m Push Update to Shibby`
  - Sets a reminder in seconds, minutes or hours. (`s`, `m` and `h` respectively)
  - Current maximum is **24 hours**.
  - `!remind check` will check if you have a reminder and how long remains.
  - `!remind cancel` will cancel a set reminder if you have one.
  - Can optionally include what it is you wanted to be reminded about.
    - Please note that reminders are currently only stored in memory and lost when the bot restarts, which right now is VERY OFTEN - so don't actually rely on this!