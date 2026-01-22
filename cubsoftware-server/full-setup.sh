#!/bin/bash

# ============================================
# CubSoftware Server - FULL One-Command Setup
# Run this on a fresh Ubuntu server to install EVERYTHING
# Usage: curl -sSL <raw-url> | bash
#    or: chmod +x full-setup.sh && ./full-setup.sh
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================"
echo -e "  CubSoftware Server - Full Setup"
echo -e "  This will install EVERYTHING"
echo -e "========================================${NC}"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ============================================
# Step 1: System Updates & Dependencies
# ============================================
echo -e "${YELLOW}[1/8] Updating system and installing dependencies...${NC}"
sudo apt update
sudo apt install -y curl git nginx python3 python3-pip python3-venv certbot python3-certbot-nginx

# ============================================
# Step 2: Install Node.js 20 LTS
# ============================================
echo -e "${YELLOW}[2/8] Installing Node.js 20 LTS...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi
echo -e "${GREEN}Node.js: $(node -v)${NC}"

# ============================================
# Step 3: Install PM2 globally
# ============================================
echo -e "${YELLOW}[3/8] Installing PM2...${NC}"
sudo npm install -g pm2

# ============================================
# Step 4: Create directories
# ============================================
echo -e "${YELLOW}[4/8] Creating directories...${NC}"
mkdir -p logs/cubsoftware-website
mkdir -p logs/questcord
mkdir -p logs/onion-bot
sudo mkdir -p /var/log/cubsoftware
sudo chown $USER:$USER /var/log/cubsoftware
sudo mkdir -p /var/www/cubsoftware
sudo chown -R $USER:$USER /var/www/cubsoftware

# ============================================
# Step 5: Install Python dependencies
# ============================================
echo -e "${YELLOW}[5/8] Installing CubSoftware Website (Python)...${NC}"
cd apps/cubsoftware-website
pip3 install -r requirements.txt --break-system-packages 2>/dev/null || pip3 install -r requirements.txt
cd "$SCRIPT_DIR"

# ============================================
# Step 6: Install Node.js app dependencies
# ============================================
echo -e "${YELLOW}[6/8] Installing QuestCord...${NC}"
if [ -d "apps/questcord" ]; then
    cd apps/questcord
    npm install
    cd "$SCRIPT_DIR"
fi

echo -e "${YELLOW}Installing The Onion Bot...${NC}"
if [ -d "../The Onion Bot" ]; then
    cd "../The Onion Bot"
    npm install
    cd "$SCRIPT_DIR"
fi

# ============================================
# Step 7: Configure Nginx
# ============================================
echo -e "${YELLOW}[7/8] Configuring Nginx...${NC}"

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Copy our config
sudo cp nginx/nginx.conf /etc/nginx/sites-available/cubsoftware

# Create symlink
sudo ln -sf /etc/nginx/sites-available/cubsoftware /etc/nginx/sites-enabled/cubsoftware

# Test and reload
sudo nginx -t && sudo systemctl reload nginx
sudo systemctl enable nginx

echo -e "${GREEN}Nginx configured and running${NC}"

# ============================================
# Step 8: Start all services with PM2
# ============================================
echo -e "${YELLOW}[8/8] Starting services with PM2...${NC}"
pm2 start cubsoftware.config.js
pm2 save
pm2 startup | tail -1 | sudo bash 2>/dev/null || echo "Run 'pm2 startup' manually if needed"

echo ""
echo -e "${BLUE}========================================"
echo -e "${GREEN}   SETUP COMPLETE!"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Services running:${NC}"
pm2 status
echo ""
echo -e "${YELLOW}NEXT STEPS:${NC}"
echo ""
echo -e "1. ${BLUE}Configure DNS:${NC} Point your domains to this server's public IP"
echo -e "   Run: ${GREEN}curl ifconfig.me${NC} to get your public IP"
echo ""
echo -e "2. ${BLUE}Port forwarding:${NC} Forward ports 80 & 443 to this server"
echo ""
echo -e "3. ${BLUE}SSL Certificates:${NC} Once DNS is pointing here, run:"
echo -e "   ${GREEN}sudo certbot --nginx -d cubsoftware.site -d www.cubsoftware.site${NC}"
echo -e "   ${GREEN}sudo certbot --nginx -d questcord.fun -d www.questcord.fun${NC}"
echo ""
echo -e "4. ${BLUE}Configure .env files:${NC}"
echo -e "   - apps/questcord/.env (Discord bot token, etc.)"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo -e "  pm2 status      - View service status"
echo -e "  pm2 logs        - View all logs"
echo -e "  pm2 restart all - Restart all services"
echo ""
