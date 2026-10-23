#!/usr/bin/env bash
# Upload the current working tree to the server and (re)start the stack.
# Usage (from the repo root, in Git Bash): bash deploy/deploy.sh
set -euo pipefail
HOST="${HOST:-16.170.249.96}"
SSH_USER="${SSH_USER:-ec2-user}"
KEY="${KEY:-$HOME/.ssh/tukaah-key.pem}"
SITE_HOST="${SITE_HOST:-${HOST//./-}.sslip.io}"
KEEPALIVE="-o ServerAliveInterval=20 -o ServerAliveCountMax=15"
SSH="ssh -i $KEY -o StrictHostKeyChecking=accept-new $KEEPALIVE $SSH_USER@$HOST"

tar czf /tmp/fundora.tgz --exclude=node_modules --exclude=.next --exclude=dist --exclude=.git \
  --exclude=.kilo --exclude='apps(web)' --exclude=apps/api/uploads --exclude='*.tsbuildinfo' \
  --exclude='./background image.png' --exclude='./landing page full view.png' --exclude=deploy/.env --exclude='.env' .
scp -i "$KEY" -o StrictHostKeyChecking=accept-new /tmp/fundora.tgz "$SSH_USER@$HOST:/tmp/fundora.tgz"
$SSH "mkdir -p ~/fundora && tar xzf /tmp/fundora.tgz -C ~/fundora && cd ~/fundora/deploy && bash server-setup.sh $SITE_HOST"
# New SSH session so docker group membership applies.
$SSH "cd ~/fundora/deploy && sudo docker compose -f docker-compose.prod.yml --env-file .env up -d --build && sudo docker compose -f docker-compose.prod.yml ps"
# Old images and build cache fill the small root volume quickly.
$SSH "sudo docker image prune -f >/dev/null && sudo docker builder prune -af >/dev/null && df -h / | tail -1"
echo "Deployed: https://$SITE_HOST"
