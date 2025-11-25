# TROUBLESHOOTING GUIDE - DEMO DAY FALLBACK PLANS
**Emergency Procedures for Common Issues**
**Date:** November 18, 2025
**Coverage:** DNS, PM2, Prisma, Stripe, General Failures

---

## 🎯 OVERVIEW

This guide provides **step-by-step troubleshooting** for issues that may arise during demo preparation or live presentation.

**Categories:**
1. **DNS & Domain Issues**
2. **PM2 Process Management**
3. **Prisma & Database Issues**
4. **Stripe API Errors**
5. **General Server/App Issues**
6. **Emergency Fallback Procedures**

**Golden Rule:** Stay calm. Most issues have a 30-second fix.

---

## 🌐 SECTION 1: DNS & DOMAIN ISSUES

### **ISSUE 1.1: Custom Domain Not Resolving**

**Symptom:** Visiting `lasreinascolusa.com` shows "DNS_PROBE_FINISHED_NXDOMAIN" or times out

**Diagnosis:**
```bash
# Check DNS propagation
dig lasreinascolusa.com

# Check if A record points to VPS
nslookup lasreinascolusa.com
```

**Solutions:**

#### **Solution A: DNS Not Yet Propagated (Most Common)**
```
DNS changes take 24-72 hours to propagate globally.

Workaround:
1. Use subdomain instead: lasreinas.alessa.com
2. Or use ?tenant=lasreinas parameter
3. Or edit local hosts file:

   Mac/Linux:
   sudo nano /etc/hosts

   Add line:
   123.456.789.012  lasreinascolusa.com

   Save and test: http://lasreinascolusa.com
```

**Timeline:** 5 minutes to test, 24-72 hours for full propagation

#### **Solution B: Incorrect DNS Records**
```
Check current DNS settings in domain registrar:

Required Records:
- A Record: @ → VPS_IP_ADDRESS (e.g., 77.243.85.8)
- A Record: www → VPS_IP_ADDRESS
- CNAME: *.lasreinas → lasreinascolusa.com (optional, for subdomains)

If missing:
1. Login to domain registrar (GoDaddy, Namecheap, etc.)
2. Go to DNS Management
3. Add/update A records
4. Save and wait 5-10 minutes
```

**Timeline:** 10 minutes to update, 1-24 hours to propagate

#### **Solution C: Use Fallback Domain**
```
If DNS fails completely during demo:

1. Use query parameter method:
   http://localhost:3001?tenant=lasreinas

2. Or use IP address:
   http://77.243.85.8:3001?tenant=lasreinas

3. Explain to audience:
   "For demo purposes, we're using the query parameter.
    In production, this would be lasreinascolusa.com"
```

**Timeline:** Instant workaround

---

### **ISSUE 1.2: SSL Certificate Errors**

**Symptom:** Browser shows "Your connection is not private" or "NET::ERR_CERT_AUTHORITY_INVALID"

**Diagnosis:**
```bash
# Check SSL certificate
openssl s_client -connect lasreinascolusa.com:443 -servername lasreinascolusa.com

# Check Nginx SSL config
sudo nginx -t
```

**Solutions:**

#### **Solution A: Certificate Not Installed**
```bash
# Install Let's Encrypt certificate
sudo certbot --nginx -d lasreinascolusa.com -d www.lasreinascolusa.com

# Verify certificate
sudo certbot certificates

# Reload Nginx
sudo systemctl reload nginx
```

**Timeline:** 2-3 minutes

#### **Solution B: Certificate Expired**
```bash
# Renew certificate
sudo certbot renew

# Reload Nginx
sudo systemctl reload nginx
```

**Timeline:** 1-2 minutes

#### **Solution C: Use HTTP for Demo**
```
If SSL fails:

1. Use HTTP instead of HTTPS:
   http://lasreinascolusa.com

2. Explain to audience:
   "For local demo, we're using HTTP.
    Production deployment has SSL/HTTPS configured."

3. Or use localhost:
   http://localhost:3001?tenant=lasreinas
```

**Timeline:** Instant workaround

---

## 🔄 SECTION 2: PM2 PROCESS MANAGEMENT

### **ISSUE 2.1: Server Won't Start**

