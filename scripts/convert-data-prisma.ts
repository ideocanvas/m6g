import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a direct Prisma client for data loading (not using edge/accelerate)
const prisma = new PrismaClient();

// Command line arguments interface
interface CliArgs {
  clean: boolean;
  help: boolean;
}

// Failed record interface
interface FailedRecord {
  id: string;
  error: string;
  [key: string]: string | number | boolean | Date | null | string[] | number[] | bigint;
}

interface DrawResult {
  objectId: string;
  sid: string; // This is the actual draw ID field in the JSON data
  drawDate: string;
  dateText: string;
  no: string; // Winning numbers as string (e.g., "7+16+26+31+47+49")
  sno: string; // Special number as string (e.g., "44")
  winningNumbers?: number[];
  specialNumber?: number;
  snowballCode?: string;
  snowballNameEn?: string;
  snowballNameCh?: string;
  totalInvestment?: number;
  jackpot?: number;
  unitBet?: number;
  estimatedPrize?: number;
  createdAt: string;
  updatedAt: string;
}

interface GeneratedCombination {
  objectId: string;
  sid: string; // Generation session ID (e.g., "20231223112521-01")
  seq: number; // Sequence number within generation
  no: string; // Combination numbers as JSON string array (e.g., "[8,9,22,27,35,46]")
  generateDate: string;
  createdAt: string;
  updatedAt: string;
}

// Parse command line arguments
function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const parsed: CliArgs = {
    clean: false,
    help: false
  };

  for (const arg of args) {
    if (arg === '--clean' || arg === '-c') {
      parsed.clean = true;
    } else if (arg === '--help' || arg === '-h') {
      parsed.help = true;
    }
  }

  return parsed;
}

// Display help information
function showHelp() {
  console.log(`
Usage: tsx scripts/convert-data-prisma.ts [OPTIONS]

Options:
  -c, --clean    Clean existing data before loading new data
  -h, --help     Show this help message

Examples:
  tsx scripts/convert-data-prisma.ts              # Load data without cleaning
  tsx scripts/convert-data-prisma.ts --clean      # Clean existing data before loading
  `);
}

// Clean existing data from database
async function cleanExistingData(): Promise<void> {
  console.log('Cleaning existing data from database...');
  
  try {
    // Delete data in correct order to respect foreign key constraints
    await prisma.markSixFollowOnPattern.deleteMany();
    await prisma.markSixNumberFrequency.deleteMany();
    await prisma.markSixGeneratedCombination.deleteMany();
    await prisma.markSixResult.deleteMany();
    
    console.log('✅ Successfully cleaned all existing data');
  } catch (error) {
    console.error('❌ Error cleaning existing data:', error);
    throw error;
  }
}

// Save failed records to error files
function saveFailedRecords(failedRecords: FailedRecord[], filename: string): void {
  const errorDir = path.join(process.cwd(), 'docs/data/errors');
  
  // Create error directory if it doesn't exist
  if (!fs.existsSync(errorDir)) {
    fs.mkdirSync(errorDir, { recursive: true });
  }
  
  const errorFilePath = path.join(errorDir, `${filename}_${Date.now()}.json`);
  fs.writeFileSync(errorFilePath, JSON.stringify(failedRecords, null, 2));
  console.log(`💾 Saved ${failedRecords.length} failed records to: ${errorFilePath}`);
}

