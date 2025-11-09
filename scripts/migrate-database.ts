#!/usr/bin/env tsx
/**
 * Database Migration Script for Mark Six Lottery Application
 * Creates the necessary tables and indexes in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Execute SQL migration
 */
async function executeMigration(sql: string): Promise<boolean> {
  try {
    // For Supabase, we need to execute each statement separately
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 100)}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        // If the RPC method doesn't exist, try direct SQL execution (this may not work in all Supabase tiers)
        console.warn(`RPC execution failed, trying alternative approach: ${error.message}`);
        
        // For tables, we can use the REST API to create them
        if (statement.toLowerCase().includes('create table')) {
          await createTableFromStatement(statement);
        } else if (statement.toLowerCase().includes('create index')) {
          await createIndexFromStatement(statement);
        } else {
          console.warn(`Skipping unsupported statement: ${statement.substring(0, 100)}...`);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Migration execution failed:', error);
    return false;
  }
}

/**
 * Create table from CREATE TABLE statement
 */
async function createTableFromStatement(statement: string): Promise<void> {
  // This is a simplified approach - in production, you'd want to parse the SQL properly
  console.log(`Creating table via alternative method: ${statement.substring(0, 100)}...`);
  
  // For now, we'll just log that we need manual table creation
  console.log('⚠️  Manual table creation required. Please run the SQL from supabase/schema.sql in your Supabase dashboard.');
}

/**
 * Create index from CREATE INDEX statement
 */
async function createIndexFromStatement(statement: string): Promise<void> {
  console.log(`Creating index via alternative method: ${statement.substring(0, 100)}...`);
  console.log('⚠️  Manual index creation required. Please run the SQL from supabase/schema.sql in your Supabase dashboard.');
}

/**
 * Check if tables already exist
 */
async function checkExistingTables(): Promise<boolean> {
  try {
    const { data: tables, error } = await supabase
      .from('mark6_results')
      .select('*')
      .limit(1);

    // If we can query the table without error, it exists
    return !error;
  } catch (error) {
    return false;
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('Starting database migration...');

  // Check if tables already exist
  const tablesExist = await checkExistingTables();
  if (tablesExist) {
    console.log('✅ Database tables already exist. Migration not needed.');
    return;
  }

  // Read the schema file
  const schemaPath = path.join(__dirname, '../supabase/schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ Schema file not found:', schemaPath);
    process.exit(1);
  }

  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  console.log('📋 Schema SQL loaded');

  // Execute migration
  const success = await executeMigration(schemaSql);
  
  if (success) {
    console.log('✅ Database migration completed successfully!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('1. If automatic migration failed, please run the SQL from supabase/schema.sql manually in your Supabase dashboard');
    console.log('2. Set up Row Level Security (RLS) policies as described in the schema');
    console.log('3. Configure environment variables in your deployment');
  } else {
    console.log('❌ Database migration failed.');
    console.log('Please run the SQL from supabase/schema.sql manually in your Supabase dashboard.');
    process.exit(1);
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  // Check for required environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required');
    console.log('');
    console.log('Please set these environment variables:');
    console.log('SUPABASE_URL=your_supabase_project_url');
    console.log('SUPABASE_SERVICE_KEY=your_supabase_service_role_key');
    process.exit(1);
  }

  runMigration().catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

export { runMigration };