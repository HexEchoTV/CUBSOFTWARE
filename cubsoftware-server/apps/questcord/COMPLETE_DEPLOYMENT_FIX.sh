#!/bin/bash

# QuestCord Complete Deployment Fix
# Run this on your VPS to fix everything

set -e  # Exit on any error

echo "========================================="
echo "QuestCord Complete Deployment Fix"
echo "========================================="
echo ""

# Step 1: Stop and disable Nginx
echo "[1/8] Stopping Nginx..."
systemctl stop nginx 2>/dev/null || true
systemctl disable nginx 2>/dev/null || true
echo "✓ Nginx stopped and disabled"

# Step 2: Stop current PM2 process
echo ""
echo "[2/8] Stopping PM2 process..."
pm2 delete questcord 2>/dev/null || true
echo "✓ PM2 process stopped"

# Step 3: Go to project directory
echo ""
echo "[3/8] Navigating to project..."
cd ~/QuestCord-v3
echo "✓ In project directory"

# Step 4: Pull latest changes
echo ""
echo "[4/8] Pulling latest code..."
git pull
echo "✓ Code updated"

# Step 5: Install dependencies
echo ""
echo "[5/8] Installing dependencies..."
npm install
echo "✓ Dependencies installed"

# Step 6: Deploy commands
echo ""
echo "[6/8] Deploying Discord commands..."
node src/bot/deploy-commands.js
echo "✓ Commands deployed"

# Step 7: Start with PM2
echo ""
echo "[7/8] Starting bot with PM2..."
npm run pm2:start
sleep 5
pm2 save
echo "✓ Bot started and saved"

# Step 8: Verify
echo ""
echo "[8/8] Verifying setup..."
echo ""
echo "PM2 Status:"
pm2 status
echo ""
echo "Port 80 Status:"
lsof -i :80 || echo "Nothing on port 80 - checking if bot started..."
sleep 2
lsof -i :80
echo ""

echo "========================================="
echo "✓ DEPLOYMENT COMPLETE!"
echo "========================================="
echo ""
echo "Now test: https://questcord.fun"
echo ""
echo "If it doesn't work, run:"
echo "  pm2 logs questcord"
echo ""