async function convertData(args: CliArgs) {
  console.log('Starting data conversion with Prisma...');
  
  if (args.help) {
    showHelp();
    return;
  }

  try {
    // Clean existing data if requested
    if (args.clean) {
      await cleanExistingData();
    }

    // Load data files
    const resultsPath = path.join(process.cwd(), 'docs/data/UfxCdaMarksixResults.json');
    const recordsPath = path.join(process.cwd(), 'docs/data/UfxCdaMarksixRecords.json');

    if (!fs.existsSync(resultsPath) || !fs.existsSync(recordsPath)) {
      console.error('❌ Data files not found. Please ensure the JSON files exist in docs/data/');
      process.exit(1);
    }

    // Read and parse JSON files
    const resultsData = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
    const recordsData = JSON.parse(fs.readFileSync(recordsPath, 'utf-8'));

    // Extract the actual data arrays from the wrapper objects
    const drawResults: DrawResult[] = resultsData.UfxCdaMarksixResults || resultsData.results || [];
    const generatedCombinations: GeneratedCombination[] = recordsData.UfxCdaMarksixRecords || recordsData.records || [];

    console.log(`Loaded ${drawResults.length} draw results and ${generatedCombinations.length} generated combinations`);

    // Convert draw results with validation
    const convertedResults = drawResults.map(result => {
      // Parse winning numbers from string format (e.g., "7+16+26+31+47+49")
      let winningNumbers: number[] = [];
      try {
        winningNumbers = result.no.split('+').map(num => parseInt(num.trim(), 10));
        // Validate that we have exactly 6 winning numbers
        if (winningNumbers.length !== 6) {
          throw new Error(`Expected 6 winning numbers, got ${winningNumbers.length}`);
        }
        // Validate that all numbers are valid
        if (winningNumbers.some(num => isNaN(num) || num < 1 || num > 49)) {
          throw new Error(`Invalid winning numbers: ${result.no}`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to parse winning numbers for result ${result.objectId}: ${result.no}`, error);
        winningNumbers = []; // Will be filtered out later
      }

      // Parse special number
      let specialNumber: number | null = null;
      try {
        specialNumber = parseInt(result.sno, 10);
        if (isNaN(specialNumber) || specialNumber < 1 || specialNumber > 49) {
          throw new Error(`Invalid special number: ${result.sno}`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to parse special number for result ${result.objectId}: ${result.sno}`, error);
        specialNumber = null;
      }

      // Parse dates with validation
      let drawDate: Date | null = null;
      let createdAt: Date | null = null;
      let updatedAt: Date | null = null;
      
      try {
        drawDate = new Date(result.drawDate);
        if (isNaN(drawDate.getTime())) throw new Error('Invalid draw date');
      } catch {
        console.warn(`⚠️ Invalid draw date for result ${result.objectId}: ${result.drawDate}`);
        drawDate = null;
      }
      
      try {
        createdAt = new Date(result.createdAt);
        if (isNaN(createdAt.getTime())) throw new Error('Invalid created date');
      } catch {
        console.warn(`⚠️ Invalid created date for result ${result.objectId}: ${result.createdAt}`);
        createdAt = new Date(); // Fallback to current date
      }
      
      try {
        updatedAt = new Date(result.updatedAt);
        if (isNaN(updatedAt.getTime())) throw new Error('Invalid updated date');
      } catch {
        console.warn(`⚠️ Invalid updated date for result ${result.objectId}: ${result.updatedAt}`);
        updatedAt = new Date(); // Fallback to current date
      }

      return {
        id: result.objectId,
        drawId: result.sid, // Use sid field which contains the actual draw ID
        drawDate: drawDate || new Date(), // Fallback date if invalid
        dateText: result.dateText || '',
        winningNumbers: winningNumbers,
        specialNumber: specialNumber || 0, // Fallback to 0 if invalid
        snowballCode: result.snowballCode || null,
        snowballNameEn: result.snowballNameEn || null,
        snowballNameCh: result.snowballNameCh || null,
        totalInvestment: result.totalInvestment ? BigInt(result.totalInvestment) : null,
        jackpot: result.jackpot ? BigInt(result.jackpot) : null,
        unitBet: result.unitBet || null,
        estimatedPrize: result.estimatedPrize ? BigInt(result.estimatedPrize) : null,
        createdAt: createdAt || new Date(),
        updatedAt: updatedAt || new Date()
      };
    }).filter(result =>
      result.winningNumbers.length === 6 &&
      result.specialNumber !== null &&
      result.drawDate !== null
    );

    console.log(`Converted ${convertedResults.length} draw results`);

    // Convert generated combinations with validation
    const convertedCombinations = generatedCombinations.map(record => {
      // Parse combination numbers from JSON string format (e.g., "[8,9,22,27,35,46]")
      let combinationNumbers: number[] = [];
      try {
        combinationNumbers = JSON.parse(record.no);
        // Validate combination numbers
        if (combinationNumbers.length < 6 || combinationNumbers.length > 7) {
          throw new Error(`Expected 6 or 7 combination numbers, got ${combinationNumbers.length}`);
        }
        // Validate that all numbers are valid
        if (combinationNumbers.some(num => isNaN(num) || num < 1 || num > 49)) {
          throw new Error(`Invalid combination numbers: ${record.no}`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to parse combination numbers for record ${record.objectId}: ${record.no}`, error);
        // Fallback: try to extract numbers from string
        const numbers = record.no.replace(/[\[\]]/g, '').split(',').map(num => parseInt(num.trim(), 10));
        combinationNumbers = numbers.filter(num => !isNaN(num) && num >= 1 && num <= 49);
        if (combinationNumbers.length < 6) {
          console.warn(`⚠️ Insufficient valid numbers after fallback for record ${record.objectId}: ${combinationNumbers.length} numbers`);
        }
      }
      
      // Determine if this is a double combination (7 numbers)
      const isDouble = combinationNumbers.length === 7;
      
      // Parse dates with validation
      let generatedAt: Date | null = null;
      let createdAt: Date | null = null;
      
      try {
        generatedAt = new Date(record.generateDate);
        if (isNaN(generatedAt.getTime())) throw new Error('Invalid generate date');
      } catch {
        console.warn(`⚠️ Invalid generate date for record ${record.objectId}: ${record.generateDate}`);
        generatedAt = new Date(); // Fallback to current date
      }
      
      try {
        createdAt = new Date(record.createdAt);
        if (isNaN(createdAt.getTime())) throw new Error('Invalid created date');
      } catch {
        console.warn(`⚠️ Invalid created date for record ${record.objectId}: ${record.createdAt}`);
        createdAt = new Date(); // Fallback to current date
      }

      return {
        id: record.objectId,
        generationId: record.sid, // Use sid as generation ID
        sequenceNumber: record.seq, // Use seq as sequence number
        combinationNumbers: combinationNumbers,
        isDouble: isDouble,
        generationMethod: 'unknown', // Default value since not provided in source data
        selectedNumbers: [], // Default empty array since not provided in source data
        luckyNumber: null, // Default null since not provided in source data
        combinationCount: null, // Default null since not provided in source data
        generatedAt: generatedAt || new Date(),
        createdAt: createdAt || new Date()
      };
    }).filter(combination =>
      combination.combinationNumbers.length >= 6 &&
      combination.combinationNumbers.length <= 7
    );

    console.log(`Converted ${convertedCombinations.length} generated combinations (after filtering: ${convertedResults.length} valid draw results)`);

    // Insert data into database
    console.log('Inserting data into database...');

    // Track failed records
    const failedResults: FailedRecord[] = [];
    const failedCombinations: FailedRecord[] = [];

    // Insert draw results in batches
    const batchSize = 100;
    let successfulResults = 0;
    
    for (let i = 0; i < convertedResults.length; i += batchSize) {
      const batch = convertedResults.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      try {
        await prisma.markSixResult.createMany({
          data: batch,
          skipDuplicates: true
        });
        successfulResults += batch.length;
        console.log(`✅ Inserted batch ${batchNumber} of draw results (${batch.length} records)`);
      } catch (error) {
        console.error(`❌ Error inserting batch ${batchNumber}:`, error);
        // Try inserting individually
        for (const result of batch) {
          try {
            await prisma.markSixResult.create({
              data: result
            });
            successfulResults++;
          } catch (individualError) {
            console.error(`❌ Failed to insert individual result record (drawId: ${result.drawId}):`, individualError);
            failedResults.push({
              ...result,
              error: individualError instanceof Error ? individualError.message : String(individualError)
            });
          }
        }
      }
    }

    // Insert generated combinations in batches
    let successfulCombinations = 0;
    
    for (let i = 0; i < convertedCombinations.length; i += batchSize) {
      const batch = convertedCombinations.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      try {
        await prisma.markSixGeneratedCombination.createMany({
          data: batch,
          skipDuplicates: true
        });
        successfulCombinations += batch.length;
        console.log(`✅ Inserted batch ${batchNumber} of generated combinations (${batch.length} records)`);
      } catch (error) {
        console.error(`❌ Error inserting batch ${batchNumber}:`, error);
        // Try inserting individually
        for (const combination of batch) {
          try {
            await prisma.markSixGeneratedCombination.create({
              data: combination
            });
            successfulCombinations++;
          } catch (individualError) {
            console.error(`❌ Failed to insert individual combination record (id: ${combination.id}):`, individualError);
            failedCombinations.push({
              ...combination,
              error: individualError instanceof Error ? individualError.message : String(individualError)
            });
          }
        }
      }
    }

    // Save failed records to error files
    if (failedResults.length > 0) {
      saveFailedRecords(failedResults, 'failed_results');
    }
    
    if (failedCombinations.length > 0) {
      saveFailedRecords(failedCombinations, 'failed_combinations');
    }

    // Verify inserted counts match expected counts
    const totalExpectedResults = convertedResults.length;
    const totalExpectedCombinations = convertedCombinations.length;
    
    console.log('\n📊 Data conversion summary:');
    console.log(`✅ Successfully inserted ${successfulResults} out of ${totalExpectedResults} draw results`);
    console.log(`✅ Successfully inserted ${successfulCombinations} out of ${totalExpectedCombinations} generated combinations`);
    
    if (failedResults.length > 0) {
      console.log(`❌ Failed to insert ${failedResults.length} draw results (saved to error file)`);
    }
    
    if (failedCombinations.length > 0) {
      console.log(`❌ Failed to insert ${failedCombinations.length} generated combinations (saved to error file)`);
    }
    
    // Verify insertion counts
    const totalInsertedResults = successfulResults + failedResults.length;
    const totalInsertedCombinations = successfulCombinations + failedCombinations.length;
    
    if (totalInsertedResults !== totalExpectedResults) {
      console.log(`⚠️  WARNING: Total processed draw results (${totalInsertedResults}) doesn't match expected count (${totalExpectedResults})`);
    }
    
    if (totalInsertedCombinations !== totalExpectedCombinations) {
      console.log(`⚠️  WARNING: Total processed combinations (${totalInsertedCombinations}) doesn't match expected count (${totalExpectedCombinations})`);
    }
    
    if (failedResults.length === 0 && failedCombinations.length === 0 &&
        totalInsertedResults === totalExpectedResults &&
        totalInsertedCombinations === totalExpectedCombinations) {
      console.log('🎉 All data inserted successfully with verified counts!');
    } else {
      console.log('⚠️  Data insertion completed with some issues - please check the logs above');
    }

  } catch (error) {
    console.error('Error during data conversion:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
async function main() {
  const args = parseArgs();
  await convertData(args);
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});