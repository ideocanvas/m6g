# Prisma Data Backup Guide

This guide explains how to use the Prisma data backup system for the Mark Six Lottery application.

## Overview

The backup system allows you to:
- Create complete backups of all Prisma data
- Restore data from previous backups
- List available backups
- Use custom backup directories

## Available Commands

### Create a Backup

```bash
# Create a backup in the default directory (./backups)
./scripts/backup-prisma.sh --backup

# Create a backup in a custom directory
./scripts/backup-prisma.sh --backup --backup-dir ./my-backups
```

### List Available Backups

```bash
# List all available backups
./scripts/backup-prisma.sh --list
```

### Restore from Backup

```bash
# Restore from the latest backup
./scripts/backup-prisma.sh --restore

# Restore from a specific backup by timestamp
./scripts/backup-prisma.sh --restore --timestamp 20251118-224802
```

### Get Help

```bash
# Show all available options
./scripts/backup-prisma.sh --help
```

## Backup File Format

Backup files are stored as JSON with the following structure:
- `timestamp`: Unique identifier for the backup
- `metadata`: Information about the backup (version, record count, date)
- `data`: All database records organized by table

Example backup file name: `prisma-backup-20251118-224802.json`

## Data Models Backed Up

The backup system includes all Prisma models:

1. **MarkSixResult** - Historical draw results from HKJC
2. **MarkSixGeneratedCombination** - User-generated number combinations
3. **MarkSixNumberFrequency** - Number frequency analysis data
4. **MarkSixFollowOnPattern** - Statistical relationships between draws
5. **MarkSixApiLog** - API access logs

## Important Notes

- **BigInt Support**: The system properly handles BigInt values by converting them to strings during serialization
- **JSON Fields**: JSON fields in the database are properly preserved during backup/restore
- **Batch Processing**: Large datasets are processed in batches to avoid memory issues
- **Error Handling**: Failed operations are logged and individual records are skipped if they cause errors
- **Safety**: Restore operations include a 5-second confirmation delay to prevent accidental data loss

## Backup Directory Structure

By default, backups are stored in `./backups/` relative to the project root. You can customize this location using the `--backup-dir` option.

## Best Practices

1. **Regular Backups**: Create backups before major changes or deployments
2. **Test Restores**: Periodically test restore operations to ensure backups are valid
3. **Version Control**: Consider committing important backups to version control
4. **Storage**: Store backups in multiple locations for redundancy
5. **Automation**: Set up automated backup schedules for production systems

## Troubleshooting

### Common Issues

1. **"tsx: command not found"**
   - Ensure you have installed dependencies with `pnpm install`

2. **Database connection errors**
   - Verify your `.env.local` file contains valid database credentials
   - Check that the database server is accessible

3. **Permission errors**
   - Ensure the backup directory is writable
   - Check file permissions on the script files

4. **Memory issues with large datasets**
   - The system uses batch processing, but very large datasets may require additional memory
   - Consider increasing Node.js memory limits if needed

### Getting Help

If you encounter issues not covered in this guide, check:
- The script output for detailed error messages
- The backup file metadata for record counts and timestamps
- The project documentation for database configuration