# PM2 Quick Reference for QuestCord

## Essential Commands

### Starting & Stopping
```bash
npm run pm2:start      # Start the bot
npm run pm2:stop       # Stop the bot
npm run pm2:restart    # Restart the bot
npm run pm2:delete     # Remove from PM2
```

### Monitoring
```bash
npm run pm2:logs       # View logs (live)
npm run pm2:monit      # Real-time monitoring dashboard
pm2 status             # Check status
pm2 list               # List all PM2 processes
```

### Logs
```bash
pm2 logs questcord              # View all logs
pm2 logs questcord --lines 100  # Last 100 lines
pm2 logs questcord --err        # Error logs only
pm2 logs questcord --out        # Output logs only
pm2 flush questcord             # Clear log files
```

### Advanced
```bash
pm2 save              # Save current PM2 process list
pm2 startup           # Generate startup script
pm2 resurrect         # Restore saved processes
pm2 describe questcord # Detailed process info
```

## Bot Restart from Discord

Staff and Developers can restart the bot using the `/restart` command in Discord.

## Automatic Features

The ecosystem.config.js is configured with:
- ✅ Auto-restart on crash
- ✅ Daily restart at 3 AM (maintenance)
- ✅ Memory limit: 1GB (restarts if exceeded)
- ✅ Exponential backoff on rapid restarts
- ✅ Log rotation and timestamps

## Logs Location

All logs are stored in `./logs/`:
- `err.log` - Error output
- `out.log` - Standard output
- `combined.log` - Combined logs

## Checking if Bot is Running

```bash
pm2 status
```

Look for:
- Status: **online** ✅
- Uptime: Shows how long it's been running
- Restarts: Number of restarts (should be low)

## If Something Goes Wrong

1. **Check logs**
   ```bash
   pm2 logs questcord --lines 50
   ```

2. **Restart the bot**
   ```bash
   npm run pm2:restart
   ```

3. **Full reset**
   ```bash
   npm run pm2:delete
   npm run pm2:start
   pm2 save
   ```

4. **Check Discord reporting channel**
   - All errors are automatically reported
   - Channel: https://discord.com/channels/1404523107544469545/1404555278594342993

## Performance Monitoring

```bash
pm2 monit
```

Shows:
- CPU usage
- Memory usage
- Logs in real-time

Press `Ctrl+C` to exit.

## System Reboot

PM2 will automatically start the bot on system reboot if you've run:
```bash
pm2 startup
pm2 save
```

## Update and Restart

After pulling new code:
```bash
cd ~/QuestCord-v3
git pull
npm install
npm run pm2:restart
```

## Emergency Stop

If the bot is misbehaving:
```bash
pm2 stop questcord     # Stop it
pm2 logs questcord     # Check what happened
pm2 start questcord    # Start it again
```

---

**Note**: All commands assume you're in the QuestCord-v3 directory. If not:
```bash
cd ~/QuestCord-v3
```
