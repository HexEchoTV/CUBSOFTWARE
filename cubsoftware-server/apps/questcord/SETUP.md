# QuestCord Setup Guide

## Quick Start

### 1. Install Node.js

Download and install Node.js 18 or higher from [nodejs.org](https://nodejs.org/)

Verify installation:
```bash
node --version
npm --version
```

### 2. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Name it "QuestCord"
4. Go to "Bot" section
5. Click "Add Bot"
6. Under "Privileged Gateway Intents", enable:
   - Server Members Intent
   - Message Content Intent
7. Click "Reset Token" and copy your bot token (save it securely)
8. Copy your Application ID from the "General Information" tab

### 3. Configure QuestCord

1. Navigate to your QuestCord directory
2. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

3. Edit `.env` and add your values:
```env
DISCORD_TOKEN=your_bot_token_from_step_2
DISCORD_CLIENT_ID=your_application_id_from_step_2
SUPPORT_SERVER_ID=1404523107544469545
OWNER_ID=your_discord_user_id
SESSION_SECRET=any_random_string_here
NODE_ENV=development
```

To get your Discord User ID:
- Enable Developer Mode in Discord (Settings > Advanced > Developer Mode)
- Right-click your username and select "Copy ID"

### 4. Install Dependencies

```bash
npm install
```

### 5. Register Commands

```bash
node src/bot/deploy-commands.js
```

You should see: "Successfully reloaded X application (/) commands."

### 6. Start QuestCord

For development:
```bash
npm run dev
```

For production:
```bash
npm start
```

### 7. Invite Bot to Your Server

Use this URL (replace YOUR_CLIENT_ID):
```
https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=2048&scope=bot%20applications.commands
```

Or use the invite link generator in Discord Developer Portal:
- Required permissions: Send Messages, Read Messages
- Scopes: bot, applications.commands

### 8. Enable Quests

In your Discord server, use:
```
/optin
```

This enables the quest system in your server.

### 9. Access Web Dashboard

Open your browser to:
```
http://localhost:3000
```

## Configuration Options

### Port Configuration

Edit `config.json`:
```json
{
  "port": 3000,           // Development port
  "productionPort": 80     // Production port
}
```

### Quest Settings

```json
{
  "quest": {
    "questsPerServer": 5,
    "rotationTime": "0 0 * * *"  // Cron schedule (midnight NZ time)
  }
}
```

### Boss Settings

```json
{
  "boss": {
    "maxConcurrent": 1,
    "spawnDuration": 3600000,      // 60 minutes in ms
    "cooldownDuration": 600000,    // 10 minutes in ms
    "minSpawnDelay": 1800000,      // 30 minutes in ms
    "maxSpawnDelay": 7200000       // 120 minutes in ms
  }
}
```

### Leaderboard Rewards

```json
{
  "leaderboard": {
    "resetDay": 1,
    "topRewards": {
      "1": { "currency": 10000, "gems": 100 },
      "2": { "currency": 5000, "gems": 50 },
      "3": { "currency": 2500, "gems": 25 }
    }
  }
}
```

## Production Deployment

### 1. Set Environment to Production

Edit `.env`:
```env
NODE_ENV=production
```

### 2. Use Process Manager

Install PM2:
```bash
npm install -g pm2
```

Start with PM2:
```bash
pm2 start src/index.js --name questcord
pm2 save
pm2 startup
```

### 3. Set Up Reverse Proxy (Optional)

If running on port 80 requires sudo, use nginx as reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then run QuestCord on port 3000.

### 4. Enable HTTPS (Recommended)

Use Let's Encrypt with certbot:
```bash
sudo certbot --nginx -d your-domain.com
```

## Troubleshooting

### Commands not showing up

1. Verify bot token is correct
2. Re-run command deployment: `node src/bot/deploy-commands.js`
3. Wait 5-10 minutes for Discord to update
4. Try kicking and re-inviting the bot

### Database errors

1. Ensure `data/` directory exists and is writable
2. Check logs for specific error messages
3. Database backups are in `backups/` directory

### Port already in use

Change port in `config.json` or kill process using port:

Windows:
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

Linux/Mac:
```bash
lsof -i :3000
kill -9 <PID>
```

### Website not loading

1. Check bot is running: Look for "Web server running on port 3000"
2. Verify firewall allows port 3000
3. Check browser console for errors
4. Try accessing via `http://127.0.0.1:3000`

## Support

For issues or questions, contact the developers through the support server.
