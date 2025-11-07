# 🚀 Quick Start: PostgreSQL Isolated Setup

This is a **parallel setup** to your azteka-dsd project, ensuring complete database isolation.

## 🎯 One-Command Setup

```bash
cd ~/alessa-ordering
./scripts/setup-postgres-isolated.sh
```

## 📋 What Gets Created

| Project | Database | Role | Password |
|---------|----------|------|----------|
| **azteka-dsd** | `azteka_dsd` | `azteka_user` | `azteka_pass` |
| **alessa-ordering** | `alessa_ordering` | `alessa_ordering_user` | `alessa_secure_2024` |

Each project is **completely isolated** with separate credentials and privileges.

## ⚙️ After Setup

### 1. Update `.env`

Replace your current DATABASE_URL with:

```env
DATABASE_URL="postgresql://alessa_ordering_user:alessa_secure_2024@localhost:5432/alessa_ordering?schema=public"
```

### 2. Initialize database

```bash
npm run db:setup
```

This runs:
- `prisma generate` - Generates Prisma client
- `prisma db push` - Creates tables from schema
- `db:seed` - Seeds demo tenants (La Poblanita, Casa Bonita, The Golden Spoon)

### 3. Start development

```bash
npm run dev
```

Visit http://localhost:3000/order

## 🔍 Verify Isolation

Run the verification script to confirm proper isolation:

```bash
./scripts/verify-postgres-isolation.sh
```

Expected output:
```
✅ Isolation verified: alessa_ordering_user cannot access azteka_dsd
```

## 🛠️ Troubleshooting

### Database already exists?

If you're migrating from your current setup:

```bash
# Backup current data
pg_dump -U alessa -d alessa_db > backup_before_migration.sql

# Run the setup script (it will handle existing resources)
./scripts/setup-postgres-isolated.sh

# Restore data to new database (if needed)
PGPASSWORD=alessa_secure_2024 psql -h localhost -U alessa_ordering_user -d alessa_ordering < backup_before_migration.sql
```

### Permission errors?

```bash
# Re-run privilege grants
psql -U ernestoponce -d alessa_ordering -c "
  GRANT ALL ON SCHEMA public TO alessa_ordering_user;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO alessa_ordering_user;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO alessa_ordering_user;
"
```

## 📚 Full Documentation

See [docs/DATABASE_SETUP.md](docs/DATABASE_SETUP.md) for:
- Manual setup steps
- Production considerations
- Backup/restore procedures
- Connection pooling configuration
- Security best practices

## 🔄 Reset Everything (Nuclear Option)

```bash
# Drop everything and start fresh
psql -U ernestoponce -d postgres -c "DROP DATABASE IF EXISTS alessa_ordering;"
psql -U ernestoponce -d postgres -c "DROP ROLE IF EXISTS alessa_ordering_user;"

# Re-run setup
./scripts/setup-postgres-isolated.sh
npm run db:setup
```

---

**Your azteka-dsd setup remains completely untouched!** ✅
