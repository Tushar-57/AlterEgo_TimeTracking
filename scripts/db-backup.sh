#!/bin/bash
# Usage: DB_URL="postgresql://user:pass@host/dbname" ./scripts/db-backup.sh
# Dumps Render PostgreSQL to a timestamped file in ./db-backups/

set -e

DB_URL="${DB_URL:-$1}"

if [ -z "$DB_URL" ]; then
  echo "ERROR: DB_URL not set."
  echo "Usage: DB_URL='postgresql://user:pass@host/dbname' ./scripts/db-backup.sh"
  exit 1
fi

BACKUP_DIR="./db-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/alterego_backup_${TIMESTAMP}.dump"

mkdir -p "$BACKUP_DIR"

echo "Dumping DB to ${BACKUP_FILE}..."

pg_dump \
  --no-owner \
  --no-acl \
  --format=custom \
  --verbose \
  --file="$BACKUP_FILE" \
  "$DB_URL"

echo ""
echo "Backup complete: ${BACKUP_FILE}"
echo "Size: $(du -sh "$BACKUP_FILE" | cut -f1)"
echo ""
echo "Tables included:"
pg_restore --list "$BACKUP_FILE" | grep "TABLE DATA" | awk '{print "  -", $(NF-1)}'
