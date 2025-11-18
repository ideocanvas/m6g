import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// BigInt serialization helper
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function() {
  return this.toString();
};

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Create Prisma client based on DATABASE_URL
function createPrismaClient(useAccelerate?: boolean) {
  const databaseUrl = process.env.DATABASE_URL;
  // Auto-detect if accelerate should be used based on DATABASE_URL
  if (useAccelerate === undefined) {
    useAccelerate = databaseUrl?.startsWith('prisma://') || databaseUrl?.startsWith('prisma+postgres://');
  }
  
  if (useAccelerate) {
    console.log('🚀 Using Prisma with Accelerate');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require('@prisma/client/edge');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { withAccelerate } = require('@prisma/extension-accelerate');
    return new PrismaClient().$extends(withAccelerate());
  } else {
    console.log('📊 Using regular Prisma client (no Accelerate)');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require('@prisma/client');
    return new PrismaClient();
  }
}

// Command line arguments interface
interface CliArgs {
  backup: boolean;
  restore: boolean;
  import: boolean;
  help: boolean;
  accelerate?: boolean; // Optional - auto-detect by default
  timestamp?: string;
  backupDir?: string;
}

// Backup data interface
interface BackupData {
  timestamp: string;
  metadata: {
    version: string;
    totalRecords: number;
    backupDate: string;
  };
  data: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    markSixResults: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    markSixGeneratedCombinations: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    markSixNumberFrequency: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    markSixFollowOnPatterns: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    markSixApiLogs: any[];
  };
}

// Parse command line arguments
function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const parsed: CliArgs = {
    backup: false,
    restore: false,
    import: false,
    help: false,
    accelerate: undefined // Auto-detect by default
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--backup' || arg === '-b') {
      parsed.backup = true;
    } else if (arg === '--restore' || arg === '-r') {
      parsed.restore = true;
    } else if (arg === '--import' || arg === '-i') {
      parsed.import = true;
    } else if (arg === '--help' || arg === '-h') {
      parsed.help = true;
    } else if (arg === '--no-accelerate') {
      parsed.accelerate = false;
    } else if (arg === '--accelerate') {
      parsed.accelerate = true;
    } else if (arg === '--timestamp' || arg === '-t') {
      parsed.timestamp = args[++i];
    } else if (arg === '--backup-dir' || arg === '-d') {
      parsed.backupDir = args[++i];
    }
  }

  return parsed;
}

// Display help information
function showHelp() {
  console.log(`
Usage: tsx scripts/backup-prisma-data.ts [OPTIONS]

Options:
  -b, --backup              Create a backup of all Prisma data
  -r, --restore             Restore data from a backup (WARNING: deletes existing data)
  -i, --import              Import data from backup (upsert - doesn't delete existing data)
  -t, --timestamp <value>   Specify timestamp for restore/import (format: YYYYMMDD-HHMMSS)
  -d, --backup-dir <path>   Specify backup directory (default: ./backups)
  --accelerate              Force use of Prisma Accelerate
  --no-accelerate           Disable Prisma Accelerate (use regular client)
  -h, --help                Show this help message

Examples:
  tsx scripts/backup-prisma-data.ts --backup                    # Create backup (auto-detect accelerate)
  tsx scripts/backup-prisma-data.ts --restore                   # Restore latest backup (deletes existing)
  tsx scripts/backup-prisma-data.ts --import                    # Import latest backup (upsert)
  tsx scripts/backup-prisma-data.ts --restore --timestamp 20241118-143000  # Restore specific backup
  tsx scripts/backup-prisma-data.ts --import --timestamp 20241118-143000  # Import specific backup
  tsx scripts/backup-prisma-data.ts --backup --backup-dir ./my-backups  # Custom backup directory
  tsx scripts/backup-prisma-data.ts --import --no-accelerate    # Import without accelerate
  tsx scripts/backup-prisma-data.ts --import --accelerate      # Import with accelerate (force)
  `);
}