**Symptom:** `npm run dev` fails or PM2 process is stopped

**Diagnosis:**
```bash
# Check PM2 status
pm2 status

# Check PM2 logs
pm2 logs alessa-ordering

# Check if port 3001 is in use
lsof -i :3001
```

**Solutions:**

#### **Solution A: Port Already in Use**
```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or use PM2 to restart
pm2 restart alessa-ordering

# Or change port temporarily
PORT=3002 npm run dev
```

**Timeline:** 30 seconds

#### **Solution B: PM2 Process Crashed**
```bash
# Check PM2 status
pm2 status
# If status is "errored" or "stopped"

# View error logs
pm2 logs alessa-ordering --err --lines 50

# Common errors:
# - Database connection failed
# - Missing environment variable
# - Port conflict

# Restart process
pm2 restart alessa-ordering

# Or delete and recreate
pm2 delete alessa-ordering
pm2 start npm --name "alessa-ordering" -- run dev
pm2 save
```

**Timeline:** 1-2 minutes

#### **Solution C: Environment Variables Missing**
```bash
# Check .env file exists
ls -la .env

# Verify required variables
cat .env | grep -E "DATABASE_URL|NEXTAUTH_SECRET|STRIPE"

# If missing, restore from backup:
cp .env.example .env

# Or manually add:
DATABASE_URL="postgresql://user:pass@localhost:5432/alessa"
NEXTAUTH_SECRET="your-secret-here"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Restart server
pm2 restart alessa-ordering
```

**Timeline:** 2-3 minutes

---

### **ISSUE 2.2: PM2 Commands Not Working**

**Symptom:** `pm2` command not found or not responding

**Diagnosis:**
```bash
# Check if PM2 is installed
which pm2

# Check PM2 version
pm2 -v
```

**Solutions:**

#### **Solution A: PM2 Not Installed**
```bash
# Install PM2 globally
npm install -g pm2

# Verify installation
pm2 -v
```

**Timeline:** 1 minute

#### **Solution B: PM2 Daemon Down**
```bash
# Kill PM2 daemon
pm2 kill

# Restart PM2
pm2 resurrect

# Or start fresh
pm2 start ecosystem.config.js
pm2 save
```

**Timeline:** 1 minute

#### **Solution C: Use NPM Directly**
```
If PM2 fails completely:

# Run dev server directly
npm run dev

# In new terminal, note the PID
ps aux | grep "next dev"

# To stop later:
kill -9 <PID>
```

**Timeline:** Instant workaround

---

## 💾 SECTION 3: PRISMA & DATABASE ISSUES

### **ISSUE 3.1: Database Connection Failed**

**Symptom:** Error: "Can't reach database server" or "ECONNREFUSED"

**Diagnosis:**
```bash
# Check if PostgreSQL is running
pg_isready

# Check connection
psql $DATABASE_URL -c "SELECT 1;"

# Check Prisma connection
npx prisma studio
# If Prisma Studio opens, connection works
```

**Solutions:**

#### **Solution A: PostgreSQL Not Running**
```bash
# Start PostgreSQL
# Mac:
brew services start postgresql

# Linux:
sudo systemctl start postgresql

# Verify running
pg_isready
# Should output: accepting connections
```

**Timeline:** 30 seconds

#### **Solution B: Incorrect DATABASE_URL**
```bash
# Check current DATABASE_URL
echo $DATABASE_URL
# or
cat .env | grep DATABASE_URL

# Correct format:
# postgresql://username:password@localhost:5432/database_name

# Common issues:
# - Wrong username/password
# - Wrong database name
# - Wrong port (should be 5432)
# - Missing @localhost

# Test connection manually
psql postgresql://username:password@localhost:5432/database_name
```

**Timeline:** 2 minutes

#### **Solution C: Database Doesn't Exist**
```bash
# List databases
psql -U postgres -c "\l"

# Create database if missing
createdb alessa_ordering

# Or using psql:
psql -U postgres
CREATE DATABASE alessa_ordering;
\q

# Run migrations
npx prisma migrate deploy

# Seed database
npm run seed:lasreinas
```

**Timeline:** 3-5 minutes

---

### **ISSUE 3.2: Prisma Client Out of Sync**

**Symptom:** Error: "Prisma Client is not up-to-date" or "Type error in Prisma query"

