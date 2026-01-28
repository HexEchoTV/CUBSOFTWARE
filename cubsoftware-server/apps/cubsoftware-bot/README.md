# CUB SOFTWARE Discord Bot

Discord bot for managing the PM2 Dashboard whitelist and providing information about CUB SOFTWARE.

## Features

- **Whitelist Management**: Add/remove users from the PM2 Dashboard whitelist via Discord
- **PM2 Process Control**: Start, stop, restart processes directly from Discord
- **CUB SOFTWARE Info**: Information about all CUB SOFTWARE apps and services

## Setup

### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and name it "CUB SOFTWARE"
3. Go to the "Bot" section and click "Add Bot"
4. Copy the bot token
5. Enable these Privileged Gateway Intents:
   - Server Members Intent (optional)
   - Message Content Intent (optional)
6. Go to OAuth2 > URL Generator:
   - Select scopes: `bot`, `applications.commands`
   - Select bot permissions: `Send Messages`, `Embed Links`, `Use Slash Commands`
   - Copy the generated URL and use it to invite the bot to your server

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:
- `DISCORD_TOKEN`: Your bot token from step 1
- `CLIENT_ID`: Your application's Client ID
- `API_KEY`: Generate a secure random key (must match `pm2_config.json`)

### 3. Update PM2 Config

Edit `cubsoftware-server/apps/cubsoftware-website/data/pm2_config.json`:
```json
{
  "bot_api_key": "YOUR_SAME_API_KEY_FROM_ENV"
}
```

### 4. Install & Run

```bash
npm install
npm start
```

Or with PM2:
```bash
pm2 start ecosystem.config.js --only cubsoftware-bot
```

## Commands

### `/whitelist` (Owner Only)
- `/whitelist add @user` - Add a user to the whitelist
- `/whitelist remove @user` - Remove a user from the whitelist
- `/whitelist addid <id>` - Add a user by Discord ID
- `/whitelist removeid <id>` - Remove a user by Discord ID
- `/whitelist list` - Show all whitelisted users

### `/pm2` (Owner Only)
- `/pm2 status` - Show all PM2 process status
- `/pm2 restart <process>` - Restart a process
- `/pm2 stop <process>` - Stop a process
- `/pm2 start <process>` - Start a process

### `/cubsoftware` (Public)
- `/cubsoftware info` - Information about CUB SOFTWARE
- `/cubsoftware apps` - List all CUB SOFTWARE apps
- `/cubsoftware dashboard` - Get link to PM2 Dashboard

## Security

- Only bot owners (defined in `OWNER_IDS`) can use whitelist and PM2 commands
- API key authentication between bot and website
- All sensitive commands are ephemeral (only visible to the user)
