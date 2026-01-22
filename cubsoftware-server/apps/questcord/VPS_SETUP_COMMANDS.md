# Complete VPS Setup - Copy/Paste These Commands

## Run These Commands on Your VPS (In Order):

### 1. Stop Everything
```bash
systemctl stop nginx
pm2 delete questcord
```

### 2. Go to Project
```bash
cd ~/QuestCord-v3
```

### 3. Pull Latest Code
```bash
git pull
```

### 4. Verify Config
```bash
cat config.json | grep productionPort
```
Should show: `"productionPort": 80,`

### 5. Install & Deploy
```bash
npm install
node src/bot/deploy-commands.js
```

### 6. Start Bot on Port 80
```bash
npm run pm2:start
```

### 7. Save PM2
```bash
pm2 save
```

### 8. Verify It's Running
```bash
pm2 status
lsof -i :80
```

Should show PM2 process on port 80.

### 9. Test Website
```bash
curl http://localhost:80
```

Should return HTML.

### 10. Test in Browser
Open: **https://questcord.fun**

Should work with full styling!

---

## If It Still Doesn't Work:

```bash
# Check logs
pm2 logs questcord --lines 50

# Check what's on port 80
lsof -i :80

# Kill anything on port 80 that's not PM2
fuser -k 80/tcp
pm2 restart questcord

# Check Cloudflare DNS (should show Cloudflare IPs)
dig questcord.fun +short
```

---

## Cloudflare Settings

Make sure:
1. DNS: A record @ → YOUR_IP (orange cloud ON)
2. SSL/TLS: Flexible mode
3. Always Use HTTPS: ON

---

## Auto-Start on Reboot

```bash
pm2 startup
# Run the command it outputs
pm2 save
```

---

## Expected Result

- `https://questcord.fun` → Works with styling ✅
- No port number needed ✅
- Cloudflare handles HTTPS ✅
- Bot runs on port 80 ✅
- Auto-restarts on crash ✅
- Auto-starts on reboot ✅
