#!/bin/bash

# Prisma Data Backup Script
# Wrapper for backup-prisma-data.ts

set -e

DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
source <(grep -v '^#' $DIR/../.env.local | grep -v '^$' | sed 's/^/export /')

cd $DIR/..

show_help() {
  echo "Usage: ./scripts/backup-prisma.sh [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  -b, --backup              Create a backup of all Prisma data"
  echo "  -r, --restore             Restore data from a backup"
  echo "  -t, --timestamp <value>   Specify timestamp for restore (format: YYYYMMDD-HHMMSS)"
  echo "  -d, --backup-dir <path>   Specify backup directory (default: ./backups)"
  echo "  -l, --list                List available backups"
  echo "  -h, --help                Show this help message"
  echo ""
  echo "Examples:"
  echo "  ./scripts/backup-prisma.sh --backup                    # Create backup"
  echo "  ./scripts/backup-prisma.sh --restore                   # Restore latest backup"
  echo "  ./scripts/backup-prisma.sh --restore --timestamp 20241118-143000  # Restore specific backup"
  echo "  ./scripts/backup-prisma.sh --backup --backup-dir ./my-backups  # Custom backup directory"
  echo "  ./scripts/backup-prisma.sh --list                      # List available backups"
}

# Parse command line arguments
BACKUP=false
RESTORE=false
IMPORT=false
LIST=false
ACCELERATE=""
TIMESTAMP=""
BACKUP_DIR=""

while [[ $# -gt 0 ]]; do
  case $1 in
    -b|--backup)
      BACKUP=true
      shift
      ;;
    -r|--restore)
      RESTORE=true
      shift
      ;;
    -i|--import)
      IMPORT=true
      shift
      ;;
    -l|--list)
      LIST=true
      shift
      ;;
    --accelerate)
      ACCELERATE=true
      shift
      ;;
    --no-accelerate)
      ACCELERATE=false
      shift
      ;;
    -t|--timestamp)
      TIMESTAMP="$2"
      shift 2
      ;;
    -d|--backup-dir)
      BACKUP_DIR="$2"
      shift 2
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

# Build the command for the TypeScript script
CMD="npx tsx scripts/backup-prisma-data.ts"

if [ "$BACKUP" = true ]; then
  CMD="$CMD --backup"
fi

if [ "$RESTORE" = true ]; then
  CMD="$CMD --restore"
fi

if [ "$IMPORT" = true ]; then
  CMD="$CMD --import"
fi

if [ "$LIST" = true ]; then
  CMD="$CMD"
fi

if [ "$ACCELERATE" = true ]; then
  CMD="$CMD --accelerate"
elif [ "$ACCELERATE" = false ]; then
  CMD="$CMD --no-accelerate"
fi

if [ -n "$TIMESTAMP" ]; then
  CMD="$CMD --timestamp $TIMESTAMP"
fi

if [ -n "$BACKUP_DIR" ]; then
  CMD="$CMD --backup-dir $BACKUP_DIR"
fi

# Execute the command
echo "🚀 Running: $CMD"
echo ""

eval $CMD