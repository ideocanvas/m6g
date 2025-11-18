import { PrismaClient } from "@prisma/client";

// Create Prisma client based on DATABASE_URL
function createPrismaClient(useAccelerate?: boolean) {
  const databaseUrl = process.env.DATABASE_URL;
  console.log('databaseUrl', databaseUrl);
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

// Get DATABASE_URL from environment
const databaseUrl = process.env.DATABASE_URL
console.log("databaseUrl", databaseUrl)
// Auto-detect if accelerate should be used based on DATABASE_URL
const useAccelerate = databaseUrl?.startsWith('prisma://') || databaseUrl?.startsWith('prisma+postgres://')

// Create Prisma client with conditional Accelerate extension
export const prisma = createPrismaClient(useAccelerate) as PrismaClient;