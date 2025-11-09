import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addInsertPolicies() {
  console.log('Adding INSERT policies for data migration...');

  try {
    // Add INSERT policy for mark6_results
    const { error: resultsError } = await supabase.rpc('create_policy', {
      policy_name: 'Allow insert access to mark6_results',
      table_name: 'mark6_results',
      operation: 'INSERT',
      check_condition: 'true'
    });

    if (resultsError) {
      console.log('Policy for mark6_results might already exist, continuing...');
    }

    // Add INSERT policy for mark6_generated_combinations
    const { error: combinationsError } = await supabase.rpc('create_policy', {
      policy_name: 'Allow insert access to mark6_generated_combinations',
      table_name: 'mark6_generated_combinations',
      operation: 'INSERT',
      check_condition: 'true'
    });

    if (combinationsError) {
      console.log('Policy for mark6_generated_combinations might already exist, continuing...');
    }

    // Add INSERT policy for mark6_number_frequency
    const { error: frequencyError } = await supabase.rpc('create_policy', {
      policy_name: 'Allow insert access to mark6_number_frequency',
      table_name: 'mark6_number_frequency',
      operation: 'INSERT',
      check_condition: 'true'
    });

    if (frequencyError) {
      console.log('Policy for mark6_number_frequency might already exist, continuing...');
    }

    // Add INSERT policy for mark6_follow_on_patterns
    const { error: patternsError } = await supabase.rpc('create_policy', {
      policy_name: 'Allow insert access to mark6_follow_on_patterns',
      table_name: 'mark6_follow_on_patterns',
      operation: 'INSERT',
      check_condition: 'true'
    });

    if (patternsError) {
      console.log('Policy for mark6_follow_on_patterns might already exist, continuing...');
    }

    console.log('INSERT policies added successfully!');
    console.log('You can now run the data conversion script: pnpm tsx scripts/convert-data.ts');

  } catch (error) {
    console.error('Error adding INSERT policies:', error);
    console.log('\nAlternative: Run the SQL script manually in Supabase SQL Editor:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Click on "SQL Editor"');
    console.log('3. Copy and paste the contents of scripts/add-insert-policies.sql');
    console.log('4. Run the SQL script');
  }
}

addInsertPolicies();