**Diagnosis:**
```bash
# Check Prisma Client version
npx prisma -v

# Check schema vs. generated client
npx prisma validate
```

**Solutions:**

#### **Solution A: Regenerate Prisma Client**
```bash
# Generate Prisma Client
npx prisma generate

# Restart dev server
pm2 restart alessa-ordering
# or
npm run dev
```

**Timeline:** 1 minute

#### **Solution B: Schema Out of Sync with Database**
```bash
# Check status
npx prisma migrate status

# If "Database schema is not in sync"
# Apply pending migrations
npx prisma migrate deploy

# Or reset database (CAUTION: deletes all data)
npx prisma migrate reset

# Reseed
npm run seed:lasreinas
```

**Timeline:** 2-5 minutes

---

### **ISSUE 3.3: Seeding Fails**

**Symptom:** Error during `npm run seed:lasreinas` or missing menu items

**Diagnosis:**
```bash
# Check if seed script exists
ls scripts/seed-tenant.mjs

# Run seed script with verbose logging
node scripts/seed-tenant.mjs lasreinas
```

**Solutions:**

#### **Solution A: Tenant Already Exists**
```bash
# Delete existing tenant
psql $DATABASE_URL -c "DELETE FROM \"Tenant\" WHERE slug = 'lasreinas';"

# Re-run seed
npm run seed:lasreinas
```

**Timeline:** 1 minute

#### **Solution B: Missing Seed Data**
```bash
# Check if seed data files exist
ls scripts/seed-data/lasreinas-menu.json

# If missing, restore from backup or create manually
# Use admin UI to add items manually as temporary fix
```

**Timeline:** 3-5 minutes (manual entry) or 30 seconds (restore from backup)

#### **Solution C: Use Manual Seeding**
```
If automated seeding fails:

1. Login to admin: /admin/login
2. Navigate to Menu Manager
3. Click "Add Item" for each menu item
4. Or use spreadsheet upload (if implemented)

Workaround for demo:
- Seed only 10-15 core items
- Focus on Quesabirrias, Tacos, Burritos
- Skip complete 69-item menu
```

**Timeline:** 10-15 minutes for 10 items

---

## 💳 SECTION 4: STRIPE API ISSUES

### **ISSUE 4.1: Stripe API Key Invalid**

**Symptom:** Error: "Invalid API key" or "Unauthorized"

**Diagnosis:**
```bash
# Check Stripe keys in .env
cat .env | grep STRIPE

# Verify key format:
# Test keys start with: sk_test_... or pk_test_...
# Live keys start with: sk_live_... or pk_live_...
```

**Solutions:**

#### **Solution A: Wrong API Key**
```bash
# Get correct keys from Stripe Dashboard
# 1. Login to dashboard.stripe.com
# 2. Developers → API keys
# 3. Copy "Secret key" and "Publishable key"

# Update .env
STRIPE_SECRET_KEY="sk_test_51..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Restart server
pm2 restart alessa-ordering
```

**Timeline:** 2 minutes

#### **Solution B: Test vs. Live Mode Mismatch**
```
Ensure both keys are from same mode:

Test mode:
- Secret: sk_test_...
- Publishable: pk_test_...

Live mode:
- Secret: sk_live_...
- Publishable: pk_live_...

Do NOT mix test and live keys!
```

**Timeline:** 1 minute

---

### **ISSUE 4.2: Stripe Connect OAuth Fails**

**Symptom:** Redirect to Stripe fails or returns error after authorization

**Diagnosis:**
```bash
# Check Stripe Connect settings
# Login to dashboard.stripe.com
# Settings → Connect → Settings

# Verify Redirect URI matches:
# http://localhost:3001/admin/stripe-connect/complete
# or
# https://yourdomain.com/admin/stripe-connect/complete
```

**Solutions:**

#### **Solution A: Redirect URI Mismatch**
```
1. Go to Stripe Dashboard → Connect → Settings
2. Add redirect URI:
   http://localhost:3001/admin/stripe-connect/complete

3. Save changes
4. Retry connection from admin
```

**Timeline:** 2 minutes

