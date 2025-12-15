-- AlterTable
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "templateType" TEXT DEFAULT 'restaurant';
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "gradientFrom" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "gradientVia" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "gradientTo" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "templateConfig" JSONB;
