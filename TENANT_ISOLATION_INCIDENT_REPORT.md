# The Great Tenant Cross-Pollination Incident of December 2025

## A Cautionary Tale for Multi-Tenant SaaS Development

---

## Executive Summary

On December 20, 2025, during a routine pre-handoff check of the Las Reinas Taqueria ordering system, we discovered that **La Poblanita's logo was displaying on Las Reinas' live website**. This incident report documents the root cause, the investigation process, and the permanent safeguards implemented to prevent this from ever happening again.

**Impact:** Live production site showing competitor's branding
**Duration:** Unknown (contamination dated back to November 7, 2025)
**Resolution Time:** ~45 minutes once identified
**Root Cause:** Shared upload directory + accidental commit of wrong tenant's assets

---

## Chapter 1: The Discovery

### What We Expected
A routine smoke test before client handoff. Check Apple Pay, verify Stripe, confirm the site loads.

### What We Found
```
x-tenant-slug: lapoblanita  <-- WRONG TENANT
```

The Las Reinas website was serving La Poblanita's logo. On a LIVE production site. With the client about to demo to THEIR clients.

### The Horror
- Customer orders would show the wrong restaurant branding
- Receipts, emails, everything - wrong logo
- Complete erosion of client trust
- Potential legal issues (trademark, brand confusion)

---

## Chapter 2: The Investigation

### Initial Hypothesis: Port Misconfiguration
Earlier in the session, we'd fixed an nginx port issue (port 4000 vs 3001). We assumed this was related.

**Result:** Port was correct. Nginx was routing to the right app.

### Second Hypothesis: Browser Cache
The server was returning correct headers. Maybe old cache?

**Result:** Hard refresh didn't help. Server was actually serving wrong content.

### Third Hypothesis: Database Corruption
Maybe the tenant record was pointing to wrong logo URL?

**Result:** Database showed correct path: `/tenant/lasreinas/logo.png`

### The Breakthrough
```bash
curl -sI http://localhost:3001/tenant/lasreinas/logo.png
# x-tenant-slug: lapoblanita  <-- WITHOUT Host header, defaults to wrong tenant
```

But wait... the file ITSELF was wrong:
```bash
md5sum /var/www/alessa-ordering/public/uploads/1762414728959-*.png
# 215eaea7dfa07ddc75e8ef874489d53c  <-- This IS La Poblanita's logo!
```

### Root Cause Identified

On **November 7, 2025**, in commit `97b6596` ("Complete Stripe Connect implementation"), someone uploaded La Poblanita's logo files to the shared `/uploads/` directory and committed them to git.

**The contamination was in the ORIGINAL commit.**

All three PNG files in `/public/uploads/` were identical - and they were ALL La Poblanita's logo, not Las Reinas.

```
Commit: 97b6596
Date: Fri Nov 7 11:55:38 2025
Message: "Complete Stripe Connect implementation and deployment setup"

Files added:
- public/uploads/1762414728959-4ee83f80-8187-454c-b9fd-f8638bc3b33d.png  <-- Poblanita
- public/uploads/1762414776753-170d9167-7ed2-44c3-b88b-4ff997b53d83.png  <-- Poblanita
- public/uploads/1762415374713-b27c4cad-42d8-4de1-9965-18d7a2ad96ae.png  <-- Poblanita
```

**The real Las Reinas logo was NEVER in the codebase.** Only placeholder red squares existed in `/tenant/lasreinas/logo.png`.

---

## Chapter 3: The Architectural Flaw

### The Problem: Shared Upload Directory

```
public/
├── uploads/           <-- SHARED BY ALL TENANTS (DANGEROUS!)
│   ├── 1762414728959-xxx.png  (Poblanita's logo, mislabeled)
│   └── ...
├── tenant/
│   ├── lasreinas/
│   │   └── logo.png   (placeholder, not real logo)
│   ├── lapoblanita/
│   │   └── logo.png
│   └── villacorona/
│       └── logo.png
```

### Why This Happened

1. **No tenant isolation in uploads** - All uploaded files go to one directory
2. **Timestamp-based filenames** - No indication of which tenant owns which file
3. **No validation on commit** - Placeholder files were committed as "real" assets
4. **Git pull overwrites** - Manual fixes get wiped by deployments

