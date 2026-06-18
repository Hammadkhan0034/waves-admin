#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Waves Miami Admin Panel — VPS Deployment Script
# Run this from your local machine or on the VPS directly
# ─────────────────────────────────────────────────────────────

set -e

# ── Config ────────────────────────────────────────────────────
VPS_USER="root"                        # SSH user on your VPS
VPS_HOST="YOUR_VPS_IP"                 # Replace with VPS IP or domain
REMOTE_DIR="/var/www/waves-miami-admin"
LOCAL_DIST="./dist"

echo "🏗  Building admin panel..."
npm run build

echo "📤 Uploading to VPS at $VPS_HOST..."
ssh "$VPS_USER@$VPS_HOST" "mkdir -p $REMOTE_DIR"
rsync -avz --delete "$LOCAL_DIST/" "$VPS_USER@$VPS_HOST:$REMOTE_DIR/dist/"

echo "⚙️  Installing nginx config..."
scp nginx.conf "$VPS_USER@$VPS_HOST:/etc/nginx/sites-available/waves-admin"
ssh "$VPS_USER@$VPS_HOST" "
  ln -sf /etc/nginx/sites-available/waves-admin /etc/nginx/sites-enabled/waves-admin
  nginx -t && systemctl reload nginx
"

echo "✅  Deployment complete! Admin panel is live."
