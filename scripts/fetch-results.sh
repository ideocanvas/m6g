#!/bin/bash

# set DIR as the current scripts directory
DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
source <(grep -v '^#' $DIR/../.env.local | grep -v '^$' | sed 's/^/export /')

# Script to fetch Mark Six results from HKJC API using curl
# This script calls the POST /api/draws endpoint to fetch latest results

# Set the base URL (default: localhost:3000)
BASE_URL="${NEXT_PUBLIC_BASE_URL:-http://localhost:3000}"

# Get the master API key from environment variable
MASTER_API_KEY="${MASTER_API_KEY}"

if [ -z "$MASTER_API_KEY" ]; then
    echo "❌ Error: MASTER_API_KEY environment variable is not set"
    echo ""
    echo "Usage:"
    echo "  export MASTER_API_KEY=your_master_api_key"
    echo "  ./scripts/fetch-results.sh"
    echo ""
    echo "Or set BASE_URL if different from localhost:3000:"
    echo "  export BASE_URL=https://your-domain.com"
    echo "  export MASTER_API_KEY=your_master_api_key"
    echo "  ./scripts/fetch-results.sh"
    exit 1
fi

echo "🔍 Fetching Mark Six results from HKJC API..."
echo "📡 Base URL: $BASE_URL"

# Make the API call using curl
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MASTER_API_KEY" \
  -d '{}' \
  "$BASE_URL/api/draws"

echo ""
echo "✅ API call completed!"