# PostgreSQL Isolated Database Setup

This guide ensures the Alessa Ordering project has a **completely isolated** PostgreSQL database, separate from your other projects (e.g., azteka-dsd).

## Why Isolated Setup?

✅ **Security**: Each project has its own credentials
✅ **Data Isolation**: No risk of cross-project contamination
✅ **Privilege Control**: Least-privilege access per project
✅ **Production Mirroring**: Matches how databases are structured in production

---

## Quick Setup (Automated)

### Option A: Run the setup script

```bash
cd ~/alessa-ordering
chmod +x scripts/setup-postgres-isolated.sh
./scripts/setup-postgres-isolated.sh
```

The script will:
1. Create role `alessa_ordering_user`
2. Create database `alessa_ordering`
3. Grant all necessary privileges
4. Verify the connection
5. Display the DATABASE_URL for your `.env`

### Then update your `.env`:

```bash
DATABASE_URL="postgresql://alessa_ordering_user:alessa_secure_2024@localhost:5432/alessa_ordering?schema=public"
```

### Finally, initialize the database:

```bash
npm run db:setup
```

---

## Manual Setup (Step-by-Step)

If you prefer manual control or need to troubleshoot:

### 1️⃣ Create the PostgreSQL role

```bash
psql -U ernestoponce -d postgres -c "CREATE ROLE alessa_ordering_user WITH LOGIN PASSWORD 'alessa_secure_2024';"
```

### 2️⃣ Create the database

```bash
psql -U ernestoponce -d postgres -c "CREATE DATABASE alessa_ordering OWNER alessa_ordering_user;"
```

### 3️⃣ Grant privileges

```bash
psql -U ernestoponce -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE alessa_ordering TO alessa_ordering_user;"
```

### 4️⃣ Grant schema privileges (PostgreSQL 15+)

```bash
psql -U ernestoponce -d alessa_ordering -c "
  GRANT ALL ON SCHEMA public TO alessa_ordering_user;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO alessa_ordering_user;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO alessa_ordering_user;
"
```

### 5️⃣ Verify connection

```bash
PGPASSWORD=alessa_secure_2024 psql -h localhost -U alessa_ordering_user -d alessa_ordering -c '\l'
```

You should see the database list without errors.

### 6️⃣ Update `.env`

```env
DATABASE_URL="postgresql://alessa_ordering_user:alessa_secure_2024@localhost:5432/alessa_ordering?schema=public"
```

### 7️⃣ Initialize Prisma and seed data

```bash
cd ~/alessa-ordering
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:seed          # Seed initial data
```

### 8️⃣ Start the application

```bash
npm run dev
```

Visit http://localhost:3000/order to verify the setup.

---

## Database Management Commands

### Check active databases and roles

```bash
# List all databases
psql -U ernestoponce -d postgres -c '\l'

# List all roles
psql -U ernestoponce -d postgres -c '\du'

# Check current database size
psql -U ernestoponce -d postgres -c "
  SELECT pg_size_pretty(pg_database_size('alessa_ordering')) AS size;
"
```

### Reset database (destructive)

```bash
# Drop and recreate everything
psql -U ernestoponce -d postgres -c "DROP DATABASE IF EXISTS alessa_ordering;"
psql -U ernestoponce -d postgres -c "DROP ROLE IF EXISTS alessa_ordering_user;"

# Then re-run the setup script
./scripts/setup-postgres-isolated.sh
npm run db:setup
```

### Backup and restore

```bash
# Backup
pg_dump -U alessa_ordering_user -d alessa_ordering > backup_$(date +%Y%m%d).sql

# Restore
psql -U alessa_ordering_user -d alessa_ordering < backup_20240115.sql
```

---

## Troubleshooting

### "password authentication failed"

Ensure the password in your `DATABASE_URL` matches what was set during role creation.

### "permission denied for schema public"

Run the schema privileges commands from step 4 of the manual setup.

### "database already exists"

If you're migrating from an existing setup:

```bash
# Option 1: Drop and recreate (loses data)
psql -U ernestoponce -d postgres -c "DROP DATABASE alessa_ordering;"
./scripts/setup-postgres-isolated.sh

# Option 2: Keep existing database, just create role
psql -U ernestoponce -d postgres -c "CREATE ROLE alessa_ordering_user WITH LOGIN PASSWORD 'alessa_secure_2024';"
psql -U ernestoponce -d postgres -c "ALTER DATABASE alessa_ordering OWNER TO alessa_ordering_user;"
```

### Connection pooling (for production)

Add connection pooling to your `DATABASE_URL`:

```env
DATABASE_URL="postgresql://alessa_ordering_user:alessa_secure_2024@localhost:5432/alessa_ordering?schema=public&connection_limit=10&pool_timeout=30"
```

---

## Verifying Isolation

To confirm your databases are properly isolated:

```bash
# Check azteka-dsd is separate
psql -U ernestoponce -d postgres -c "
  SELECT datname, datdba::regrole AS owner
  FROM pg_database
  WHERE datname IN ('azteka_dsd', 'alessa_ordering');
"
```

Expected output:
```
     datname      |        owner
------------------+---------------------
 azteka_dsd       | azteka_user
 alessa_ordering  | alessa_ordering_user
```

Each project has its own owner role! ✅

---

## Production Considerations

When deploying to production:

1. **Use strong passwords**: Generate with `openssl rand -base64 32`
2. **Use environment-specific credentials**: Different passwords for dev/staging/prod
3. **Enable SSL**: Add `?sslmode=require` to your DATABASE_URL
4. **Connection pooling**: Use PgBouncer or configure Prisma connection limits
5. **Backup strategy**: Automate daily backups with retention policy

Example production DATABASE_URL:
```env
DATABASE_URL="postgresql://alessa_prod_user:STRONG_RANDOM_PASSWORD@db.example.com:5432/alessa_prod?schema=public&sslmode=require&connection_limit=20"
```
