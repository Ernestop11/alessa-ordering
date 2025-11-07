# 🚀 Production Deployment Checklist

**Project**: Alessa Ordering Platform
**Date**: November 7, 2025
**Status**: Ready for deployment

---

## ⚡ CRITICAL PATH (Do these FIRST to avoid bottlenecks)

### 1. DNS Configuration ⏱️ **START NOW** (1-48h propagation time)

**Provider**: [Your DNS Provider]
**Action**: Add these DNS records

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | `YOUR_VPS_IP` | 300 |
| A | `www` | `YOUR_VPS_IP` | 300 |
| A | `lapoblanita` | `YOUR_VPS_IP` | 300 |
| A | `*` | `YOUR_VPS_IP` | 300 |

**Verify DNS propagation**:
```bash
dig alessacloud.com +short
dig lapoblanita.alessacloud.com +short
```

---

## 📋 PRE-DEPLOYMENT TASKS

### 2. Secure Credentials ✅ **COMPLETE**

- [x] Generated `NEXTAUTH_SECRET`
- [x] Generated secure admin passwords
- [x] Generated database password
- [x] Created `.env.production` file
- [x] Stored credentials securely

**Location**: `.env.production` (ready to upload to VPS)

### 3. VPS Access **YOU NEED**

**Required information**:
- [ ] VPS IP address or hostname
- [ ] SSH username (usually `root` or your username)
- [ ] SSH key or password access
- [ ] Sudo privileges

**Test access**:
```bash
ssh YOUR_USERNAME@YOUR_VPS_IP
```

---

## 🚀 DEPLOYMENT STEPS (In Order)

### 4. Automated Deployment Script **READY**

**One-command deployment**:
```bash
./scripts/deploy-vps.sh YOUR_USERNAME@YOUR_VPS_IP
```

This script will:
- Install Node.js, PostgreSQL, Nginx, PM2
- Create isolated database
- Clone repository
- Upload production `.env`
- Install dependencies
- Build application
- Run database migrations
- Configure Nginx
- Start PM2 process

**Estimated time**: 10-15 minutes

---

### 5. SSL Certificate (After DNS propagates)

```bash
ssh YOUR_USERNAME@YOUR_VPS_IP

# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get wildcard certificate
sudo certbot --nginx \
  -d alessacloud.com \
  -d www.alessacloud.com \
  -d "*.alessacloud.com"

# Test auto-renewal
sudo certbot renew --dry-run
```

**Expected result**: HTTPS enabled on all domains

---

### 6. Stripe Webhook Configuration

**After deployment**:

1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. **Endpoint URL**: `https://lapoblanita.alessacloud.com/api/payments/webhook`
4. **Events to send**:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated`
5. Click "Add endpoint"
6. **Copy the webhook signing secret** (starts with `whsec_`)
7. Update `.env` on VPS:
   ```bash
   ssh YOUR_USERNAME@YOUR_VPS_IP
   cd /var/www/alessa-ordering
   nano .env  # Update STRIPE_WEBHOOK_SECRET
   pm2 restart alessa-ordering
   ```

---

## ✅ POST-DEPLOYMENT VERIFICATION

### 7. Health Checks

Run these tests **after deployment**:

```bash
# 1. Homepage
curl -I https://alessacloud.com
# Expected: 200 OK

# 2. Tenant subdomain
curl -I https://lapoblanita.alessacloud.com
# Expected: 200 OK

# 3. Order page
curl -I https://lapoblanita.alessacloud.com/order
# Expected: 200 OK

# 4. API health
curl https://lapoblanita.alessacloud.com/api/test-env
# Expected: {"keyPrefix":"sk_test_51...","isTest":true,...}

# 5. Stripe Connect status
curl "https://lapoblanita.alessacloud.com/api/admin/stripe/connect/status?tenant=lapoblanita"
# Expected: {"connected":true,"accountId":"acct_1SQu8zPnFOVUXvWK",...}
```

### 8. Manual Smoke Tests

**In browser, test these flows**:

- [ ] Visit https://lapoblanita.alessacloud.com/order
- [ ] Menu items display correctly
- [ ] Add items to cart
- [ ] Cart opens and shows items
- [ ] Customer info form works
- [ ] Click "Proceed to Checkout"
- [ ] Stripe payment form loads
- [ ] Test payment with card: `4242 4242 4242 4242`
- [ ] Payment succeeds
- [ ] Order confirmation page shows
- [ ] Admin login: https://lapoblanita.alessacloud.com/admin
- [ ] Admin credentials work (from `.env.production`)
- [ ] Admin dashboard loads
- [ ] Settings tab shows Stripe Connected
- [ ] Super admin login: https://alessacloud.com/super-admin
- [ ] Can view tenant list

---

## 🔄 MONITORING & MAINTENANCE

### 9. Monitor Application

```bash
# SSH into VPS
ssh YOUR_USERNAME@YOUR_VPS_IP

