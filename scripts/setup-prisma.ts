import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function setupPrisma() {
  console.log('🚀 Prisma Setup Instructions');
  console.log('============================\n');

  console.log('Step 1: Set up PostgreSQL Database');
  console.log('-----------------------------------');
  console.log('1. Create a PostgreSQL database (you can use:');
  console.log('   - Prisma Data Platform (recommended)');
  console.log('   - Railway.app');
  console.log('   - Supabase (PostgreSQL)');
  console.log('   - Neon.tech');
  console.log('   - Your own PostgreSQL server\n');

  console.log('Step 2: Configure Environment Variables');
  console.log('---------------------------------------');
  console.log('Update your .env.local file with:');
  console.log('DATABASE_URL=your_postgresql_connection_string');
  console.log('MASTER_API_KEY=your_master_api_key_here\n');

  console.log('Step 3: Generate Prisma Client');
  console.log('------------------------------');
  console.log('Run: pnpm prisma generate\n');

  console.log('Step 4: Push Database Schema');
  console.log('----------------------------');
  console.log('Run: pnpm prisma db push\n');

  console.log('Step 5: Run Data Migration');
  console.log('--------------------------');
  console.log('After setting up the database, run:');
  console.log('pnpm tsx scripts/convert-data.ts\n');

  console.log('Step 6: Test Application');
  console.log('------------------------');
  console.log('Start the development server:');
  console.log('./scripts/dev.sh\n');

  // Check if DATABASE_URL is set
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl && databaseUrl !== 'your_postgresql_connection_string') {
    console.log('✅ DATABASE_URL is configured');
    console.log('Run "pnpm prisma generate" and "pnpm prisma db push" to set up the database');
  } else {
    console.log('ℹ️  Set DATABASE_URL in .env.local to continue');
  }
}

setupPrisma().catch(console.error);