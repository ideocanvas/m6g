-- Add INSERT policies for data migration
-- This script should be run in Supabase SQL Editor to allow data insertion

-- Policy for inserting mark6_results (allow all inserts for data migration)
CREATE POLICY "Allow insert access to mark6_results" ON mark6_results
    FOR INSERT WITH CHECK (true);

-- Policy for inserting mark6_generated_combinations (allow all inserts for data migration)
CREATE POLICY "Allow insert access to mark6_generated_combinations" ON mark6_generated_combinations
    FOR INSERT WITH CHECK (true);

-- Policy for inserting mark6_number_frequency (allow all inserts for data migration)
CREATE POLICY "Allow insert access to mark6_number_frequency" ON mark6_number_frequency
    FOR INSERT WITH CHECK (true);

-- Policy for inserting mark6_follow_on_patterns (allow all inserts for data migration)
CREATE POLICY "Allow insert access to mark6_follow_on_patterns" ON mark6_follow_on_patterns
    FOR INSERT WITH CHECK (true);

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename LIKE 'mark6%'
ORDER BY tablename, policyname;