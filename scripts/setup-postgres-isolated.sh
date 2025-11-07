#!/bin/bash
# =============================================================================
# PostgreSQL Isolated Database Setup for Alessa Ordering
# =============================================================================
# Creates a dedicated PostgreSQL role and database for the alessa-ordering
# project to ensure complete isolation from other projects (e.g., azteka-dsd).
#
# This script should be run ONCE during initial setup or when rebuilding
# the database environment from scratch.
# =============================================================================

set -e  # Exit on any error

echo "🔧 Setting up isolated PostgreSQL environment for Alessa Ordering..."

# Configuration
DB_NAME="alessa_ordering"
DB_USER="alessa_ordering_user"
DB_PASS="alessa_secure_2024"
POSTGRES_SUPERUSER="ernestoponce"  # Your superuser account

echo ""
echo "📋 Configuration:"
echo "   Database: ${DB_NAME}"
echo "   Role:     ${DB_USER}"
echo "   Owner:    ${POSTGRES_SUPERUSER}"
echo ""

# Step 1: Create the role
echo "1️⃣  Creating PostgreSQL role '${DB_USER}'..."
psql -U ${POSTGRES_SUPERUSER} -d postgres -c "
  DO \$\$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
      CREATE ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASS}';
      RAISE NOTICE 'Role ${DB_USER} created';
    ELSE
      RAISE NOTICE 'Role ${DB_USER} already exists';
    END IF;
  END
  \$\$;
" || { echo "❌ Failed to create role"; exit 1; }

# Step 2: Create the database
echo "2️⃣  Creating database '${DB_NAME}'..."
DB_EXISTS=$(psql -U ${POSTGRES_SUPERUSER} -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'")
if [ -z "$DB_EXISTS" ]; then
  psql -U ${POSTGRES_SUPERUSER} -d postgres -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" || { echo "❌ Failed to create database"; exit 1; }
  echo "   ✓ Database created"
else
  echo "   ℹ️  Database already exists, skipping..."
fi

# Step 3: Grant privileges
echo "3️⃣  Granting privileges..."
psql -U ${POSTGRES_SUPERUSER} -d postgres -c "
  GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
" || { echo "❌ Failed to grant privileges"; exit 1; }

# Grant schema privileges (needed for PostgreSQL 15+)
psql -U ${POSTGRES_SUPERUSER} -d ${DB_NAME} -c "
  GRANT ALL ON SCHEMA public TO ${DB_USER};
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${DB_USER};
  GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};
" || { echo "⚠️  Warning: Could not set schema privileges (may not be critical)"; }

# Step 4: Verify connection
echo "4️⃣  Verifying database connection..."
PGPASSWORD=${DB_PASS} psql -h localhost -U ${DB_USER} -d ${DB_NAME} -c '\l' > /dev/null 2>&1 || {
  echo "❌ Connection test failed"
  exit 1
}

echo "✅ Database connection verified!"
echo ""

# Step 5: Display environment variable configuration
echo "5️⃣  Update your .env file with:"
echo ""
echo "DATABASE_URL=\"postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}?schema=public\""
echo ""

# Step 6: Next steps
echo "📝 Next steps:"
echo ""
echo "   1. Update .env with the DATABASE_URL above"
echo "   2. Run: npm run db:setup"
echo "   3. Start dev server: npm run dev"
echo ""
echo "✨ Setup complete!"
