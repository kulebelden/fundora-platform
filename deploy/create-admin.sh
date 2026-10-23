#!/usr/bin/env bash
# Create a staff account on the server: sign up through the API, then promote the role.
# Usage (from the repo root, in Git Bash):
#   bash deploy/create-admin.sh [email] [role]
# role: SUPER_ADMIN (default), ADMIN, MODERATOR or FINANCE_OFFICER.
# A strong password is generated and printed once; store it in your password manager.
set -euo pipefail
EMAIL="${1:-admin@hopenest.test}"
ROLE="${2:-SUPER_ADMIN}"
HOST="${HOST:-16.170.249.96}"
SSH_USER="${SSH_USER:-ec2-user}"
KEY="${KEY:-$HOME/.ssh/tukaah-key.pem}"
SITE="https://${SITE_HOST:-${HOST//./-}.sslip.io}"
PHONE="${PHONE:-+1202555$(printf '%04d' $((RANDOM % 10000)))}"
PASSWORD="Hn#$(openssl rand -hex 8)Zq9"

case "$ROLE" in SUPER_ADMIN|ADMIN|MODERATOR|FINANCE_OFFICER) ;; *) echo "Unknown role: $ROLE" >&2; exit 1 ;; esac
case "$EMAIL" in *\'*) echo "Invalid email" >&2; exit 1 ;; esac

status=$(curl -s -o /tmp/create-admin.out -w '%{http_code}' -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"phoneNumber\":\"$PHONE\",\"password\":\"$PASSWORD\",\"firstName\":\"HopeNest\",\"lastName\":\"Admin\"}" \
  "$SITE/api/v1/auth/register")
if [ "$status" != 201 ]; then
  echo "Sign-up failed ($status): $(cat /tmp/create-admin.out)" >&2
  exit 1
fi

ssh -i "$KEY" "$SSH_USER@$HOST" "cd ~/fundora/deploy && sudo docker compose -f docker-compose.prod.yml exec -T postgres \
  sh -c 'psql -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -tAc \"UPDATE users SET role = '\''$ROLE'\'' WHERE email = lower('\''$EMAIL'\'') RETURNING email, role\"'"

echo
echo "Staff account ready at $SITE/login"
echo "  Email:    $EMAIL"
echo "  Password: $PASSWORD"
