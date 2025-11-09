# Mark Six Lottery Generator

A modern web application for generating Hong Kong Mark Six lottery combinations with statistical analysis and AI-powered suggestions.

## Features

- **Multiple Generation Algorithms**: V1 (Statistical), V2 (Follow-on Patterns), AI, and Qi Men Dun Jia methods
- **Multi-language Support**: English and Traditional Chinese (繁體中文)
- **Real-time Data**: Fetch latest draw results from HKJC API
- **Smart Suggestions**: Hot/cold number analysis and follow-on pattern detection
- **Modern UI**: Responsive design with Tailwind CSS
- **Data Persistence**: Supabase database for storing results and combinations
- **Share & Export**: Copy combinations and share generation sessions

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Cloudflare Workers via OpenNextJS
- **Authentication**: Master API Key for HKJC data fetching

## Project Structure

```bash
m6g/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── api/               # API routes
│   │   │   ├── draws/         # Draw results endpoints
│   │   │   ├── combinations/  # Combination generation
│   │   │   └── analysis/      # Statistical analysis
│   │   ├── page.tsx           # Main page
│   │   └── layout.tsx         # App layout
│   ├── components/            # React components
│   │   ├── MarkSixGenerator.tsx
│   │   ├── NumberSelection.tsx
│   │   ├── NumberBall.tsx
│   │   └── ResultsPanel.tsx
│   ├── lib/                   # Utility libraries
│   │   ├── generation-algorithms.ts
│   │   └── i18n.ts
│   └── types/                 # TypeScript definitions
│       └── mark6.ts
├── scripts/                   # Utility scripts
│   ├── convert-data.ts       # Data migration
│   └── migrate-database.ts   # Database setup
├── supabase/                 # Database schema
│   └── schema.sql
└── docs/                     # Documentation
    └── reference-programs/   # Original implementation reference
```

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- HKJC API access (for fetching draw results)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd m6g
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your configuration:

   ```env
   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_key

   # Application Configuration
   MASTER_API_KEY=your_master_api_key_here
   NODE_ENV=development
   ```

4. **Set up the database**

   Option A: Run migration script (requires service role key):

   ```bash
   npm run migrate:db
   ```

   Option B: Manual setup:
   - Create a new Supabase project
   - Run the SQL from `supabase/schema.sql` in the SQL editor
   - Configure Row Level Security (RLS) policies

5. **Convert existing data** (optional)

   ```bash
   npm run convert:data
   ```

6. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

### Draw Results

- `GET /api/draws` - Get draw results with optional filtering
- `POST /api/draws` - Fetch latest results from HKJC API (requires MASTER_API_KEY)

### Combinations

- `GET /api/combinations` - Get generated combinations
- `POST /api/combinations` - Generate new combinations

### Analysis

- `GET /api/analysis` - Get number frequency and pattern analysis

## Generation Algorithms

### V1 (Statistical)

- Analyzes historical frequency data
- Uses statistical patterns from past 1 year of draws
- Optimizes combinations based on score calculation

### V2 (Follow-on Patterns)

- Analyzes relationships between consecutive draws
- Uses weighted probabilities based on historical patterns
- Focuses on numbers that frequently follow recent draws

### AI Generation

- Uses external AI services for combination generation
- Incorporates advanced pattern recognition
- (Implementation pending external API integration)

### Qi Men Dun Jia

- Traditional Chinese metaphysical approach
- Based on auspicious timing and elements
- (Implementation pending algorithm refinement)

## Database Schema

The application uses the following main tables:

- `mark6_results` - Historical draw results from HKJC
- `mark6_generated_combinations` - User-generated number combinations
- `mark6_number_frequency` - Frequency analysis data
- `mark6_follow_on_patterns` - Statistical relationship data
- `mark6_api_logs` - API access logs for monitoring

## Deployment

### Cloudflare Workers (via OpenNextJS)

1. **Build the application**

   ```bash
   npm run build
   ```

2. **Deploy to Cloudflare**

   ```bash
   npm run deploy
   ```

3. **Configure environment variables in Cloudflare dashboard**

### Environment Variables for Production

Set the following environment variables in your deployment platform:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `MASTER_API_KEY`

## Usage

1. **Select Numbers**: Choose your preferred numbers or use suggestions
2. **Set Parameters**: Select combination count, lucky number, and generation method
3. **Generate**: Click "Generate" to create combinations
4. **Check Results**: Select a draw date to check against historical results
5. **Share**: Copy combinations or share generation sessions

## Data Sources

- **HKJC GraphQL API**: For fetching latest draw results
- **Historical Data**: Converted from existing JSON datasets
- **Statistical Analysis**: Based on historical draw patterns

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is for educational and personal use. Please ensure compliance with local gambling laws and regulations.

## Disclaimer

This application is for entertainment and educational purposes only. It does not guarantee winning results and should not be used as financial advice. Always gamble responsibly.
