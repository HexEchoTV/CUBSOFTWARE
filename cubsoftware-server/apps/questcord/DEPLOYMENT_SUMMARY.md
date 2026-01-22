# QuestCord v3 - Deployment Summary

## What Has Been Implemented

### ✅ 1. Startup Script (`start.js`)
A unified startup script that:
- Runs `npm install` automatically
- Deploys Discord slash commands
- Starts the bot and web server
- Handles graceful shutdowns
- Works seamlessly with PM2

**Usage:**
```bash
npm start  # Uses start.js
```

### ✅ 2. PM2 Configuration (`ecosystem.config.js`)
Enhanced PM2 configuration with:
- Auto-restart on crashes
- Memory limit (1GB max)
- Daily automatic restart at 3 AM
- Comprehensive logging
- Exponential backoff on rapid failures

**Usage:**
```bash
npm run pm2:start    # Start with PM2
npm run pm2:restart  # Restart
npm run pm2:logs     # View logs
```

### ✅ 3. Discord Reporting System
Comprehensive reporting to Discord channel `1404555278594342993`:

**Reports Include:**
- 🟢 **Startup Reports**: Bot version, server count, system info
- 📊 **Status Reports**: Every 6 hours with metrics
- ❌ **Error Reports**: Real-time error notifications with stack traces
- 📈 **Daily Summaries**: Midnight reports with 24h statistics
- 🔴 **Shutdown Reports**: Graceful shutdown notifications

**Metrics Tracked:**
- Commands executed
- Quests completed
- Bosses defeated
- Server/user counts
- Memory/CPU usage
- Error counts
- Uptime

**Integration:**
- All errors automatically reported
- Command execution tracked
- Integrated with shutdown handlers

### ✅ 4. `/restart` Command
Staff and Developer command to restart the bot:

```
/restart [reason]
```

**Features:**
- Permission-restricted (Staff/Developer only)
- Sends notification to reporting channel
- Graceful 5-second countdown
- Works with PM2 for automatic restart
- Logs who initiated restart and why

### ✅ 5. Rich Presence Cycling
Bot status cycles through commands every 2 minutes:

**Commands Shown:**
- /quests - View available quests
- /complete - Complete a quest
- /travel - Explore new servers
- /attack - Fight the boss
- /profile - View your stats
- /balance - Check your currency
- /leaderboard - See rankings
- /help - Get help
- /tutorial - Learn to play
- /boss - View boss status
- /rank - Check your rank

**Updates every 120 seconds (2 minutes)**

### ✅ 6. Documentation
Created comprehensive guides:
- `SETUP_GUIDE.md` - Complete VPS setup instructions
- `PM2_QUICK_REFERENCE.md` - PM2 command reference
- `.env.example` - Environment configuration template

## VPS Setup Instructions

### Step 1: Fix npm install Error

Your VPS needs:
1. **Node.js 20.x or higher** (you have 18.20.4)
2. **Build tools** (make, gcc, g++)

Run these commands on your VPS:

```bash
# Fix dpkg if needed
dpkg --configure -a

# Update system
apt-get update

# Install build tools
apt-get install -y build-essential python3 git

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Verify
node --version  # Should show v20.x.x

# Install PM2
npm install -g pm2
```

### Step 2: Setup QuestCord

```bash
cd ~/QuestCord-v3

# Create .env file (if not exists)
nano .env
```

Add your configuration:
```env
DISCORD_TOKEN=your_token_here
DISCORD_CLIENT_ID=your_client_id_here
WEB_PORT=3000
NODE_ENV=production
```

### Step 3: Start with PM2

```bash
# Start the bot
npm run pm2:start

# Save PM2 configuration
pm2 save

# Enable auto-start on boot
pm2 startup
# Run the command it provides
```

### Step 4: Verify

```bash
# Check status
pm2 status

# View logs
pm2 logs questcord

# Monitor
pm2 monit
```

## Exact PM2 Commands

```bash
# Start
npm run pm2:start

# Stop
npm run pm2:stop

# Restart
npm run pm2:restart

# View logs (live)
npm run pm2:logs

# Delete from PM2
npm run pm2:delete

# Status
pm2 status

# Save configuration
pm2 save

# Auto-start on reboot
pm2 startup
```

## Files Changed/Created

### New Files:
1. `start.js` - Main startup script
2. `src/utils/reportingSystem.js` - Discord reporting system
3. `src/bot/commands/restart.js` - Restart command
4. `SETUP_GUIDE.md` - Complete setup guide
5. `PM2_QUICK_REFERENCE.md` - PM2 reference
6. `DEPLOYMENT_SUMMARY.md` - This file
7. `.env.example` - Environment template

### Modified Files:
1. `ecosystem.config.js` - Enhanced PM2 config
2. `package.json` - Updated scripts
3. `src/index.js` - Integrated reporting system
4. `src/bot/events/ready.js` - Added rich presence cycling
5. `src/bot/events/interactionCreate.js` - Added command tracking
6. `src/bot/commands/help.js` - Added restart command

## What Happens When You Start

1. **start.js** executes:
   - Runs `npm install`
   - Deploys Discord commands
   - Starts bot from `src/index.js`

2. **src/index.js** initializes:
   - Database setup
   - Discord bot login
   - Reporting system
   - Quest & boss managers
   - Web server

3. **Reporting system** starts:
   - Sends startup notification to Discord
   - Schedules 6-hour status reports
   - Schedules daily summaries
   - Monitors for errors

4. **Rich presence** begins:
   - Updates every 2 minutes
   - Cycles through all commands

## Discord Notifications

All notifications go to:
- **Server**: `1404523107544469545`
- **Channel**: `1404555278594342993`
- **URL**: https://discord.com/channels/1404523107544469545/1404555278594342993

**You'll receive notifications for:**
- Bot starts/stops
- Errors and exceptions
- Status updates (every 6 hours)
- Daily summaries (midnight)
- Restarts (manual or automatic)

## Testing the Setup

After starting with PM2, test:

1. **Check bot is online in Discord**
2. **Check reporting channel for startup message**
3. **Run `/help` in Discord**
4. **Run `/restart test` (if you have staff/dev permissions)**
5. **Watch for rich presence changes every 2 minutes**

## Troubleshooting

### Bot won't start on VPS
- Check Node version: `node --version` (must be v20+)
- Check logs: `pm2 logs questcord`
- Check .env file exists and has correct values

### No Discord notifications
- Verify channel ID: `1404555278594342993`
- Verify guild ID: `1404523107544469545`
- Check bot has permission to send messages in that channel
- Check logs for reporting errors

### Commands not working
- Run: `npm run deploy` manually
- Restart bot: `npm run pm2:restart`

### PM2 not auto-starting on reboot
```bash
pm2 save
pm2 startup
# Run the command it outputs
```

## Next Steps

1. Fix Node.js version on VPS (critical)
2. Install build tools on VPS
3. Start bot with PM2
4. Monitor Discord reporting channel
5. Test `/restart` command
6. Verify rich presence is cycling

## Support

- Check `SETUP_GUIDE.md` for detailed instructions
- Check `PM2_QUICK_REFERENCE.md` for PM2 commands
- Monitor Discord reporting channel for real-time status
- Review PM2 logs: `pm2 logs questcord`

---

**Your bot is now configured for 24/7 operation with comprehensive monitoring and easy management!**
