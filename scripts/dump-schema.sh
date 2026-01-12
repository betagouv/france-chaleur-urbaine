#!/bin/bash

# Script to dump database schema in a clean, comparable format
# Usage: ./scripts/dump-schema.sh [dev|prod|local]

set -e

ENV="${1:-local}"

case "$ENV" in
  local)
    OUTPUT_FILE="schema-local.sql"
    ;;
  dev)
    OUTPUT_FILE="schema-dev.sql"
    ;;
  prod)
    OUTPUT_FILE="schema-prod.sql"
    ;;
  *)
    echo "Usage: $0 [local|dev|prod]"
    exit 1
    ;;
esac

echo "Dumping schema from $ENV environment..."
echo "Output: $OUTPUT_FILE"

# Check if PostgreSQL is accessible
echo "Testing database connection to: $DATABASE_URL"
if ! psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
  echo ""
  echo "❌ Error: Cannot connect to PostgreSQL database"
  echo "   URL: $DATABASE_URL"
  echo ""
  echo "Possible causes:"
  echo "  1. PostgreSQL is not running"
  echo "  2. Database does not exist"
  echo "  3. Wrong credentials"
  echo "  4. Firewall blocking connection"
  echo ""
  echo "To start PostgreSQL:"
  echo "  - Docker: docker-compose up -d postgres"
  echo "  - systemd: sudo systemctl start postgresql"
  echo "  - macOS: brew services start postgresql"
  echo ""
  echo "To test connection manually:"
  echo "  psql \"$DATABASE_URL\" -c \"SELECT version();\""
  exit 1
fi
echo "✓ Database connection successful"

# Dump schema with pg_dump (only public schema)
echo "Running pg_dump..."
pg_dump "$DATABASE_URL" \
  --schema=public \
  --schema-only \
  --no-owner \
  --no-privileges \
  --no-tablespaces \
  --no-security-labels \
  > "${OUTPUT_FILE}.raw"

echo "Raw dump has $(wc -l < "${OUTPUT_FILE}.raw") lines"

# Clean up output by removing comments and metadata
cat "${OUTPUT_FILE}.raw" \
  | grep -v "^--" \
  | grep -v "^SET " \
  | grep -v "^SELECT pg_catalog" \
  | grep -v "^\\\\connect" \
  | grep -v "^\\\\restrict" \
  | grep -v "COMMENT ON SCHEMA" \
  | grep -v "CREATE SCHEMA public" \
  | grep -v "knex_migrations" \
  | grep -v "kysely_migration" \
  | sed '/^$/N;/^\n$/D' \
  > "${OUTPUT_FILE}.unsorted"

echo "After cleanup: $(wc -l < "${OUTPUT_FILE}.unsorted") lines"

# Sort the schema for better comparison
echo "Sorting schema statements..."
node scripts/sort-sql-schema.mjs "${OUTPUT_FILE}.unsorted"
mv "${OUTPUT_FILE}.unsorted" "$OUTPUT_FILE"

# Clean up temp file
rm -f "${OUTPUT_FILE}.raw"

echo "✓ Schema dumped and sorted to $OUTPUT_FILE"
echo ""
echo "File size: $(wc -l < "$OUTPUT_FILE") lines"
echo ""
echo "To compare with another environment:"
echo ""
echo "  # Interactive comparison script (recommended)"
echo "  ./scripts/compare-schemas.sh local prod"
echo ""
echo "  # Side-by-side comparison"
echo "  diff -y --width=200 schema-local.sql schema-prod.sql | less"
echo ""
echo "  # Unified diff with context"
echo "  diff -u schema-local.sql schema-prod.sql | less"
echo ""
echo "  # Word-level diff with git (if available)"
echo "  git diff --no-index --word-diff schema-local.sql schema-prod.sql | less"