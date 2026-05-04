#!/bin/bash
# Usage: DB_URL="postgresql://user:pass@newhost/dbname" BACKUP_FILE="./db-backups/alterego_backup_XYZ.dump" ./scripts/db-restore.sh
# Restores a pg_dump .dump file into the target PostgreSQL instance.

set -e

DB_URL="${DB_URL:-$1}"
BACKUP_FILE="${BACKUP_FILE:-$2}"

if [ -z "$DB_URL" ] || [ -z "$BACKUP_FILE" ]; then
  echo "ERROR: DB_URL and BACKUP_FILE must be set."
  echo "Usage: DB_URL='postgresql://user:pass@host/dbname' BACKUP_FILE='./db-backups/alterego_backup_XYZ.dump' ./scripts/db-restore.sh"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "Restoring from: $BACKUP_FILE"
echo "Target DB: $DB_URL"
echo ""
echo "Tables in backup:"
PG_RESTORE=$(which pg_restore 2>/dev/null || echo "/opt/homebrew/opt/libpq/bin/pg_restore")
$PG_RESTORE --list "$BACKUP_FILE" | grep "TABLE DATA" | awk '{print "  -", $(NF-1)}'
echo ""

read -p "Proceed with restore? This will INSERT data into the target DB. [y/N] " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

$PG_RESTORE \
  --no-owner \
  --no-acl \
  --verbose \
  --clean \
  --if-exists \
  --single-transaction \
  -d "$DB_URL" \
  "$BACKUP_FILE"

echo ""
echo "Restore complete."
echo "Next: update SPRING_DATASOURCE_URL in Render env vars to new DB URL, then redeploy."