// Get backup directory
function getBackupDir(customDir?: string): string {
  const baseDir = customDir || path.join(process.cwd(), 'backups');
  
  // Create backup directory if it doesn't exist
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
    console.log(`📁 Created backup directory: ${baseDir}`);
  }
  
  return baseDir;
}

// Generate timestamp for backup files
function generateTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

// Get all backup files in directory
function getBackupFiles(backupDir: string): string[] {
  if (!fs.existsSync(backupDir)) {
    return [];
  }
  
  const files = fs.readdirSync(backupDir);
  return files
    .filter(file => file.endsWith('.json'))
    .sort()
    .reverse(); // Most recent first
}

// Create backup of all Prisma data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createBackup(backupDir: string, prisma: any): Promise<void> {
  console.log('📦 Starting Prisma data backup...');
  
  const timestamp = generateTimestamp();
  const backupFile = path.join(backupDir, `prisma-backup-${timestamp}.json`);
  
  try {
    // Fetch all data from each table
    console.log('📊 Fetching data from database...');
    
    const [
      markSixResults,
      markSixGeneratedCombinations,
      markSixNumberFrequency,
      markSixFollowOnPatterns,
      markSixApiLogs
    ] = await Promise.all([
      prisma.markSixResult.findMany(),
      prisma.markSixGeneratedCombination.findMany(),
      prisma.markSixNumberFrequency.findMany(),
      prisma.markSixFollowOnPattern.findMany(),
      prisma.markSixApiLog.findMany()
    ]);
    
    const totalRecords = 
      markSixResults.length +
      markSixGeneratedCombinations.length +
      markSixNumberFrequency.length +
      markSixFollowOnPatterns.length +
      markSixApiLogs.length;
    
    // Create backup data structure
    const backupData: BackupData = {
      timestamp,
      metadata: {
        version: '1.0.0',
        totalRecords,
        backupDate: new Date().toISOString()
      },
      data: {
        markSixResults,
        markSixGeneratedCombinations,
        markSixNumberFrequency,
        markSixFollowOnPatterns,
        markSixApiLogs
      }
    };
    
    // Write backup file with BigInt support
    fs.writeFileSync(backupFile, JSON.stringify(backupData, (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    }, 2));
    
    console.log('✅ Backup completed successfully!');
    console.log(`📁 Backup file: ${backupFile}`);
    console.log(`📊 Total records backed up: ${totalRecords}`);
    console.log(`   - MarkSixResult: ${markSixResults.length}`);
    console.log(`   - MarkSixGeneratedCombination: ${markSixGeneratedCombinations.length}`);
    console.log(`   - MarkSixNumberFrequency: ${markSixNumberFrequency.length}`);
    console.log(`   - MarkSixFollowOnPattern: ${markSixFollowOnPatterns.length}`);
    console.log(`   - MarkSixApiLog: ${markSixApiLogs.length}`);
    
  } catch (error) {
    console.error('❌ Error creating backup:', error);
    throw error;
  }
}

