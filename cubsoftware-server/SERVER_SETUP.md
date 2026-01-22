# Server Setup Guide

## Quick Start

Run one command to install everything and start all services:

```bash
chmod +x install.sh
./install.sh
```

This will:
1. Install Python dependencies for CubSoftware Website
2. Install Node.js dependencies for CubVault
3. Install Node.js dependencies for QuestCord
4. Build the CubVault web frontend
5. Start all services with PM2

---

## Server Configuration

### 1. Update Your Server IP

Edit the nginx config to use your server's IP:

```bash
nano nginx/nginx.conf
```

Replace `127.0.0.1` with your server's local IP if needed.

### 2. Firewall Setup

Open the required ports:

```bash
# Ubuntu/Debian (ufw)
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 22/tcp      # SSH
sudo ufw enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

Internal ports (3000-3003) don't need to be opened - nginx handles routing.

### 3. Install Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

### 4. Configure Nginx

```bash
# Copy config
sudo cp nginx/nginx.conf /etc/nginx/sites-available/cubsoftware

# Enable site
sudo ln -s /etc/nginx/sites-available/cubsoftware /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### 5. SSL Certificates (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificates
sudo certbot --nginx -d cubsoftware.site -d www.cubsoftware.site
sudo certbot --nginx -d questcord.fun -d www.questcord.fun
sudo certbot --nginx -d cubvault.cubsoftware.site
sudo certbot --nginx -d streamerbot.cubsoftware.site
sudo certbot --nginx -d tools.cubsoftware.site

# Auto-renewal is set up automatically
```

---

## DNS Configuration

Add these DNS records at your domain registrar:

### cubsoftware.site
| Type | Name | Value |
|------|------|-------|
| A | @ | YOUR_SERVER_IP |
| A | www | YOUR_SERVER_IP |
| A | cubvault | YOUR_SERVER_IP |
| A | streamerbot | YOUR_SERVER_IP |
| A | tools | YOUR_SERVER_IP |
| A | questcord | YOUR_SERVER_IP |

### questcord.fun
| Type | Name | Value |
|------|------|-------|
| A | @ | YOUR_SERVER_IP |
| A | www | YOUR_SERVER_IP |

---

## PM2 Commands

```bash
pm2 start cubsoftware.config.js   # Start all
pm2 stop all                       # Stop all
pm2 restart all                    # Restart all
pm2 status                         # Check status
pm2 logs                           # View all logs
pm2 logs questcord                 # View specific logs
pm2 monit                          # Monitor dashboard
pm2 save                           # Save for auto-restart
```

---

## Port Reference

| Service | Port | Domain |
|---------|------|--------|
| CubSoftware Website | 3000 | cubsoftware.site |
| CubVault API | 3001 | cubvault.cubsoftware.site/api |
| CubVault Web | 3002 | cubvault.cubsoftware.site |
| QuestCord | 3003 | questcord.fun |
| The Onion Bot | N/A | Discord bot only |

---

## Environment Files

Make sure these are configured before starting:

### CubVault (`apps/cubvault/server/.env`)
```
PORT=3001
NODE_ENV=production
DATABASE_URL="file:./cubvault.db"
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
FRONTEND_URL=https://cubvault.cubsoftware.site
```

### QuestCord (`apps/questcord/.env`)
```
DISCORD_TOKEN=your-bot-token
DISCORD_CLIENT_ID=your-client-id
DISCORD_CLIENT_SECRET=your-client-secret
SESSION_SECRET=your-session-secret
NODE_ENV=production
```

### The Onion Bot (`../The Onion Bot/.env`)
```
DISCORD_TOKEN=your-bot-token
CLIENT_ID=your-client-id
GUILD_ID=your-server-id
CREATOR_ID=your-discord-user-id
```