#### **Solution B: Use Manual Simulation**
```
If OAuth is broken:

1. Skip "Connect with Stripe" button
2. Manually navigate to:
   /admin/stripe-connect/complete

3. Show success page
4. Explain to audience:
   "In production, the OAuth flow redirects automatically.
    For demo, we're simulating a successful connection."
```

**Timeline:** Instant workaround

---

### **ISSUE 4.3: Payment Processing Fails**

**Symptom:** Payment hangs or returns error after entering card

**Diagnosis:**
```bash
# Check Stripe webhook endpoint
curl http://localhost:3001/api/webhooks/stripe

# Check server logs for Stripe errors
pm2 logs alessa-ordering | grep -i stripe
```

**Solutions:**

#### **Solution A: Webhook Endpoint Down**
```bash
# Verify webhook route exists
ls app/api/webhooks/stripe/route.ts

# Test locally with Stripe CLI
stripe listen --forward-to localhost:3001/api/webhooks/stripe

# If working, webhook config is correct
```

**Timeline:** 2 minutes

#### **Solution B: Use Test Cards Correctly**
```
Ensure using valid test cards:

Success:
- 4242 4242 4242 4242 (Visa)
- Any future expiry (e.g., 12/34)
- Any 3-digit CVC (e.g., 123)

Decline (for testing failures):
- 4000 0000 0000 0002

Do NOT use:
- Real card numbers
- Expired dates
- Invalid CVCs
```

**Timeline:** Instant fix

---

## 🔧 SECTION 5: GENERAL SERVER/APP ISSUES

### **ISSUE 5.1: White Screen / Blank Page**

**Symptom:** Page loads but shows nothing (white screen)

**Diagnosis:**
```bash
# Check browser console (F12)
# Look for JavaScript errors

# Check server logs
pm2 logs alessa-ordering --err

# Check if build is up-to-date
ls .next/
```

**Solutions:**

#### **Solution A: Build Cache Issue**
```bash
# Delete build cache
rm -rf .next

# Rebuild
npm run build

# Restart server
pm2 restart alessa-ordering
```

**Timeline:** 2-3 minutes

#### **Solution B: JavaScript Error**
```
Check browser console for errors:

Common errors:
- "Cannot read property 'map' of undefined"
  → Data not loading from API

- "Hydration mismatch"
  → Server/client render mismatch

- "Module not found"
  → Missing dependency

Fix:
1. Identify error component
2. Add null checks:
   {items?.map(...)} instead of {items.map(...)}
3. Restart server
```

**Timeline:** 5-10 minutes

---

### **ISSUE 5.2: Slow Page Load**

**Symptom:** Pages take > 5 seconds to load

**Diagnosis:**
```bash
# Check server CPU/memory
top
# or
htop

# Check database query performance
# In Prisma Studio, check query times

# Check Network tab in browser (F12)
# Look for slow API calls
```

**Solutions:**

#### **Solution A: Database Query Optimization**
```bash
# Add database indexes (if missing)
# Edit prisma/schema.prisma

model MenuItem {
  @@index([tenantId])
  @@index([available])
  @@index([menuSectionId])
}

# Generate migration
npx prisma migrate dev --name add_indexes

# Apply migration
npx prisma migrate deploy
```

**Timeline:** 3-5 minutes

#### **Solution B: Restart Server**
```bash
# Often fixes memory leaks
pm2 restart alessa-ordering

# Or restart PostgreSQL
brew services restart postgresql
```

**Timeline:** 1 minute

---

### **ISSUE 5.3: 404 Errors on Assets**

**Symptom:** Images, CSS, or JavaScript files return 404

**Diagnosis:**
```bash
# Check public folder
ls public/tenant/lasreinas/images/

# Check image paths in browser Network tab

# Check Nginx config (if using Nginx)
sudo nginx -t
```

**Solutions:**

#### **Solution A: Missing Assets**
```bash
# Verify assets exist
ls public/tenant/lasreinas/images/logo.png

# If missing, upload via admin UI
# Or copy from backup:
cp backup/images/* public/tenant/lasreinas/images/
```

**Timeline:** 1-2 minutes

#### **Solution B: Incorrect Paths**
```
Check image paths in code:

Correct:
/tenant/lasreinas/images/logo.png

Incorrect:
/public/tenant/lasreinas/images/logo.png
tenant/lasreinas/images/logo.png
```

