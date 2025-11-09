# Mark Six Lottery Application

A modern Mark Six lottery application built with Next.js, TypeScript, and Supabase. This application provides historical draw results, number generation algorithms, and statistical analysis for the Hong Kong Mark Six lottery.

## Features

- **Historical Draw Results**: View and search all historical Mark Six draw results
- **Number Generation**: Multiple generation algorithms (V1, V2, AI, Qimen)
- **Statistical Analysis**: Hot/cold number analysis and follow-on patterns
- **Multi-language Support**: English and Traditional Chinese
- **RESTful API**: Protected API for fetching latest HKJC data
- **Modern UI**: Responsive design with dark/light mode support

## Tech Stack

- **Frontend**: Next.js 15.4.6, React 19.1.0, TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Deployment**: Cloudflare Pages with OpenNextJS

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm package manager
- PostgreSQL database (Prisma Data Platform, Railway, Supabase, Neon, etc.)

### Installation

1. **Clone and install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your database credentials:
   ```
   DATABASE_URL=your_postgresql_connection_string
   MASTER_API_KEY=your_master_api_key_here
   ```

3. **Set up Prisma and database:**
   ```bash
   pnpm tsx scripts/setup-prisma.ts
   ```
   Follow the instructions to:
   - Generate Prisma client
   - Push database schema
   - Migrate existing data

4. **Generate Prisma client and set up database:**
   ```bash
   pnpm prisma generate
   pnpm prisma db push
   pnpm tsx scripts/convert-data-prisma.ts
   ```

**Note**: The application uses a shared Prisma client from `src/lib/prisma.ts` that includes Accelerate extension for better performance.

5. **Start development server:**
   ```bash
   ./scripts/dev.sh
   ```

## Database Schema

The application uses Prisma with the following main models:

- `MarkSixResult`: Historical draw results from HKJC
- `MarkSixGeneratedCombination`: User-generated number combinations
- `MarkSixNumberFrequency`: Number frequency analysis data
- `MarkSixFollowOnPattern`: Statistical relationships between draws
- `MarkSixApiLog`: API access logs

See `prisma/schema.prisma` for the complete schema definition.

## API Endpoints

### Public Endpoints

- `GET /api/draws` - Get historical draw results
- `GET /api/analysis` - Get statistical analysis
- `POST /api/combinations` - Generate number combinations

### Protected Endpoints (require MASTER_API_KEY)

- `POST /api/draws` - Fetch latest draw results from HKJC API
- `GET /api/draws/latest` - Get the latest draw result

## Number Generation Algorithms

- **V1**: Basic random number generation
- **V2**: Enhanced algorithm with statistical weighting
- **AI**: Machine learning-based prediction
- **Qimen**: Traditional Chinese numerology method

## Development

### Scripts

- `./scripts/dev.sh` - Start development server
- `./scripts/eslint.sh` - Run ESLint checks
- `pnpm build` - Build for production
- `pnpm start` - Start production server

### Data Migration

The application includes scripts to convert existing data from the legacy Parse platform format:

- `scripts/convert-data-prisma.ts` - Convert and migrate JSON data to PostgreSQL
- `scripts/setup-prisma.ts` - Prisma setup instructions

## Deployment

### Cloudflare Pages

The application is configured for deployment on Cloudflare Pages:

1. Connect your GitHub repository to Cloudflare Pages
2. Set environment variables in Cloudflare dashboard
3. Deploy automatically on git push

### Environment Variables for Production

- `DATABASE_URL`
- `MASTER_API_KEY`

## Security

- Master API key required for HKJC data fetching
- Input validation and sanitization
- Database access controlled through Prisma

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `./scripts/eslint.sh` to ensure code quality
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the existing documentation
2. Review the database schema in `prisma/schema.prisma`
3. Check API documentation in the source code
