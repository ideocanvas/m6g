import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// This script helps set up Supabase using the dashboard SQL editor
// and then runs data migration with the anon key

async function setupSupabase() {
  console.log('🚀 Supabase Setup Instructions');
  console.log('==============================\n');

  console.log('Step 1: Create Tables via SQL Editor');
  console.log('-------------------------------------');
  console.log('1. Go to your Supabase project dashboard');
  console.log('2. Click on "SQL Editor" in the left sidebar');
  console.log('3. Copy and paste the SQL from supabase/schema.sql');
  console.log('4. Click "Run" to execute\n');

  // Read and display the schema
  const schemaPath = join(process.cwd(), 'supabase/schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  console.log('Schema SQL to copy:');
  console.log('```sql');
  console.log(schema);
  console.log('```\n');

  console.log('Step 2: Add INSERT Policies (Required for Data Migration)');
  console.log('---------------------------------------------------------');
  console.log('1. In the SQL Editor, copy and paste the SQL from scripts/add-insert-policies.sql');
  console.log('2. Click "Run" to add INSERT permissions\n');
  
  // Read and display the INSERT policies SQL
  const policiesPath = join(process.cwd(), 'scripts/add-insert-policies.sql');
  const policies = readFileSync(policiesPath, 'utf-8');
  console.log('INSERT Policies SQL to copy:');
  console.log('```sql');
  console.log(policies);
  console.log('```\n');

  console.log('Step 3: Run Data Migration');
  console.log('--------------------------');
  console.log('After adding INSERT policies, run:');
  console.log('pnpm tsx scripts/convert-data.ts\n');

  console.log('Step 4: Verify Setup');
  console.log('--------------------');
  console.log('Check that tables were created correctly:');
  console.log('- mark6_results');
  console.log('- mark6_generated_combinations\n');

  console.log('Step 5: Test Application');
  console.log('------------------------');
  console.log('Start the development server:');
  console.log('./scripts/dev.sh');
}

setupSupabase().catch(console.error);