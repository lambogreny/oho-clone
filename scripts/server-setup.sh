#!/bin/bash
# Server setup script for oho.chat production
# Run on fresh Ubuntu server as root
# Usage: curl -s <url> | bash

set -euo pipefail

echo "=== oho.chat Server Setup ==="

# System update
echo "[1/7] Updating system..."
apt-get update -y && apt-get upgrade -y
apt-get install -y curl wget git ufw nginx software-properties-common

# Docker
echo "[2/7] Installing Docker..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi
docker --version

# Docker Compose (comes with Docker now)
docker compose version

# Node.js 22
echo "[3/7] Installing Node.js 22..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
node --version

# Bun
echo "[4/7] Installing Bun..."
if ! command -v bun &> /dev/null; then
  curl -fsSL https://bun.sh/install | bash
  export BUN_INSTALL="$HOME/.bun"
  export PATH="$BUN_INSTALL/bin:$PATH"
fi
bun --version

# Firewall
echo "[5/7] Configuring firewall..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status

# Nginx
echo "[6/7] Configuring Nginx..."
systemctl enable nginx
systemctl start nginx

# App directory
echo "[7/7] Setting up app directory..."
mkdir -p /opt/oho
cd /opt/oho

if [ ! -d ".git" ]; then
  git clone https://github.com/lambogreny/oho-clone.git .
fi

echo ""
echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "  1. cd /opt/oho"
echo "  2. cp .env.example .env && nano .env  (set production secrets)"
echo "  3. cp infra/nginx/oho.conf /etc/nginx/sites-available/oho"
echo "  4. ln -s /etc/nginx/sites-available/oho /etc/nginx/sites-enabled/"
echo "  5. rm /etc/nginx/sites-enabled/default"
echo "  6. nginx -t && systemctl reload nginx"
echo "  7. cd infra/docker && docker compose -f docker-compose.prod.yml up -d"
echo "  8. For SSL: apt install certbot python3-certbot-nginx && certbot --nginx"
