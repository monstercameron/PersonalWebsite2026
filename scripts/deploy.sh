#!/bin/bash
set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_NAME="personalwebsite.service"

echo "[deploy] stopping $SERVICE_NAME..."
sudo systemctl stop "$SERVICE_NAME"

echo "[deploy] pulling latest..."
cd "$REPO_DIR"
git pull

echo "[deploy] building..."
npm run build:prod:droplet

echo "[deploy] starting $SERVICE_NAME..."
sudo systemctl start "$SERVICE_NAME"

echo "[deploy] done. status:"
sudo systemctl status "$SERVICE_NAME" --no-pager -l