# View live logs
cd /var/www/alessa-ordering
pm2 logs alessa-ordering

# View last 50 lines
pm2 logs alessa-ordering --lines 50

# View only errors
pm2 logs alessa-ordering --err

# Check process status
pm2 status

# Check resource usage
pm2 monit
```

### 10. Common Commands

```bash
# Restart application
pm2 restart alessa-ordering

# Stop application
pm2 stop alessa-ordering

# View environment variables
pm2 show alessa-ordering

# Update code and redeploy
cd /var/www/alessa-ordering
git pull origin main
npm install
npm run build
pm2 restart alessa-ordering

# Database console
psql "postgresql://alessa_ordering_user:PASSWORD@localhost:5432/alessa_ordering"

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

---

## 🔐 SECURITY CHECKLIST

### Before Going Live

- [ ] `.env.production` contains strong passwords (not `admin123`)
- [ ] `NEXTAUTH_SECRET` is randomly generated
- [ ] Database password is strong
- [ ] SSH key authentication enabled (disable password auth)
- [ ] Firewall configured (UFW): ports 80, 443, 22 only
- [ ] SSL certificate installed and auto-renewal configured
- [ ] Stripe webhook signature verification enabled
- [ ] PM2 running as non-root user
- [ ] Regular database backups configured
- [ ] Monitoring/alerting configured (optional but recommended)

---

## 🚨 ROLLBACK PLAN

If something goes wrong:

```bash
# SSH into VPS
ssh YOUR_USERNAME@YOUR_VPS_IP

# Stop application
pm2 stop alessa-ordering

# Restore previous Git commit
cd /var/www/alessa-ordering
git log --oneline  # Find previous commit
git checkout PREVIOUS_COMMIT_HASH
npm install
npm run build

# Restart
pm2 restart alessa-ordering
```

Or restore database:
```bash
# Restore from backup
pg_restore -U alessa_ordering_user -d alessa_ordering backup_file.dump
```

---

## 📞 SUPPORT CONTACTS

**Stripe Dashboard**: https://dashboard.stripe.com
**Connected Account**: https://dashboard.stripe.com/test/connect/accounts/acct_1SQu8zPnFOVUXvWK

**Key Files**:
- Environment config: `/var/www/alessa-ordering/.env`
- PM2 config: `/var/www/alessa-ordering/ecosystem.config.js`
- Nginx config: `/etc/nginx/sites-available/alessa-ordering`
- PM2 logs: `/var/log/pm2/alessa-ordering-*.log`

---

## 🎯 SUCCESS CRITERIA

Deployment is successful when:

- [x] Stripe Connect fully tested (COMPLETE)
- [ ] DNS resolves to VPS IP
- [ ] HTTPS enabled (SSL certificate)
- [ ] Application accessible via browser
- [ ] Test payment completes successfully
- [ ] Admin and super-admin logins work
- [ ] PM2 process running without crashes
- [ ] Webhook receives Stripe events
- [ ] Orders created after payment success

---

## 📈 NEXT STEPS AFTER DEPLOYMENT

1. **Switch to Live Stripe Keys** (when ready for real payments):
   - Edit `.env` on VPS
   - Uncomment live keys, comment test keys
   - Update webhook endpoint in Stripe to use live mode
   - Restart: `pm2 restart alessa-ordering`

2. **Set Up Monitoring**:
   - Consider: Sentry, Datadog, New Relic, or LogRocket
   - Set up uptime monitoring: UptimeRobot, Pingdom
   - Configure error alerts

3. **Performance Optimization**:
   - Enable Next.js caching
   - Configure CDN (Cloudflare)
   - Optimize images

4. **Documentation**:
   - Update README.md with production URLs
   - Document admin procedures
   - Create runbook for common issues

---

**Deployment prepared by**: Claude Code
**Date**: November 7, 2025
**Version**: 1.0.0
