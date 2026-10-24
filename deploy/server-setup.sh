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

# The site address follows each deploy, so moving to the real domain is one command:
#   SITE_HOST=hopenest.org bash deploy/deploy.sh
# APP_URL (email links, OAuth callbacks) is derived from it in docker-compose.prod.yml.
OLD_SITE_HOST="$(grep '^SITE_HOST=' .env | cut -d= -f2-)"
if [ "$OLD_SITE_HOST" != "$SITE_HOST" ]; then
  grep -v '^SITE_HOST=' .env > .env.tmp && mv .env.tmp .env
  echo "SITE_HOST=$SITE_HOST" >> .env
  # Only the generated sender follows the host; a sender set from .env.smtp is kept.
  if grep -q "^MAIL_FROM=HopeNest <no-reply@$OLD_SITE_HOST>" .env; then
    grep -v '^MAIL_FROM=' .env > .env.tmp && mv .env.tmp .env
    echo "MAIL_FROM=HopeNest <no-reply@$SITE_HOST>" >> .env
  fi
  chmod 600 .env
  echo "Site address changed: $OLD_SITE_HOST -> $SITE_HOST"
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

# --- Host hardening (idempotent, runs on every deploy; see SECURITY.md) ---------------

# Security patches install themselves daily.
if command -v dnf >/dev/null; then
  rpm -q dnf-automatic >/dev/null 2>&1 || sudo dnf install -y dnf-automatic
  sudo sed -i -e 's/^upgrade_type *=.*/upgrade_type = security/' \
    -e 's/^apply_updates *=.*/apply_updates = yes/' /etc/dnf/automatic.conf
  sudo systemctl enable --now dnf-automatic.timer
elif command -v apt-get >/dev/null; then
  dpkg -s unattended-upgrades >/dev/null 2>&1 || sudo apt-get install -y unattended-upgrades
fi

# SSH: keys only, no root, few guesses per connection. sshd uses the first value it
# reads, so the 01- prefix wins over the distribution's own drop-ins. A config that
# fails `sshd -t` is removed again rather than risk locking everyone out.
SSHD_DROPIN=/etc/ssh/sshd_config.d/01-hopenest.conf
sudo tee "$SSHD_DROPIN" >/dev/null <<'SSHD'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
MaxAuthTries 3
LoginGraceTime 30
X11Forwarding no
AllowAgentForwarding no
SSHD
if sudo sshd -t; then
  sudo systemctl reload sshd
else
  sudo rm -f "$SSHD_DROPIN"
  echo "WARNING: SSH hardening rejected by sshd -t; left SSH settings unchanged." >&2
fi

# Cap container logs, so a flood of requests cannot fill the disk and take the site down.
if [ ! -f /etc/docker/daemon.json ]; then
  echo '{ "log-driver": "json-file", "log-opts": { "max-size": "10m", "max-file": "5" } }' \
    | sudo tee /etc/docker/daemon.json >/dev/null
  sudo systemctl restart docker
fi
