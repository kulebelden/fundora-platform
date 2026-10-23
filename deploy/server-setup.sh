#!/usr/bin/env bash
# One-time server preparation: Docker, Compose, swap, and a generated .env.
# Usage (on the server, inside the uploaded project's deploy/ folder): bash server-setup.sh <site-host>
set -euo pipefail
SITE_HOST="${1:?usage: server-setup.sh <site-host>}"

if ! command -v docker >/dev/null; then
  if command -v apt-get >/dev/null; then
    curl -fsSL https://get.docker.com | sudo sh
  else
    sudo dnf install -y docker
    sudo mkdir -p /usr/local/lib/docker/cli-plugins
    sudo curl -fsSL "https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-$(uname -m)" \
      -o /usr/local/lib/docker/cli-plugins/docker-compose
    sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
    sudo curl -fsSL "https://github.com/docker/buildx/releases/download/v0.17.1/buildx-v0.17.1.linux-$( [ "$(uname -m)" = x86_64 ] && echo amd64 || echo arm64)" \
      -o /usr/local/lib/docker/cli-plugins/docker-buildx
    sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-buildx
  fi
  sudo systemctl enable --now docker
  sudo usermod -aG docker "$USER"
fi

# A t3.micro has 1 GB of RAM; the Next.js build needs more.
if ! swapon --show | grep -q /swapfile; then
  sudo fallocate -l 3G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

if [ ! -f .env ]; then
  rand() { openssl rand -hex "$1"; }
  cat > .env <<ENV
SITE_HOST=$SITE_HOST
DB_NAME=fundora_db
DB_USER=fundora_admin
DB_PASSWORD=$(rand 24)
JWT_ACCESS_SECRET=$(rand 32)
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=$(rand 32)
JWT_REFRESH_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APPLE_CLIENT_ID=
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=
EMAIL_VERIFICATION_REQUIRED=false
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
MAIL_FROM=HopeNest <no-reply@$SITE_HOST>
ENV
  chmod 600 .env
  echo "Generated deploy/.env with fresh secrets."
fi

# Mail settings uploaded from the developer machine (deploy/.env.smtp, never committed)
# replace the SMTP_* and MAIL_FROM lines in .env.
if [ -f .env.smtp ]; then
  while IFS='=' read -r key value; do
    case "$key" in
      SMTP_HOST|SMTP_PORT|SMTP_SECURE|SMTP_USER|SMTP_PASS|MAIL_FROM)
        grep -v "^$key=" .env > .env.tmp && mv .env.tmp .env
        printf '%s=%s\n' "$key" "$value" >> .env ;;
    esac
  done < <(grep -v '^\s*#' .env.smtp | tr -d '\r')
  chmod 600 .env
  rm -f .env.smtp
  echo "Applied SMTP settings from .env.smtp."
fi

# Older .env files predate the verification switch: add it, off while SMTP is unset.
grep -q '^EMAIL_VERIFICATION_REQUIRED=' .env || echo 'EMAIL_VERIFICATION_REQUIRED=false' >> .env
