# QuestCord Deployment Checklist

Use this checklist when deploying to production.

## Pre-Deployment

- [ ] All code tested locally
- [ ] `.env` file configured with production values
- [ ] `config.json` reviewed and updated
- [ ] Discord bot token is valid and bot is in support server
- [ ] Database migrations tested
- [ ] All npm dependencies installed: `npm install`
- [ ] Commands registered: `npm run deploy`

## Environment Configuration

- [ ] `NODE_ENV=production` in `.env`
- [ ] `DISCORD_TOKEN` set correctly
- [ ] `DISCORD_CLIENT_ID` set correctly
- [ ] `OWNER_ID` set to your Discord user ID
- [ ] `SESSION_SECRET` generated (use random string)
- [ ] Support server ID correct: `1404523107544469545`

## Server Setup (Digital Ocean)

- [ ] Ubuntu 22.04 LTS droplet created
- [ ] SSH access configured
- [ ] Node.js 18+ installed
- [ ] PM2 installed globally
- [ ] Firewall configured (ports 22, 80, 443)
- [ ] Project files uploaded to server

## Database

- [ ] `data/` directory created with correct permissions
- [ ] `backups/` directory created
- [ ] Database initialized successfully
- [ ] Migrations run without errors
- [ ] Backup cron job configured (optional)

## Discord Bot

- [ ] Bot invited to support server
- [ ] Bot has required permissions in support server
- [ ] Developer role assigned correctly
- [ ] Staff role assigned correctly
- [ ] Slash commands registered successfully
- [ ] Bot appears online in Discord

## Web Server

- [ ] Port 3000 accessible (or 80 in production)
- [ ] Nginx configured (if using reverse proxy)
- [ ] SSL certificate obtained (if using HTTPS)
- [ ] Trust proxy enabled in Express
- [ ] Rate limiting configured
- [ ] IP ban middleware active

## Production Start

- [ ] Application started with PM2: `npm run pm2:start`
- [ ] Process saved: `pm2 save`
- [ ] Startup script configured
- [ ] No errors in logs: `pm2 logs questcord`
- [ ] Website accessible at domain/IP
- [ ] Bot responding to commands
- [ ] Database operations working
- [ ] WebSocket connections working

## Post-Deployment Verification

- [ ] Test `/help` command in Discord
- [ ] Test `/tutorial` command
- [ ] Create test quest with `/optin` and `/quests`
- [ ] Complete a test quest
- [ ] Check profile with `/profile`
- [ ] Verify leaderboard displays correctly
- [ ] Test website at your domain
- [ ] Verify live activity feed updates
- [ ] Test 404 page (visit non-existent URL)
- [ ] Test admin commands (if you have developer role)
- [ ] Check all stats display correctly on homepage

## Security Verification

- [ ] `.env` file not publicly accessible
- [ ] Database file not publicly accessible
- [ ] Firewall rules correct
- [ ] SSL certificate valid (if using HTTPS)
- [ ] Rate limiting working
- [ ] IP ban system functional
- [ ] Threat detection on 404 pages working

## Monitoring Setup

- [ ] PM2 monitoring active: `pm2 monit`
- [ ] Log rotation configured
- [ ] Disk space monitoring
- [ ] Server resource monitoring
- [ ] Database backup verification

## Documentation

- [ ] Team members have access to documentation
- [ ] Support server link updated
- [ ] Domain DNS configured correctly
- [ ] Emergency contact information updated

## Maintenance Scheduled

- [ ] Daily database backups at 3 AM
- [ ] Bi-hourly database optimization
- [ ] Weekly system updates planned
- [ ] Monthly dependency updates planned
- [ ] Quarterly security audits planned

## Rollback Plan

In case of issues:

1. Stop PM2 process: `pm2 stop questcord`
2. Restore previous version from git
3. Restore database from backup
4. Restart: `pm2 restart questcord`
5. Verify functionality

## Emergency Contacts

- Server Access: [Your SSH credentials location]
- Discord Bot Token: [Location of secure token storage]
- Database Backups: `/home/questcord/questcord/backups/`
- Domain Registrar: [Your domain provider]
- Digital Ocean Account: [Account email]

## Notes

Add any deployment-specific notes here:

---

**Last Deployed:** [Date]
**Deployed By:** [Name]
**Version:** [Version number if using versioning]
**Notes:** [Any special configurations or changes]