### The Cascade Effect

1. Developer uploads Poblanita logo during testing
2. Files get committed to git with generic timestamp names
3. Code references these files thinking they're Las Reinas assets
4. Every `git pull` restores the contaminated files
5. Manual fixes are temporary - next deploy breaks it again

---

## Chapter 4: The Resolution

### Immediate Fix (15 minutes)
1. Found real Las Reinas logo: `ReinaLogoNew.png` in client's asset folder
2. Uploaded directly to VPS: `scp ReinaLogoNew.png root@server:/var/www/.../logo.png`
3. Restarted application
4. Verified correct logo serving (70,717 bytes, MD5: `a99855e19057a9e2703a6ec3c79d680e`)

### Permanent Safeguards (30 minutes)

#### 1. Multi-Location Backups
```
/root/PROTECTED_BACKUPS/lasreinas/          # VPS (read-only)
/Volumes/AlessaCloud/PROTECTED_BACKUPS/     # External drive
~/PROTECTED_BACKUPS/                         # Local Mac
v1.1.0-lasreinas-verified                   # Git tag
```

#### 2. Auto-Restore Protection Script
```bash
# /root/protect-lasreinas.sh - Runs every 5 minutes via cron
EXPECTED_MD5="a99855e19057a9e2703a6ec3c79d680e"
CURRENT_MD5=$(md5sum "$LOGO_PATH" | cut -d' ' -f1)

if [ "$CURRENT_MD5" != "$EXPECTED_MD5" ]; then
    cp "$BACKUP_PATH" "$LOGO_PATH"
    echo "[$(date)] Logo restored from protected backup" >> /var/log/lasreinas-protection.log
fi
```

#### 3. Git Protection
- Real logo committed with message: "fix: Add REAL Las Reinas bull logo - DO NOT OVERWRITE"
- Protected tag created: `v1.1.0-lasreinas-verified`

---

## Chapter 5: Lessons Learned

### Rule 1: Tenant Isolation is SACRED

**WRONG:**
```
/public/uploads/           # Shared - ANY tenant's files mixed together
```

**RIGHT:**
```
/public/tenant/{slug}/uploads/    # Each tenant has isolated storage
```

### Rule 2: Never Trust Placeholder Assets

If you see a 4KB "logo.png" that's a solid color square - **IT'S A PLACEHOLDER**.
Real logos are typically 50KB-500KB with actual artwork.

```bash
# Quick check for placeholder vs real asset
ls -la logo.png
# 4,497 bytes = PLACEHOLDER (red square)
# 70,717 bytes = REAL LOGO (actual artwork)
```

### Rule 3: Validate Before Commit

Before committing ANY asset file:
```bash
# Check what you're committing
file public/uploads/*.png
# Should show actual dimensions and type, not just "PNG image data"

# Verify tenant ownership
# Filename should include tenant slug, not just timestamp
```

### Rule 4: Protect Critical Assets

For any production tenant, create:
1. **Immutable backup** with read-only permissions
2. **Auto-restore cron job** checking MD5 hash
3. **Git tag** marking known-good state
4. **Off-site backup** (external drive, cloud)

### Rule 5: Test with Real Data

Never assume placeholders will be replaced. Test with ACTUAL client assets:
- Real logo files
- Real menu images
- Real branding colors

---

## Chapter 6: The Happy Ending

### What's Now Protected

| Asset | Protection Level |
|-------|-----------------|
| Las Reinas Logo | 4-location backup + auto-restore every 5 min |
| Menu Images | Fixed to use tenant-specific paths |
| Stripe Config | Verified: `acct_1Sfp0eBmqcNiYSKM` |
| Tenant Isolation | Middleware correctly routes by subdomain |

### Verification Commands

```bash
# Check logo is correct
curl -s https://lasreinas.alessacloud.com/tenant/lasreinas/logo.png | md5
# Expected: a99855e19057a9e2703a6ec3c79d680e

# Check tenant header
curl -sI https://lasreinas.alessacloud.com/order | grep x-tenant-slug
# Expected: x-tenant-slug: lasreinas

# Check Stripe account
psql -c "SELECT \"stripeAccountId\" FROM \"TenantIntegration\" WHERE \"tenantId\" = 'f941ea79-5af8-4c33-bb17-9a98a992a232';"
# Expected: acct_1Sfp0eBmqcNiYSKM
```

