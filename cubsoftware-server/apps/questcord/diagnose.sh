#!/bin/bash

echo "=========================================="
echo "QuestCord Website Diagnostics"
echo "=========================================="
echo ""

echo "1. Checking if PM2 is running..."
pm2 status
echo ""

echo "2. Checking if port 80 is listening..."
lsof -i :80
echo ""

echo "3. Testing health endpoint locally..."
curl -v http://localhost/health
echo ""

echo "4. Checking UFW firewall status..."
ufw status
echo ""

echo "5. Checking if any process is blocking port 80..."
netstat -tulpn | grep :80
echo ""

echo "6. Recent PM2 logs..."
pm2 logs questcord --lines 20 --nostream
echo ""

echo "=========================================="
echo "Diagnostics Complete"
echo "=========================================="
echo ""
echo "If port 80 is not listening, run:"
echo "  pm2 restart questcord && pm2 logs questcord"
echo ""
echo "If port 80 is blocked by firewall, run:"
echo "  ufw allow 80/tcp && ufw reload"
echo ""
