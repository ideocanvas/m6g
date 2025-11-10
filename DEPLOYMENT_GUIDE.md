# Cloudflare Deployment Guide for M6G

This guide will walk you through deploying your Next.js application to Cloudflare Workers using OpenNext.

## Prerequisites

- ✅ Cloudflare account
- ✅ Wrangler CLI authenticated (`npx wrangler whoami` shows your account)
- ✅ Required environment variables

## Step 1: Set Up Environment Variables as Secrets

You need to set up the following secrets in Cloudflare. Run these commands and provide the actual values:

```bash
# Database configuration
npx wrangler secret put DATABASE_URL

# API keys
npx wrangler secret put MASTER_API_KEY
npx wrangler secret put KLUSTER_API_KEY
```

**Note:** The `DATABASE_URL` secret has already been set up.

## Step 2: Build the Application

Build the application for production:

```bash
pnpm run build
```

This will create the `.open-next` directory with the optimized build.

## Step 3: Deploy to Cloudflare

Deploy the application using OpenNext:

```bash
pnpm run deploy
```

This command will:
1. Build the application with OpenNext
2. Deploy it to Cloudflare Workers
3. Provide you with the deployment URL

## Alternative: Preview Deployment

If you want to test the deployment first, use the preview command:

```bash
pnpm run preview
```

## Step 4: Verify Deployment

After deployment, verify that your application is working by:

1. Visiting the provided URL
2. Testing the API endpoints
3. Checking the Cloudflare dashboard for any errors

## Environment Variables Reference

The following environment variables are required:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Prisma database connection string | ✅ |
| `MASTER_API_KEY` | Your master API key | ✅ |
| `KLUSTER_API_KEY` | Kluster AI API key | ✅ |
| `HKJC_API_ENDPOINT` | HKJC API endpoint | ❌ (has default) |

## Troubleshooting

### Common Issues

1. **Missing Secrets**: Make sure all required secrets are set using `wrangler secret put`
2. **Build Errors**: Run `pnpm run lint` to check for code issues
3. **Database Connection**: Verify your `DATABASE_URL` is correct and accessible

### Useful Commands

```bash
# Check deployment status
npx wrangler deployments list

# View logs
npx wrangler tail

# Update environment variables
npx wrangler secret put VARIABLE_NAME

# Remove deployment
npx wrangler delete
```

## Continuous Deployment

For automated deployments, you can set up GitHub Actions or other CI/CD pipelines that run the deployment commands on push to your main branch.

## Support

If you encounter issues:
1. Check the Cloudflare Workers dashboard for error logs
2. Verify all environment variables are set correctly
3. Ensure your database is accessible from Cloudflare's network