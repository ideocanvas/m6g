#!/usr/bin/env node

/**
 * Generate a secure API key
 * This script generates a cryptographically secure random API key
 */

import crypto from 'crypto';

function generateApiKey(length = 64) {
  // Generate a secure random string
  const buffer = crypto.randomBytes(length);
  return buffer.toString('hex');
}

// Generate the API key
const apiKey = generateApiKey();
console.log('Generated Master API Key:');
console.log(apiKey);
console.log('\nTo set this as a Cloudflare secret, run:');
console.log(`npx wrangler secret put MASTER_API_KEY`);
console.log('\nThen paste the key when prompted.');