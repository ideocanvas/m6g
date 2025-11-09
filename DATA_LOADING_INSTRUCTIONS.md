# Data Loading Instructions

This document explains how to load your existing Mark Six data into the PostgreSQL database using Prisma.

## Prerequisites

1. **Database Setup**: Make sure you have:
   - Created a PostgreSQL database
   - Set `DATABASE_URL` in `.env.local`
   - Generated Prisma client: `pnpm prisma generate`
   - Created database tables: `pnpm prisma db push`

2. **Data Files**: Ensure your JSON data files exist in `docs/data/`:
   - `UfxCdaMarksixResults.json` - Historical draw results
   - `UfxCdaMarksixRecords.json` - Generated combinations

## Step-by-Step Data Loading

### Step 1: Verify Data Files
Check that your data files exist:
```bash
ls -la docs/data/
```
You should see:
- `UfxCdaMarksixResults.json`
- `UfxCdaMarksixRecords.json`

### Step 2: Run Data Conversion Script
Execute the data conversion script:
```bash
pnpm tsx scripts/convert-data-prisma.ts
```

### Step 3: Monitor the Process
The script will:
1. Load and parse the JSON files
2. Convert data to Prisma format
3. Insert data in batches to avoid overwhelming the database
4. Show progress for each batch

**Expected Output:**
```
Starting data conversion with Prisma...
Loaded 4717 draw results and 5043 generated combinations
Converted 4717 draw results
Converted 5043 generated combinations
Inserting data into database...
Inserted batch 1 of draw results
Inserted batch 2 of draw results
...
Inserted batch 1 of generated combinations
...
Data conversion completed successfully!
Inserted 4717 draw results and 5043 generated combinations
```

### Step 4: Verify Data Load
Check that data was loaded correctly:

**Option A: Use Prisma Studio (Recommended)**
```bash
pnpm prisma studio
```
This opens a web interface where you can browse all tables and verify the data.

**Option B: Check via API**
Start the development server and test the API:
```bash
./scripts/dev.sh
```

Then test the endpoints:
```bash
# Test draw results
curl "http://localhost:3000/api/draws?limit=5"

# Test generated combinations
curl "http://localhost:3000/api/combinations?limit=5"

# Test analysis
curl "http://localhost:3000/api/analysis?type=hot&drawCount=10"
```

## Troubleshooting

### Common Issues

1. **"Data files not found"**
   - Ensure JSON files are in `docs/data/`
   - Check file permissions: `chmod 644 docs/data/*.json`

2. **Database connection errors**
   - Verify `DATABASE_URL` in `.env.local`
   - Test connection: `pnpm tsx scripts/setup-prisma.ts`

3. **Prisma client not generated**
   - Run: `pnpm prisma generate`

4. **Tables don't exist**
   - Run: `pnpm prisma db push`

5. **Batch insertion errors**
   - The script will continue with individual record insertion
   - Check console output for specific error details

### Manual Data Inspection

You can also manually inspect the data files:
```bash
# Check file structure
head -n 50 docs/data/UfxCdaMarksixResults.json

# Count records
jq '.UfxCdaMarksixResults | length' docs/data/UfxCdaMarksixResults.json
jq '.UfxCdaMarksixRecords | length' docs/data/UfxCdaMarksixRecords.json
```

## Data Structure

The conversion script handles:

**Draw Results (`mark6_results` table):**
- Draw ID, date, winning numbers, special number
- Snowball information, investment amounts
- Timestamps

**Generated Combinations (`mark6_generated_combinations` table):**
- Generation session ID, sequence numbers
- Number combinations, generation method
- User selections, lucky numbers

## Performance Notes

- Data is loaded in batches of 100 records
- The script handles duplicate records gracefully
- Progress is shown for each batch
- Errors in individual records don't stop the entire process

## Next Steps

After successful data loading:
1. Test the application: `./scripts/dev.sh`
2. Verify all features work correctly
3. Deploy to production if ready