// Restore data from backup
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function restoreBackup(backupDir: string, prisma: any, timestamp?: string): Promise<void> {
  console.log('🔄 Starting Prisma data restore...');
  
  const backupFiles = getBackupFiles(backupDir);
  
  if (backupFiles.length === 0) {
    console.error('❌ No backup files found in directory:', backupDir);
    process.exit(1);
  }
  
  let backupFile: string | undefined;
  
  if (timestamp) {
    // Find specific backup by timestamp
    backupFile = backupFiles.find(file => file.includes(timestamp));
    if (!backupFile) {
      console.error(`❌ No backup found with timestamp: ${timestamp}`);
      console.log('Available backups:');
      backupFiles.forEach(file => console.log(`  - ${file}`));
      process.exit(1);
    }
  } else {
    // Use latest backup
    backupFile = backupFiles[0];
    console.log(`📁 Using latest backup: ${backupFile}`);
  }
  
  const backupFilePath = path.join(backupDir, backupFile);
  
  try {
    // Read and parse backup file
    console.log(`📖 Reading backup file: ${backupFilePath}`);
    const backupData: BackupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf-8'));
    
    console.log(`📊 Backup metadata:`);
    console.log(`   - Timestamp: ${backupData.timestamp}`);
    console.log(`   - Backup date: ${backupData.metadata.backupDate}`);
    console.log(`   - Total records: ${backupData.metadata.totalRecords}`);
    
    // Confirm restore operation
    console.log('\n⚠️  WARNING: This will overwrite existing data in the database!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    
    // Wait for 5 seconds to allow cancellation
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('🔄 Starting data restore...');
    
    // Clean existing data first
    console.log('🧹 Cleaning existing data...');
    await prisma.markSixFollowOnPattern.deleteMany();
    await prisma.markSixNumberFrequency.deleteMany();
    await prisma.markSixGeneratedCombination.deleteMany();
    await prisma.markSixResult.deleteMany();
    await prisma.markSixApiLog.deleteMany();
    
    // Restore data in batches to avoid memory issues
    const batchSize = 100;
    
    // Restore MarkSixResult
    console.log(`📥 Restoring MarkSixResult (${backupData.data.markSixResults.length} records)...`);
    for (let i = 0; i < backupData.data.markSixResults.length; i += batchSize) {
      const batch = backupData.data.markSixResults.slice(i, i + batchSize);
      await prisma.markSixResult.createMany({
        data: batch,
        skipDuplicates: true
      });
      console.log(`   ✅ Restored batch ${Math.floor(i / batchSize) + 1}`);
    }
    
    // Restore MarkSixGeneratedCombination
    console.log(`📥 Restoring MarkSixGeneratedCombination (${backupData.data.markSixGeneratedCombinations.length} records)...`);
    for (let i = 0; i < backupData.data.markSixGeneratedCombinations.length; i += batchSize) {
      const batch = backupData.data.markSixGeneratedCombinations.slice(i, i + batchSize);
      await prisma.markSixGeneratedCombination.createMany({
        data: batch,
        skipDuplicates: true
      });
      console.log(`   ✅ Restored batch ${Math.floor(i / batchSize) + 1}`);
    }
    
    // Restore MarkSixNumberFrequency
    console.log(`📥 Restoring MarkSixNumberFrequency (${backupData.data.markSixNumberFrequency.length} records)...`);
    for (let i = 0; i < backupData.data.markSixNumberFrequency.length; i += batchSize) {
      const batch = backupData.data.markSixNumberFrequency.slice(i, i + batchSize);
      await prisma.markSixNumberFrequency.createMany({
        data: batch,
        skipDuplicates: true
      });
      console.log(`   ✅ Restored batch ${Math.floor(i / batchSize) + 1}`);
    }
    
    // Restore MarkSixFollowOnPattern
    console.log(`📥 Restoring MarkSixFollowOnPattern (${backupData.data.markSixFollowOnPatterns.length} records)...`);
    for (let i = 0; i < backupData.data.markSixFollowOnPatterns.length; i += batchSize) {
      const batch = backupData.data.markSixFollowOnPatterns.slice(i, i + batchSize);
      await prisma.markSixFollowOnPattern.createMany({
        data: batch,
        skipDuplicates: true
      });
      console.log(`   ✅ Restored batch ${Math.floor(i / batchSize) + 1}`);
    }
    
    // Restore MarkSixApiLog
    console.log(`📥 Restoring MarkSixApiLog (${backupData.data.markSixApiLogs.length} records)...`);
    for (let i = 0; i < backupData.data.markSixApiLogs.length; i += batchSize) {
      const batch = backupData.data.markSixApiLogs.slice(i, i + batchSize);
      await prisma.markSixApiLog.createMany({
        data: batch.map(log => ({
          ...log,
          requestBody: log.requestBody === null ? null : log.requestBody,
          responseBody: log.responseBody === null ? null : log.responseBody
        })),
        skipDuplicates: true
      });
      console.log(`   ✅ Restored batch ${Math.floor(i / batchSize) + 1}`);
    }
    
    console.log('✅ Restore completed successfully!');
    console.log(`📊 Total records restored: ${backupData.metadata.totalRecords}`);
    
  } catch (error) {
    console.error('❌ Error restoring backup:', error);
    throw error;
  }
}

// Import data from backup (upsert - doesn't delete existing data)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function importBackup(backupDir: string, prisma: any, timestamp?: string): Promise<void> {
  console.log('📥 Starting Prisma data import (upsert)...');
  
  const backupFiles = getBackupFiles(backupDir);
  
  if (backupFiles.length === 0) {
    console.error('❌ No backup files found in directory:', backupDir);
    process.exit(1);
  }
  
  let backupFile: string | undefined;
  
  if (timestamp) {
    // Find specific backup by timestamp
    backupFile = backupFiles.find(file => file.includes(timestamp));
    if (!backupFile) {
      console.error(`❌ No backup found with timestamp: ${timestamp}`);
      console.log('Available backups:');
      backupFiles.forEach(file => console.log(`  - ${file}`));
      process.exit(1);
    }
  } else {
    // Use latest backup
    backupFile = backupFiles[0];
    console.log(`📁 Using latest backup: ${backupFile}`);
  }
  
  const backupFilePath = path.join(backupDir, backupFile);
  
  try {
    // Read and parse backup file
    console.log(`📖 Reading backup file: ${backupFilePath}`);
    const backupData: BackupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf-8'));
    
    console.log(`📊 Backup metadata:`);
    console.log(`   - Timestamp: ${backupData.timestamp}`);
    console.log(`   - Backup date: ${backupData.metadata.backupDate}`);
    console.log(`   - Total records: ${backupData.metadata.totalRecords}`);
    
    console.log('🔄 Starting data import (upsert)...');
    
    // Import data in batches using upsert operations
    const batchSize = 50; // Smaller batch size for upsert operations
    
    // Import MarkSixResult
    console.log(`📥 Importing MarkSixResult (${backupData.data.markSixResults.length} records)...`);
    let importedResults = 0;
    for (let i = 0; i < backupData.data.markSixResults.length; i += batchSize) {
      const batch = backupData.data.markSixResults.slice(i, i + batchSize);
      for (const result of batch) {
        try {
          await prisma.markSixResult.upsert({
            where: { id: result.id },
            update: result,
            create: result
          });
          importedResults++;
        } catch (error) {
          console.warn(`⚠️ Failed to upsert MarkSixResult (id: ${result.id}):`, error);
        }
      }
      console.log(`   ✅ Processed batch ${Math.floor(i / batchSize) + 1}`);
    }
    
    // Import MarkSixGeneratedCombination
    console.log(`📥 Importing MarkSixGeneratedCombination (${backupData.data.markSixGeneratedCombinations.length} records)...`);
    let importedCombinations = 0;
    for (let i = 0; i < backupData.data.markSixGeneratedCombinations.length; i += batchSize) {
      const batch = backupData.data.markSixGeneratedCombinations.slice(i, i + batchSize);
      for (const combination of batch) {
        try {
          await prisma.markSixGeneratedCombination.upsert({
            where: { id: combination.id },
            update: combination,
            create: combination
          });
          importedCombinations++;
        } catch (error) {
          console.warn(`⚠️ Failed to upsert MarkSixGeneratedCombination (id: ${combination.id}):`, error);
        }
      }
      console.log(`   ✅ Processed batch ${Math.floor(i / batchSize) + 1}`);
    }
    
    // Import MarkSixNumberFrequency
    console.log(`📥 Importing MarkSixNumberFrequency (${backupData.data.markSixNumberFrequency.length} records)...`);
    let importedFrequency = 0;
    for (let i = 0; i < backupData.data.markSixNumberFrequency.length; i += batchSize) {
      const batch = backupData.data.markSixNumberFrequency.slice(i, i + batchSize);
      for (const frequency of batch) {
        try {
          await prisma.markSixNumberFrequency.upsert({
            where: { id: frequency.id },
            update: frequency,
            create: frequency
          });
          importedFrequency++;
        } catch (error) {
          console.warn(`⚠️ Failed to upsert MarkSixNumberFrequency (id: ${frequency.id}):`, error);
        }
      }
      console.log(`   ✅ Processed batch ${Math.floor(i / batchSize) + 1}`);
    }
    
    // Import MarkSixFollowOnPattern
    console.log(`📥 Importing MarkSixFollowOnPattern (${backupData.data.markSixFollowOnPatterns.length} records)...`);
    let importedPatterns = 0;
    for (let i = 0; i < backupData.data.markSixFollowOnPatterns.length; i += batchSize) {
      const batch = backupData.data.markSixFollowOnPatterns.slice(i, i + batchSize);
      for (const pattern of batch) {
        try {
          await prisma.markSixFollowOnPattern.upsert({
            where: { id: pattern.id },
            update: pattern,
            create: pattern
          });
          importedPatterns++;
        } catch (error) {
          console.warn(`⚠️ Failed to upsert MarkSixFollowOnPattern (id: ${pattern.id}):`, error);
        }
      }
      console.log(`   ✅ Processed batch ${Math.floor(i / batchSize) + 1}`);
    }
    
    // Import MarkSixApiLog
    console.log(`📥 Importing MarkSixApiLog (${backupData.data.markSixApiLogs.length} records)...`);
    let importedLogs = 0;
    for (let i = 0; i < backupData.data.markSixApiLogs.length; i += batchSize) {
      const batch = backupData.data.markSixApiLogs.slice(i, i + batchSize);
      for (const log of batch) {
        try {
          await prisma.markSixApiLog.upsert({
            where: { id: log.id },
            update: {
              ...log,
              requestBody: log.requestBody === null ? null : log.requestBody,
              responseBody: log.responseBody === null ? null : log.responseBody
            },
            create: {
              ...log,
              requestBody: log.requestBody === null ? null : log.requestBody,
              responseBody: log.responseBody === null ? null : log.responseBody
            }
          });
          importedLogs++;
        } catch (error) {
          console.warn(`⚠️ Failed to upsert MarkSixApiLog (id: ${log.id}):`, error);
        }
      }
      console.log(`   ✅ Processed batch ${Math.floor(i / batchSize) + 1}`);
    }
    
    console.log('✅ Import completed successfully!');
    console.log(`📊 Import summary:`);
    console.log(`   - MarkSixResult: ${importedResults} records`);
    console.log(`   - MarkSixGeneratedCombination: ${importedCombinations} records`);
    console.log(`   - MarkSixNumberFrequency: ${importedFrequency} records`);
    console.log(`   - MarkSixFollowOnPattern: ${importedPatterns} records`);
    console.log(`   - MarkSixApiLog: ${importedLogs} records`);
    
  } catch (error) {
    console.error('❌ Error importing backup:', error);
    throw error;
  }
}

// List available backups
function listBackups(backupDir: string): void {
  const backupFiles = getBackupFiles(backupDir);
  
  if (backupFiles.length === 0) {
    console.log('📁 No backup files found.');
    return;
  }
  
  console.log('📁 Available backups:');
  backupFiles.forEach((file, index) => {
    const filePath = path.join(backupDir, file);
    const stats = fs.statSync(filePath);
    const fileSize = (stats.size / 1024 / 1024).toFixed(2); // MB
    
    console.log(`  ${index + 1}. ${file} (${fileSize} MB)`);
  });
}

// Main function
async function main() {
  const args = parseArgs();
  
  if (args.help) {
    showHelp();
    return;
  }
  
  const backupDir = getBackupDir(args.backupDir);
  const prisma = createPrismaClient(args.accelerate);
  
  try {
    if (args.backup) {
      await createBackup(backupDir, prisma);
    } else if (args.restore) {
      await restoreBackup(backupDir, prisma, args.timestamp);
    } else if (args.import) {
      await importBackup(backupDir, prisma, args.timestamp);
    } else {
      // Default action: list backups
      listBackups(backupDir);
    }
  } catch (error) {
    console.error('❌ Operation failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute main function
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});