### Client Handoff Status

✅ Real bull logo displaying correctly
✅ Menu items with proper images
✅ Stripe payments route to correct account
✅ Auto-protection running
✅ Multiple backups in place

---

## Appendix A: Architecture Recommendations

### Recommended Upload Structure

```
public/
├── tenant/
│   ├── {tenant-slug}/
│   │   ├── logo.png
│   │   ├── hero.jpg
│   │   ├── uploads/        # Tenant-specific uploads
│   │   │   ├── menu-items/
│   │   │   └── gallery/
│   │   └── branding/
```

### Recommended Database Schema

```sql
-- Add tenant ownership to all uploaded files
CREATE TABLE TenantAsset (
  id UUID PRIMARY KEY,
  tenantId UUID NOT NULL REFERENCES Tenant(id),
  assetType VARCHAR(50), -- 'logo', 'menu-item', 'hero', etc.
  filePath VARCHAR(500),
  md5Hash VARCHAR(32),
  createdAt TIMESTAMP,
  UNIQUE(tenantId, assetType, filePath)
);
```

### Recommended CI/CD Checks

```yaml
# .github/workflows/tenant-validation.yml
- name: Validate tenant assets
  run: |
    # Check no shared uploads committed
    if find public/uploads -type f | grep -q .; then
      echo "ERROR: Files in shared uploads directory"
      exit 1
    fi

    # Check all tenant logos are real (not placeholders)
    for logo in public/tenant/*/logo.png; do
      size=$(stat -f%z "$logo")
      if [ "$size" -lt 10000 ]; then
        echo "ERROR: $logo appears to be a placeholder ($size bytes)"
        exit 1
      fi
    done
```

---

## Appendix B: Emergency Recovery

If tenant cross-pollination happens again:

```bash
# 1. Take site offline immediately
ssh root@server "pm2 stop alessa-ordering"

# 2. Restore from protected backup
ssh root@server "cp /root/PROTECTED_BACKUPS/{tenant}/* /var/www/alessa-ordering/public/tenant/{tenant}/"

# 3. Verify restoration
ssh root@server "md5sum /var/www/alessa-ordering/public/tenant/{tenant}/logo.png"

# 4. Bring site back online
ssh root@server "pm2 start alessa-ordering"

# 5. Hard refresh and verify in browser
```

---

## Conclusion

This incident was preventable. The root cause was a fundamental architectural flaw: **shared upload directories in a multi-tenant system**.

The contamination lived in the codebase for 43 days before being discovered. Every deployment, every git pull, every "fix" was overwritten by the poisoned commit.

**Multi-tenant systems require paranoid-level isolation.** Every file, every database record, every API response must be scoped to a specific tenant. There is no "shared" in multi-tenant - only "isolated."

The happy ending: Las Reinas now has the most protected logo in the entire system. Four backups, auto-restore every 5 minutes, and a development team that will never forget this lesson.

---

*Document created: December 20, 2025*
*Incident duration: ~45 minutes*
*Total investigation time: ~2 hours*
*Coffee consumed: Too much*
*Lessons learned: Priceless*

---

## Quick Reference Card

### For Future Builds - MUST DO:

1. **NEVER use shared `/uploads/` directory**
2. **ALWAYS use `/tenant/{slug}/uploads/` for tenant files**
3. **ALWAYS verify logo file size > 10KB before commit**
4. **ALWAYS create protected backup after confirming assets**
5. **ALWAYS set up auto-restore cron for critical assets**
6. **NEVER trust placeholder files in production**
7. **ALWAYS test with REAL client assets before handoff**

### Emergency Contacts

- VPS: `ssh root@77.243.85.8`
- Protected backups: `/root/PROTECTED_BACKUPS/`
- Protection logs: `/var/log/lasreinas-protection.log`
- Git recovery tag: `v1.1.0-lasreinas-verified`
