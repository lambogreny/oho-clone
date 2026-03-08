#!/usr/bin/env bash
# Deploy SSL for oho-clone
# Usage: ./scripts/deploy-ssl.sh <domain>
# Example: ./scripts/deploy-ssl.sh oho.9phum.me

set -euo pipefail

DOMAIN="${1:?Usage: $0 <domain> (e.g. oho.9phum.me)}"
NGINX_CONF="/etc/nginx/sites-available/oho"
NGINX_ENABLED="/etc/nginx/sites-enabled/oho"

echo "=== oho-clone SSL Deploy ==="
echo "Domain: ${DOMAIN}"
echo ""

# 1. Install certbot if needed
if ! command -v certbot &>/dev/null; then
    echo "[1/5] Installing certbot..."
    apt-get update -qq
    apt-get install -y -qq certbot python3-certbot-nginx
else
    echo "[1/5] certbot already installed"
fi

# 2. Copy and configure Nginx
echo "[2/5] Configuring Nginx for ${DOMAIN}..."
cp /opt/oho/infra/nginx/oho.conf "${NGINX_CONF}"
sed -i "s/DOMAIN_PLACEHOLDER/${DOMAIN}/g" "${NGINX_CONF}"

# Enable site
ln -sf "${NGINX_CONF}" "${NGINX_ENABLED}"
rm -f /etc/nginx/sites-enabled/default

# Test config
nginx -t

# 3. Reload Nginx (HTTP only first)
echo "[3/5] Reloading Nginx (HTTP)..."
systemctl reload nginx

# 4. Get SSL certificate
echo "[4/5] Obtaining SSL certificate for ${DOMAIN}..."
certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos --email devops@9phum.me --redirect

# 5. Verify
echo "[5/5] Verifying..."
nginx -t
systemctl reload nginx

echo ""
echo "=== Done! ==="
echo "HTTP:  http://${DOMAIN}"
echo "HTTPS: https://${DOMAIN}"
echo ""
echo "Auto-renewal is handled by certbot's systemd timer."
echo "Test renewal: sudo certbot renew --dry-run"