**Timeline:** 2 minutes

---

## 🚨 SECTION 6: EMERGENCY FALLBACK PROCEDURES

### **SCENARIO A: Total Server Failure**

**If nothing works:**

1. **Use Backup Video Recording**
   ```
   - Have pre-recorded demo video ready
   - Play video instead of live demo
   - Explain: "Due to technical difficulties, here's a recorded demo"
   ```

2. **Use Screenshot Slideshow**
   ```
   - Have screenshots of each demo step
   - Walk through slides manually
   - Narrate as if it were live
   ```

3. **Pivot to Architecture Discussion**
   ```
   - Show architecture diagram
   - Explain tech stack verbally
   - Focus on business value instead of live demo
   ```

**Timeline:** Instant pivot

---

### **SCENARIO B: Demo Day Internet Outage**

**If internet is down:**

1. **Use Localhost Only**
   ```
   - Everything works on localhost without internet
   - Skip Stripe OAuth (simulate)
   - Skip DoorDash integration (explain it)
   - Focus on core ordering and admin features
   ```

2. **Mobile Hotspot**
   ```
   - Use phone hotspot
   - Connect laptop to hotspot
   - Continue demo over mobile data
   ```

**Timeline:** 1-2 minutes

---

### **SCENARIO C: Critical Bug During Demo**

**If you encounter a bug mid-demo:**

1. **Stay Calm**
   ```
   - Don't panic or apologize excessively
   - Acknowledge: "Let me show you another feature while that loads"
   - Pivot to working feature
   ```

2. **Have Backup Path**
   ```
   - If customer ordering fails → Show admin dashboard
   - If admin fails → Show architecture diagram
   - If everything fails → Use backup video
   ```

3. **Explain and Move On**
   ```
   - "This is a known issue we're fixing in the next sprint"
   - "Let me show you [other feature] instead"
   - "The important part is [business value], not this specific UI"
   ```

**Timeline:** Instant recovery

---

## 📋 PRE-DEMO CHECKLIST (5 minutes)

Run this checklist 15 minutes before demo:

- [ ] `pm2 status` → alessa-ordering is "online"
- [ ] `pg_isready` → PostgreSQL is running
- [ ] `curl http://localhost:3001` → Server responds
- [ ] Open browser → Customer site loads
- [ ] Login to admin → Dashboard loads
- [ ] Check Stripe keys → Test mode active
- [ ] Check database → 69 items seeded
- [ ] Clear browser cache → Fresh state
- [ ] Have backup screenshots ready
- [ ] Have backup video ready (optional)

**If ANY check fails:** Use this guide to fix in < 5 minutes

---

## 🛠️ QUICK COMMAND REFERENCE

### **Restart Everything:**
```bash
# Restart server
pm2 restart alessa-ordering

# Restart PostgreSQL
brew services restart postgresql

# Restart Nginx (if using)
sudo systemctl restart nginx

# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

### **Check Logs:**
```bash
# Server logs
pm2 logs alessa-ordering

# Error logs only
pm2 logs alessa-ordering --err

# PostgreSQL logs
tail -f /usr/local/var/log/postgresql@14.log
```

### **Database Quick Fixes:**
```bash
# Reset database (CAUTION: deletes all data)
npx prisma migrate reset

# Reseed
npm run seed:lasreinas

# Or just generate client
npx prisma generate
```

### **Emergency Kill & Restart:**
```bash
# Kill all Node processes
pkill -9 node

# Kill PostgreSQL (if frozen)
sudo pkill -9 postgres
brew services restart postgresql

# Start fresh
npm run dev
```

---

## 🎯 CONCLUSION

**Remember:**
- 90% of issues have a 30-second fix
- Stay calm, follow the guide
- Have backup plans ready
- Pivot gracefully if needed

**Most Common Issues:**
1. **Port conflict** → `kill -9` then restart
2. **Database connection** → `brew services restart postgresql`
3. **Stripe keys wrong** → Check `.env`
4. **White screen** → `rm -rf .next && npm run build`

**Emergency Contact:**
- Keep this guide open during demo
- Mark critical sections for quick access
- Practice troubleshooting flows beforehand

**You've got this! 🚀**
