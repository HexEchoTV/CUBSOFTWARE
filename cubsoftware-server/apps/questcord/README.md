# QuestCord v3

Discord quest bot with interactive gameplay, boss battles, and global leaderboards.

## Features

- 🎮 **Interactive Quests** - 5 quest types with unique mechanics (combat, gathering, exploration, delivery, social)
- 🐉 **Boss Battles** - Team up to defeat raid bosses for massive rewards
- 📈 **Progressive Difficulty** - Quests scale with your level for better rewards
- 🏆 **Global Leaderboards** - Compete monthly for top spots
- 💰 **Economy System** - Earn currency and gems to buy items
- ⚡ **Leveling System** - Gain XP and level up for bonuses

## Quick Start

### Prerequisites
- Node.js 20.x or higher
- Discord Bot Token

### Installation

```bash
# Clone repository
git clone https://github.com/ThortonEllmers/QuestCord-v3.git
cd QuestCord-v3

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your Discord credentials

# Deploy commands
npm run deploy

# Start bot
npm start
```

## VPS Deployment

### Step 1: System Setup

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs build-essential python3

# Install PM2
npm install -g pm2
```

### Step 2: Clone and Configure

```bash
# Clone repository
git clone https://github.com/ThortonEllmers/QuestCord-v3.git
cd QuestCord-v3

# Create and edit .env file
nano .env
```

Add to `.env`:
```
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
OWNER_ID=your_discord_user_id
NODE_ENV=production
```

### Step 3: Configure Firewall

```bash
# Enable firewall
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable

# Verify firewall status
ufw status
```

### Step 4: Kill Any Process Using Port 80

```bash
# Stop Nginx if installed
systemctl stop nginx
systemctl disable nginx

# Kill any process on port 80
fuser -k 80/tcp

# Verify port 80 is free
lsof -i :80
```

### Step 5: Start Bot with PM2

```bash
# Install dependencies and start
npm install
npm run pm2:start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command PM2 outputs

# Verify it's running
pm2 status
pm2 logs questcord --lines 50
```

### Step 6: Test the Website

```bash
# Test locally on VPS
curl http://localhost/health

# Test from outside (replace with your VPS IP)
curl http://YOUR_VPS_IP/health
```

Expected response:
```json
{"status":"ok","timestamp":1234567890,"service":"QuestCord Web Server"}
```

### Cloudflare Setup

1. Add A record pointing to your VPS IP
2. Set SSL/TLS mode to **Flexible**
3. Wait for DNS propagation (up to 5 minutes)
4. Access your site at https://yourdomain.com

## Commands

- `/quests` - View and accept quests
- `/attack` - Attack active boss
- `/profile` - View your stats
- `/balance` - Check currency/gems
- `/leaderboard` - Global rankings
- `/travel` - Find other servers
- `/help` - View all commands

## Troubleshooting

### Website Not Loading

**Issue:** Website doesn't load on VPS IP or domain

**Solutions:**

1. **Check if server is running:**
   ```bash
   pm2 status
   pm2 logs questcord --lines 50
   ```

2. **Verify port 80 is listening:**
   ```bash
   lsof -i :80
   # Should show node/PM2 listening on port 80
   ```

3. **Test health endpoint locally:**
   ```bash
   curl http://localhost/health
   # Should return: {"status":"ok",...}
   ```

4. **Check firewall:**
   ```bash
   ufw status
   # Should show: 80/tcp ALLOW Anywhere
   ```

5. **Check DigitalOcean firewall:**
   - Go to Networking → Firewalls in DigitalOcean dashboard
   - Ensure HTTP (80) and HTTPS (443) are allowed

6. **Restart everything:**
   ```bash
   fuser -k 80/tcp
   pm2 restart questcord
   pm2 logs questcord
   ```

### Port Already in Use

**Issue:** `EADDRINUSE` error when starting

**Solution:**
```bash
# Kill process using port 80
fuser -k 80/tcp

# Stop Nginx if running
systemctl stop nginx
systemctl disable nginx

# Restart bot
pm2 restart questcord
```

### Bot Works But Website Doesn't

**Issue:** Discord bot commands work but website times out

**Cause:** Usually firewall blocking port 80

**Solution:**
```bash
# Check if port is open externally
telnet YOUR_VPS_IP 80

# If connection refused, check:
# 1. UFW firewall
ufw allow 80/tcp
ufw reload

# 2. DigitalOcean firewall (in dashboard)
# 3. Server is binding to 0.0.0.0 (check PM2 logs)
```

### Cloudflare Issues

**Issue:** Domain shows 521 or 522 error

**Solutions:**

1. **Set SSL/TLS to Flexible:**
   - SSL/TLS → Overview → Choose "Flexible"

2. **Check DNS settings:**
   - DNS → A record should point to VPS IP
   - Proxy status should be ON (orange cloud)

3. **Wait for propagation:**
   - DNS changes can take 5-10 minutes

## License

ISC

## Authors

CUB and Scarlett
