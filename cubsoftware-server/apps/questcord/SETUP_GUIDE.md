# QuestCord v3 - VPS Setup Guide

## Prerequisites

Before starting, ensure you have:
- A VPS running Ubuntu/Debian Linux
- Root or sudo access
- Discord Bot Token
- Basic knowledge of terminal commands

## Step 1: Fix dpkg (If Needed)

If you see a dpkg error, run:
```bash
dpkg --configure -a
```

## Step 2: Install Required Software

### Update System
```bash
apt-get update
apt-get upgrade -y
```

### Install Build Tools (Required for better-sqlite3)
```bash
apt-get install -y build-essential python3 git
```

### Install Node.js 20.x
QuestCord requires Node.js 20.x or higher due to better-sqlite3 requirements.

```bash
# Remove old Node.js if present (optional)
apt-get remove -y nodejs npm

# Install Node.js 20.x from NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x or higher
```

### Install PM2 (Process Manager)
```bash
npm install -g pm2
```

### Install Git (if not already installed)
```bash
apt-get install -y git
```

## Step 3: Clone and Setup QuestCord

### Navigate to your preferred directory
```bash
cd ~
```

### Clone your repository (if not already done)
```bash
git clone <your-repo-url> QuestCord-v3
cd QuestCord-v3
```

### Create Environment File
```bash
nano .env
```

Add the following (replace with your actual values):
```env
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here
WEB_PORT=3000
NODE_ENV=production
```

Save and exit (Ctrl+X, then Y, then Enter)

## Step 4: Initial Setup

The `start.js` script handles everything automatically:
1. Installs dependencies (npm install)
2. Deploys Discord commands
3. Starts the bot and web server

### Test Run (Development)
```bash
npm start
```

This will:
- Install all dependencies
- Deploy slash commands to Discord
- Start the bot and web server

If everything works, press Ctrl+C to stop.

## Step 5: Start with PM2 (24/7 Operation)

### Start the bot with PM2
```bash
npm run pm2:start
```

This command:
- Starts the bot using PM2
- Enables auto-restart on crashes
- Enables auto-start on server reboot
- Creates log files in `./logs/`

### Save PM2 Configuration
```bash
pm2 save
pm2 startup
```

Follow the instructions provided by `pm2 startup` to enable auto-start on boot.

## Step 6: Verify Everything is Working

### Check PM2 Status
```bash
pm2 status
```

You should see:
```
┌─────┬──────────────┬─────────────┬─────────┬─────────┬──────────┐
│ id  │ name         │ mode        │ status  │ cpu     │ memory   │
├─────┼──────────────┼─────────────┼─────────┼─────────┼──────────┤
│ 0   │ questcord    │ fork        │ online  │ 0%      │ 50.0mb   │
└─────┴──────────────┴─────────────┴─────────┴─────────┴──────────┘
```

### View Logs
```bash
npm run pm2:logs
```

or

```bash
pm2 logs questcord
```

### Monitor in Real-Time
```bash
npm run pm2:monit
```

## PM2 Commands Reference

| Command | Description |
|---------|-------------|
| `npm run pm2:start` | Start the bot with PM2 |
| `npm run pm2:stop` | Stop the bot |
| `npm run pm2:restart` | Restart the bot |
| `npm run pm2:delete` | Remove bot from PM2 |
| `npm run pm2:logs` | View logs |
| `npm run pm2:monit` | Monitor resources |
| `pm2 status` | Check bot status |
| `pm2 save` | Save PM2 configuration |

## Discord Reporting System

The bot automatically reports to Discord channel:
- **Channel ID**: `1404555278594342993`
- **Guild ID**: `1404523107544469545`

### Reports Include:
- ✅ Startup notifications
- 📊 Status reports every 6 hours
- ❌ Error reports (real-time)
- 📈 Daily summaries (midnight)
- 🔄 Shutdown notifications

## Bot Features

### 1. Automatic Startup Script (`start.js`)
- Runs `npm install` to ensure dependencies are current
- Deploys Discord slash commands
- Starts bot and web server

### 2. Rich Presence
- Cycles through bot commands every 2 minutes
- Shows users what commands they can use
- Commands included:
  - /quests, /complete, /travel, /attack
  - /profile, /balance, /leaderboard
  - /help, /tutorial, /boss, /rank

### 3. Restart Command
Staff and Developers can restart the bot using:
```
/restart [reason]
```

This command:
- Sends notification to reporting channel
- Gracefully shuts down the bot
- PM2 automatically restarts it

## Troubleshooting

### Bot Won't Start
```bash
# Check logs
pm2 logs questcord

# Check for errors in npm install
cd ~/QuestCord-v3
npm install
```

### Database Issues
```bash
# Check if database file exists
ls -la questcord.db

# If corrupted, backup and recreate
mv questcord.db questcord.db.backup
npm start  # Will recreate database
```

### Port Already in Use
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### PM2 Not Saving
```bash
pm2 save
pm2 startup
# Run the command it outputs
```

### Check Node Version
```bash
node --version  # Must be v20.x.x or higher
```

If it's not v20+, reinstall Node.js following Step 2.

## Security Recommendations

1. **Firewall Configuration**
```bash
# Allow SSH
ufw allow 22/tcp

# Allow web server (if needed externally)
ufw allow 3000/tcp

# Enable firewall
ufw enable
```

2. **Secure .env file**
```bash
chmod 600 .env
```

3. **Regular Updates**
```bash
apt-get update && apt-get upgrade -y
npm update
```

## Updating the Bot

### Pull Latest Changes
```bash
cd ~/QuestCord-v3
git pull

# PM2 will automatically restart
npm run pm2:restart
```

### Manual Update with Deployment
```bash
cd ~/QuestCord-v3
git pull
npm install
npm run deploy
npm run pm2:restart
```

## Monitoring

### Daily Health Check
```bash
pm2 status
pm2 logs questcord --lines 50
```

### Check Discord Reporting Channel
All important events are posted to your Discord reporting channel, including:
- Startup/shutdown events
- Errors and exceptions
- Performance metrics
- Daily summaries

## Need Help?

1. Check PM2 logs: `pm2 logs questcord`
2. Check Discord reporting channel for error reports
3. Review this guide
4. Check Node.js version compatibility

## Quick Start Commands (Summary)

```bash
# First time setup
dpkg --configure -a
apt-get update && apt-get install -y build-essential python3 git
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pm2

# Clone and setup
cd ~
git clone <your-repo-url> QuestCord-v3
cd QuestCord-v3
nano .env  # Add your environment variables

# Start with PM2
npm run pm2:start
pm2 save
pm2 startup  # Follow instructions

# Verify
pm2 status
pm2 logs questcord
```

Your bot should now be running 24/7!
