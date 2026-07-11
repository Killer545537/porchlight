#!/bin/sh
set -eu

# Persist the bundled assignment DB on a volume. On first boot, copy the exact
# file from the image — never run seed.py or create_all on a fresh empty file.
mkdir -p /data
if [ ! -f /data/porchlight.db ]; then
  cp /app/porchlight.db.seed /data/porchlight.db
fi

mkdir -p /app/static/uploads

PORT="${PORT:-8000}"
exec uv run uvicorn main:app --host 0.0.0.0 --port "$PORT"
