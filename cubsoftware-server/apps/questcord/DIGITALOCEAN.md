# Digital Ocean Deployment Guide

Complete guide for deploying QuestCord on Digital Ocean VPS.

## Prerequisites

- Digital Ocean account
- Domain name (optional but recommended)
- Basic SSH knowledge

## Step 1: Create a Droplet

1. Log into Digital Ocean
2. Create new Droplet:
   - **Distribution**: Ubuntu 22.04 LTS
   - **Plan**: Basic (Regular Intel) - $6/month or higher
   - **RAM**: Minimum 1GB (2GB recommended)
   - **Storage**: 25GB minimum
   - **Region**: Choose closest to your users
3. Add SSH key for secure access
4. Create Droplet

## Step 2: Initial Server Setup

Connect to your server:
```bash
ssh root@your_server_ip
```

Update system packages:
```bash
apt update
apt upgrade -y
```

Create a new user (replace 'questcord' with your preferred username):
```bash
adduser questcord
usermod -aG sudo questcord
```

Switch to new user:
```bash
su - questcord
```

## Step 3: Install Node.js

Install Node.js 18.x:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify installation:
```bash
node --version
npm --version
```

## Step 4: Install PM2

Install PM2 globally:
```bash
sudo npm install -g pm2
```

Set up PM2 startup script:
```bash
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u questcord --hp /home/questcord
```

## Step 5: Clone and Setup QuestCord

Create project directory:
```bash
mkdir -p ~/questcord
cd ~/questcord
```

Upload your project files via SCP from your local machine:
```bash
scp -r "G:\QuestCord V3"/* questcord@your_server_ip:~/questcord/
```

Or use Git (recommended):
```bash
git clone your_repository_url .
```

Install dependencies:
```bash
npm install
```

## Step 6: Configure Environment

Create `.env` file:
```bash
nano .env
```

Add your configuration:
```env
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
SUPPORT_SERVER_ID=1404523107544469545
OWNER_ID=your_discord_id
SESSION_SECRET=generate_random_secret_here
NODE_ENV=production
```

Press `Ctrl+X`, then `Y`, then `Enter` to save.

Create necessary directories:
```bash
mkdir -p data backups logs migrations
```

## Step 7: Register Discord Commands

```bash
node src/bot/deploy-commands.js
```

## Step 8: Configure Firewall

Set up UFW firewall:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Check firewall status:
```bash
sudo ufw status
```

## Step 9: Start with PM2

Start the application:
```bash
pm2 start ecosystem.config.js --env production
```

Save PM2 process list:
```bash
pm2 save
```

Monitor the application:
```bash
pm2 logs questcord
pm2 status
pm2 monit
```

## Step 10: Set Up Nginx Reverse Proxy (Optional but Recommended)

Install Nginx:
```bash
sudo apt install nginx -y
```

Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/questcord
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your_domain.com www.your_domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/questcord /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 11: Set Up SSL with Let's Encrypt (Recommended)

Install Certbot:
```bash
sudo apt install certbot python3-certbot-nginx -y
```

Obtain SSL certificate:
```bash
sudo certbot --nginx -d your_domain.com -d www.your_domain.com
```

Follow the prompts and agree to the terms.

Certbot will automatically configure Nginx for HTTPS and set up auto-renewal.

Test auto-renewal:
```bash
sudo certbot renew --dry-run
```

## Step 12: Configure for Production Port 80

If running directly on port 80 without Nginx:

Edit `config.json`:
```json
{
  "port": 3000,
  "productionPort": 80
}
```

Allow Node to bind to port 80:
```bash
sudo setcap 'cap_net_bind_service=+ep' $(which node)
```

Restart application:
```bash
pm2 restart questcord
```

## Useful PM2 Commands

View logs:
```bash
pm2 logs questcord
pm2 logs questcord --lines 100
```

Restart application:
```bash
pm2 restart questcord
```

Stop application:
```bash
pm2 stop questcord
```

Monitor resources:
```bash
pm2 monit
```

View detailed info:
```bash
pm2 info questcord
```

## Database Backups

Set up automated backups using cron:
```bash
crontab -e
```

Add daily backup at 3 AM:
```cron
0 3 * * * cp ~/questcord/data/questcord.db ~/questcord/backups/questcord-$(date +\%Y\%m\%d).db
```

## Updating the Application

1. Stop the application:
```bash
pm2 stop questcord
```

2. Pull latest changes:
```bash
cd ~/questcord
git pull
```

3. Install new dependencies:
```bash
npm install
```

4. Run migrations:
```bash
pm2 start questcord
```

Migrations run automatically on startup.

## Monitoring and Maintenance

Check disk space:
```bash
df -h
```

Check memory usage:
```bash
free -m
```

Check system logs:
```bash
sudo journalctl -u nginx -f
```

View application logs:
```bash
pm2 logs questcord
```

## Troubleshooting

### Application won't start

Check logs:
```bash
pm2 logs questcord --err
```

Check if port is in use:
```bash
sudo lsof -i :3000
```

### Database errors

Check permissions:
```bash
ls -la ~/questcord/data
```

Fix permissions if needed:
```bash
chmod 755 ~/questcord/data
chmod 644 ~/questcord/data/questcord.db
```

### Out of memory

Increase swap space:
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Nginx errors

Test configuration:
```bash
sudo nginx -t
```

Restart Nginx:
```bash
sudo systemctl restart nginx
```

Check Nginx logs:
```bash
sudo tail -f /var/log/nginx/error.log
```

## Security Recommendations

1. **Keep system updated**:
```bash
sudo apt update && sudo apt upgrade -y
```

2. **Configure fail2ban**:
```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

3. **Regular backups**:
   - Database backups are automatic
   - Keep backups of `.env` file (securely)
   - Consider using Digital Ocean's backup feature

4. **Monitor logs regularly**:
```bash
pm2 logs questcord
```

5. **Use strong passwords** for all accounts

6. **Keep Node.js and dependencies updated**:
```bash
npm audit
npm audit fix
```

## Performance Optimization

Enable gzip compression in Nginx:
```bash
sudo nano /etc/nginx/nginx.conf
```

Add inside `http` block:
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

Restart Nginx:
```bash
sudo systemctl restart nginx
```

## Support

For issues specific to QuestCord, check:
- Application logs: `pm2 logs questcord`
- Database logs in `logs/` directory
- Discord bot console output

For Digital Ocean specific issues, refer to their documentation at https://docs.digitalocean.com
