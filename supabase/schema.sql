-- Supabase Schema for Mark Six Lottery Application
-- This schema supports both historical draw results and generated number combinations

-- Enable UUID extension for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Mark Six Draw Results Table
-- Stores historical draw results from HKJC
CREATE TABLE IF NOT EXISTS mark6_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    draw_id VARCHAR(50) NOT NULL UNIQUE, -- HKJC draw ID (e.g., "23/125")
    draw_date TIMESTAMP WITH TIME ZONE NOT NULL,
    date_text VARCHAR(10) NOT NULL, -- Formatted date (DD/MM/YYYY)
    winning_numbers INTEGER[] NOT NULL, -- Array of 6 winning numbers
    special_number INTEGER NOT NULL, -- Special number
    snowball_code VARCHAR(50), -- Snowball code if applicable
    snowball_name_en VARCHAR(100), -- Snowball name in English
    snowball_name_ch VARCHAR(100), -- Snowball name in Chinese
    total_investment BIGINT, -- Total investment amount
    jackpot BIGINT, -- Jackpot amount
    unit_bet INTEGER, -- Unit bet amount
    estimated_prize BIGINT, -- Estimated prize amount
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mark Six Generated Combinations Table
-- Stores user-generated number combinations
CREATE TABLE IF NOT EXISTS mark6_generated_combinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    generation_id VARCHAR(50) NOT NULL, -- Unique generation session ID
    sequence_number INTEGER NOT NULL, -- Sequence within generation
    combination_numbers INTEGER[] NOT NULL, -- Array of numbers (6 or 7)
    is_double BOOLEAN DEFAULT FALSE, -- Whether this is a double combination (7 numbers)
    generation_method VARCHAR(20) NOT NULL, -- 'v1', 'v2', 'ai', 'qimen'
    selected_numbers INTEGER[], -- User selected numbers used in generation
    lucky_number INTEGER, -- Lucky number used in generation
    combination_count INTEGER, -- Total combinations in this generation
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Number Frequency Analysis Table
-- Stores frequency analysis data for optimization
CREATE TABLE IF NOT EXISTS mark6_number_frequency (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_date DATE NOT NULL,
    analysis_type VARCHAR(20) NOT NULL, -- 'hot', 'cold', 'follow_on'
    days_of_history INTEGER NOT NULL, -- Number of days analyzed
    number INTEGER NOT NULL,
    frequency INTEGER NOT NULL, -- Count of appearances
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Follow-on Patterns Table
-- Stores statistical relationships between consecutive draws
CREATE TABLE IF NOT EXISTS mark6_follow_on_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_date DATE NOT NULL,
    days_of_history INTEGER NOT NULL,
    trigger_number INTEGER NOT NULL, -- Number from previous draw
    follow_number INTEGER NOT NULL, -- Number that follows in next draw
    frequency INTEGER NOT NULL, -- Count of this pattern
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Access Log Table
-- Logs API access for monitoring and security
CREATE TABLE IF NOT EXISTS mark6_api_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint VARCHAR(100) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER,
    user_agent TEXT,
    ip_address INET,
    request_body JSONB,
    response_body JSONB,
    response_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_mark6_results_draw_date ON mark6_results(draw_date);
CREATE INDEX IF NOT EXISTS idx_mark6_results_draw_id ON mark6_results(draw_id);
CREATE INDEX IF NOT EXISTS idx_mark6_generated_combinations_generation_id ON mark6_generated_combinations(generation_id);
CREATE INDEX IF NOT EXISTS idx_mark6_generated_combinations_generated_at ON mark6_generated_combinations(generated_at);
CREATE INDEX IF NOT EXISTS idx_mark6_number_frequency_analysis_date ON mark6_number_frequency(analysis_date);
CREATE INDEX IF NOT EXISTS idx_mark6_number_frequency_number ON mark6_number_frequency(number);
CREATE INDEX IF NOT EXISTS idx_mark6_follow_on_patterns_trigger_number ON mark6_follow_on_patterns(trigger_number);
CREATE INDEX IF NOT EXISTS idx_mark6_api_logs_created_at ON mark6_api_logs(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for mark6_results table
CREATE TRIGGER update_mark6_results_updated_at BEFORE UPDATE ON mark6_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries

-- View for recent draws with formatted data
CREATE OR REPLACE VIEW recent_draws AS
SELECT 
    draw_id,
    date_text,
    winning_numbers,
    special_number,
    draw_date
FROM mark6_results
ORDER BY draw_date DESC
LIMIT 100;

-- View for hot numbers (most frequent in last 100 draws)
CREATE OR REPLACE VIEW hot_numbers AS
SELECT 
    number,
    COUNT(*) as frequency
FROM (
    SELECT UNNEST(winning_numbers) as number FROM mark6_results 
    UNION ALL 
    SELECT special_number as number FROM mark6_results
) all_numbers
GROUP BY number
ORDER BY frequency DESC;

-- View for cold numbers (least frequent in last 100 draws)
CREATE OR REPLACE VIEW cold_numbers AS
SELECT 
    number,
    COUNT(*) as frequency
FROM (
    SELECT UNNEST(winning_numbers) as number FROM mark6_results 
    UNION ALL 
    SELECT special_number as number FROM mark6_results
) all_numbers
GROUP BY number
ORDER BY frequency ASC;

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables for security
ALTER TABLE mark6_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE mark6_generated_combinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mark6_number_frequency ENABLE ROW LEVEL SECURITY;
ALTER TABLE mark6_follow_on_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE mark6_api_logs ENABLE ROW LEVEL SECURITY;

-- Policies for public read access (no authentication required as per requirements)
CREATE POLICY "Allow public read access to mark6_results" ON mark6_results
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to mark6_generated_combinations" ON mark6_generated_combinations
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to mark6_number_frequency" ON mark6_number_frequency
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to mark6_follow_on_patterns" ON mark6_follow_on_patterns
    FOR SELECT USING (true);

-- Policies for API logs (read-only for public, insert for API)
CREATE POLICY "Allow public read access to mark6_api_logs" ON mark6_api_logs
    FOR SELECT USING (true);

CREATE POLICY "Allow API insert access to mark6_api_logs" ON mark6_api_logs
    FOR INSERT WITH CHECK (true);

-- Note: The application will use MASTER_API_KEY for write operations to results table
-- This is handled at the application level, not database level