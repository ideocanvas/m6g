#!/usr/bin/env tsx
/**
 * Data Conversion Script for Mark Six Lottery Application
 * Converts existing JSON data from Parse platform format to Supabase schema
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Types for the existing Parse platform data structure
interface ParseRecord {
  objectId: string;
  createdAt: string;
  updatedAt: string;
  sid: string;
  seq?: number;
  no: string; // "[8,9,22,27,35,46]" or "7+16+26+31+47+49"
  sno?: string; // "44"
  generateDate?: string;
  drawDate?: string;
  dateText?: string;
  version?: number;
  _rperm?: string[];
  _wperm?: string[];
  scores?: string; // JSON string with analytical data
}

interface ConvertedResult {
  draw_id: string;
  draw_date: string;
  date_text: string;
  winning_numbers: number[];
  special_number: number;
  created_at: string;
  updated_at: string;
}

interface ConvertedCombination {
  generation_id: string;
  sequence_number: number;
  combination_numbers: number[];
  is_double: boolean;
  generation_method: string;
  generated_at: string;
  created_at: string;
}

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Parse the number string from existing data format
 * Handles both array format "[8,9,22,27,35,46]" and delimited format "7+16+26+31+47+49"
 */
function parseNumberString(numberString: string): number[] {
  if (numberString.startsWith('[') && numberString.endsWith(']')) {
    // Array format: "[8,9,22,27,35,46]"
    return JSON.parse(numberString);
  } else if (numberString.includes('+')) {
    // Delimited format: "7+16+26+31+47+49"
    return numberString.split('+').map(num => parseInt(num.trim(), 10));
  } else {
    throw new Error(`Unknown number format: ${numberString}`);
  }
}

/**
 * Convert draw results data from Parse format to Supabase format
 */
function convertDrawResult(record: ParseRecord): ConvertedResult | null {
  try {
    // Skip records without required fields
    if (!record.sid || !record.no || !record.sno || !record.drawDate) {
      console.warn(`Skipping record ${record.objectId}: missing required fields`);
      return null;
    }

    const winningNumbers = parseNumberString(record.no);
    const specialNumber = parseInt(record.sno, 10);

    // Validate numbers are within Mark Six range (1-49)
    const allNumbers = [...winningNumbers, specialNumber];
    if (allNumbers.some(num => num < 1 || num > 49)) {
      console.warn(`Skipping record ${record.objectId}: numbers out of range`);
      return null;
    }

    // Convert date format
    const drawDate = new Date(record.drawDate).toISOString();
    
    return {
      draw_id: record.sid,
      draw_date: drawDate,
      date_text: record.dateText || formatDateText(drawDate),
      winning_numbers: winningNumbers,
      special_number: specialNumber,
      created_at: record.createdAt,
      updated_at: record.updatedAt
    };
  } catch (error) {
    console.error(`Error converting draw result ${record.objectId}:`, error);
    return null;
  }
}

/**
 * Convert generated combinations data from Parse format to Supabase format
 */
function convertGeneratedCombination(record: ParseRecord): ConvertedCombination | null {
  try {
    // Skip records without required fields
    if (!record.sid || !record.no || !record.generateDate) {
      console.warn(`Skipping combination record ${record.objectId}: missing required fields`);
      return null;
    }

    const combinationNumbers = parseNumberString(record.no);
    const isDouble = combinationNumbers.length === 7;
    
    // Extract generation ID from sid (format: "20231223112521-01")
    const generationId = record.sid.split('-')[0];
    const sequenceNumber = record.seq || 1;

    return {
      generation_id: generationId,
      sequence_number: sequenceNumber,
      combination_numbers: combinationNumbers,
      is_double: isDouble,
      generation_method: 'legacy', // Mark as converted from legacy data
      generated_at: record.generateDate,
      created_at: record.createdAt
    };
  } catch (error) {
    console.error(`Error converting combination ${record.objectId}:`, error);
    return null;
  }
}

/**
 * Format date as DD/MM/YYYY for date_text field
 */
function formatDateText(isoDate: string): string {
  const date = new Date(isoDate);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Load JSON data from file
 */
function loadJsonData(filePath: string): ParseRecord[] {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading JSON data from ${filePath}:`, error);
    return [];
  }
}

/**
 * Insert data into Supabase with batch processing
 */
async function insertDataInBatches<T>(
  tableName: string,
  data: T[],
  batchSize: number = 100
): Promise<number> {
  let insertedCount = 0;
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    
    try {
      const { data: result, error } = await supabase
        .from(tableName)
        .insert(batch)
        .select();

      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
        // Try inserting individually to identify problematic records
        for (const record of batch) {
          try {
            const { error: singleError } = await supabase
              .from(tableName)
              .insert(record);
            
            if (!singleError) {
              insertedCount++;
            } else {
              console.error(`Failed to insert individual record:`, singleError);
            }
          } catch (singleError) {
            console.error(`Error inserting individual record:`, singleError);
          }
        }
      } else {
        insertedCount += result?.length || 0;
        console.log(`Inserted batch ${i / batchSize + 1}: ${result?.length || 0} records`);
      }
    } catch (batchError) {
      console.error(`Batch insertion failed:`, batchError);
    }
  }
  
  return insertedCount;
}

/**
 * Main conversion function
 */
async function convertData() {
  console.log('Starting data conversion...');

  // Load existing data files
  const resultsDataPath = path.join(__dirname, '../docs/data/UfxCdaMarksixResults.json');
  const recordsDataPath = path.join(__dirname, '../docs/data/UfxCdaMarksixRecords.json');

  const resultsData = loadJsonData(resultsDataPath);
  const recordsData = loadJsonData(recordsDataPath);

  console.log(`Loaded ${resultsData.length} draw results and ${recordsData.length} generated combinations`);

  // Convert draw results
  const convertedResults = resultsData
    .map(convertDrawResult)
    .filter((result): result is ConvertedResult => result !== null);

  console.log(`Converted ${convertedResults.length} draw results`);

  // Convert generated combinations
  const convertedCombinations = recordsData
    .map(convertGeneratedCombination)
    .filter((combination): combination is ConvertedCombination => combination !== null);

  console.log(`Converted ${convertedCombinations.length} generated combinations`);

  // Insert data into Supabase
  console.log('Inserting data into Supabase...');

  const resultsInserted = await insertDataInBatches('mark6_results', convertedResults);
  console.log(`Successfully inserted ${resultsInserted} draw results`);

  const combinationsInserted = await insertDataInBatches('mark6_generated_combinations', convertedCombinations);
  console.log(`Successfully inserted ${combinationsInserted} generated combinations`);

  console.log('Data conversion completed!');
  console.log(`Summary:`);
  console.log(`- Draw results: ${resultsInserted}/${convertedResults.length} inserted`);
  console.log(`- Generated combinations: ${combinationsInserted}/${convertedCombinations.length} inserted`);
}

// Run the conversion if this script is executed directly
if (require.main === module) {
  // Check for required environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required');
    process.exit(1);
  }

  convertData().catch(error => {
    console.error('Data conversion failed:', error);
    process.exit(1);
  });
}

export {
  convertDrawResult,
  convertGeneratedCombination,
  parseNumberString,
  formatDateText
};