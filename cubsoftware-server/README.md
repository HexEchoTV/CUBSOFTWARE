# CubSoftware Server

Unified deployment for all CubSoftware applications.

## Architecture

```
cubsoftware-server/
├── apps/
│   ├── cubsoftware-website/       # Flask web app (port 3000)
│   ├── cubvault/                  # Password manager (API: 3001, Web: 3002)
│   ├── questcord/                 # Discord bot + web (port 3003)
│   └── streamerbot-commands/      # C# commands (documentation only)
├── config/                        # Configuration files
├── logs/                          # PM2 log files
├── nginx/                         # Nginx configuration
├── streamerbot-docs/              # StreamerBot website
├── cubsoftware.config.js          # PM2 configuration
├── start.sh / stop.sh / restart.sh
└── setup.sh
```

## Domain Configuration

| Domain | Service | Port |
|--------|---------|------|
| cubsoftware.site | CubSoftware Website | 3000 |
| questcord.fun | QuestCord Web | 3003 |
| cubvault.cubsoftware.site | CubVault Web + API | 3002/3001 |
| streamerbot.cubsoftware.site | StreamerBot Docs | static |
| questcord.cubsoftware.site | Redirect to questcord.fun | - |
| cubsoftware.site/questcord | Redirect to questcord.fun | - |

## Quick Start

### 1. Initial Setup

```bash
# Clone or copy this folder to your server
cd cubsoftware-server

# Make scripts executable
chmod +x *.sh

# Run setup (installs dependencies, configures nginx)
./setup.sh
```

### 2. Link Your Applications

```bash
# Create symlinks to your app folders
ln -s /path/to/cubsoftware-website apps/cubsoftware-website
ln -s /path/to/cubvault apps/cubvault
ln -s /path/to/questcord-v3 apps/questcord
```

### 3. Configure Environment Files

**CubVault (apps/cubvault/server/.env):**
```env
PORT=3001
NODE_ENV=production
DATABASE_URL="file:./cubvault.db"
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
FRONTEND_URL=https://cubvault.cubsoftware.site
```

**QuestCord (apps/questcord/.env):**
```env
DISCORD_TOKEN=your-bot-token
DISCORD_CLIENT_ID=your-client-id
DISCORD_CLIENT_SECRET=your-client-secret
SESSION_SECRET=your-session-secret
NODE_ENV=production
```

### 4. Start Everything

```bash
# Start all services
pm2 start cubsoftware.config.js

# Or use the convenience script
./start.sh

# Save PM2 process list (survives reboots)
pm2 save
```

## PM2 Commands

```bash
# Start all
pm2 start cubsoftware.config.js

# Stop all
pm2 stop all

# Restart all
pm2 restart all

# View status
pm2 status

# View logs (all)
pm2 logs

# View logs (specific service)
pm2 logs questcord

# Monitor dashboard
pm2 monit

# Delete all processes
pm2 delete all
```

## SSL Setup (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificates for all domains
sudo certbot --nginx -d cubsoftware.site -d www.cubsoftware.site
sudo certbot --nginx -d questcord.fun -d www.questcord.fun
sudo certbot --nginx -d cubvault.cubsoftware.site
sudo certbot --nginx -d questcord.cubsoftware.site
sudo certbot --nginx -d streamerbot.cubsoftware.site

# Auto-renewal test
sudo certbot renew --dry-run
```

## DNS Configuration

Configure these DNS records at your domain registrar:

**For cubsoftware.site:**
```
Type  Name                      Value
A     @                         YOUR_SERVER_IP
A     www                       YOUR_SERVER_IP
A     cubvault                  YOUR_SERVER_IP
A     questcord                 YOUR_SERVER_IP
A     streamerbot               YOUR_SERVER_IP
```

**For questcord.fun:**
```
Type  Name                      Value
A     @                         YOUR_SERVER_IP
A     www                       YOUR_SERVER_IP
```

## Troubleshooting

### Check if services are running
```bash
pm2 status
```

### View error logs
```bash
pm2 logs --err
```

### Check nginx configuration
```bash
sudo nginx -t
```

### Restart nginx
```bash
sudo systemctl restart nginx
```

### Check if ports are in use
```bash
sudo lsof -i :3000
sudo lsof -i :3001
sudo lsof -i :3002
sudo lsof -i :3003
```

## Services Overview

### CubSoftware Website (Port 3000)
- Flask/Gunicorn web application
- Music downloader & social media saver tools
- Python dependencies managed via pip

### CubVault API (Port 3001)
- Node.js/Express authentication server
- SQLite database with Prisma ORM
- JWT-based authentication

### CubVault Web (Port 3002)
- React web application
- Static files served via `serve`
- Connects to API on port 3001

### QuestCord (Port 3003)
- Discord.js bot (stateful, single instance)
- Express web dashboard
- WebSocket support for real-time updates
- SQLite database for game data
