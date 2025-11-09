# 🚀 Alessa Ordering Platform - Production Setup

**Status**: ✅ **MVP LIVE - PRODUCTION READY**
**Last Updated**: November 8, 2025
**Version**: 1.0.0

---

## 🎯 Quick Links

| Purpose | Document | Read This If... |
|---------|----------|-----------------|
| **Testing** | [TESTING_GUIDE.md](./TESTING_GUIDE.md) | You want to test the platform |
| **Credentials** | [LOGIN_CREDENTIALS.md](./LOGIN_CREDENTIALS.md) | You need login info |
| **⚠️ Do Not Touch** | [DO_NOT_MODIFY.md](./DO_NOT_MODIFY.md) | You're about to make changes |
| **Port Info** | [VPS_PORT_REGISTRY.md](./VPS_PORT_REGISTRY.md) | You're working with ports |
| **Database** | [PRISMA_ISOLATION_REVIEW.md](./PRISMA_ISOLATION_REVIEW.md) | You're working with database |
| **Deployment** | [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md) | You're deploying changes |

---

## ⚡ Critical Information

### 🔒 **READ THIS FIRST**

Before making ANY changes to this application, read:
1. **[DO_NOT_MODIFY.md](./DO_NOT_MODIFY.md)** ← Critical configurations
2. **[VPS_PORT_REGISTRY.md](./VPS_PORT_REGISTRY.md)** ← Port allocations
3. **[PRISMA_ISOLATION_REVIEW.md](./PRISMA_ISOLATION_REVIEW.md)** ← Database isolation

**Skipping these documents WILL cause production outages.**

---

## 🌐 Live URLs

### Production Sites
- **Order Page**: https://lapoblanitamexicanfood.com/order
- **Homepage**: https://lapoblanitamexicanfood.com (redirects to /order)
- **Admin Panel**: https://lapoblanitamexicanfood.com/admin/login
- **Super Admin**: https://alessacloud.com/admin/login

### Testing
See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for complete testing procedures.

---

## 🔧 Current Configuration

### Application
```
Name:        alessa-ordering
Framework:   Next.js 14.2.21
Port:        4000 (DEDICATED - DO NOT CHANGE)
Process:     PM2 (namespace: alessa)
Directory:   /var/www/alessa-ordering
Status:      ✅ ONLINE
```

### Database
```
Name:        alessa_ordering
User:        alessa_ordering_user
Port:        5432 (localhost only)
Status:      ✅ ISOLATED
```

### Domains
```
Primary:     lapoblanitamexicanfood.com
Secondary:   alessacloud.com
SSL:         Let's Encrypt (auto-renewal)
```

---

## 📊 System Health

**Current Status** (as of November 8, 2025):

| Component | Status | Details |
|-----------|--------|---------|
| **PM2 Process** | ✅ Online | 0 restarts, 20+ min uptime |
| **Port 4000** | ✅ Bound | Dedicated to alessa-ordering |
| **Database** | ✅ Connected | alessa_ordering isolated |
| **Nginx** | ✅ Running | Proxying to :4000 |
| **SSL Certs** | ✅ Valid | Expires in 60+ days |
| **Cache Busting** | ✅ Active | Admin changes instant |
| **Image Uploads** | ✅ Working | /uploads/ served by Nginx |

---

## 🚨 Emergency Procedures

### If Site is Down

1. **Check PM2 Status**
   ```bash
   ssh root@77.243.85.8 "pm2 status | grep alessa-ordering"
   ```
   - If "errored": Check logs with `pm2 logs alessa-ordering --err`
   - If "stopped": Restart with `pm2 restart alessa-ordering`

2. **Check Port Availability**
   ```bash
   ssh root@77.243.85.8 "lsof -i :4000"
   ```
   - Should show only PM2 process
   - If other process: See [VPS_PORT_REGISTRY.md](./VPS_PORT_REGISTRY.md)

3. **Check Nginx**
   ```bash
   ssh root@77.243.85.8 "systemctl status nginx"
   ```
   - If not running: `systemctl start nginx`
   - If errors: `nginx -t` to test config

4. **Rollback if Needed**
   ```bash
   ssh root@77.243.85.8
   cd /var/www/alessa-ordering
   git reset --hard [last-working-commit]
   npm run build
   pm2 restart alessa-ordering
   ```

### If Database is Unreachable

1. **Check PostgreSQL**
   ```bash
   ssh root@77.243.85.8 "systemctl status postgresql"
   ```

2. **Test Connection**
   ```bash
   ssh root@77.243.85.8 "sudo -u postgres psql -d alessa_ordering -c 'SELECT 1;'"
   ```

3. **Check Environment**
   ```bash
   ssh root@77.243.85.8 "cat /var/www/alessa-ordering/.env | grep DATABASE_URL"
   ```
   - Should point to `alessa_ordering` database
   - Should NOT point to `azteka_dsd` or other database

---

## 🛡️ Protection Rules

### ⛔ DO NOT:
- Change port from 4000 in ecosystem.config.js
- Modify Nginx configs without testing
- Connect to azteka_dsd database
- Remove cache-busting directives from app/order/page.tsx
- Delete PM2 process
- Modify .env on VPS directly
- Deploy without `npm run build`

### ✅ SAFE TO DO:
- Edit React components
- Add new API routes
- Create Prisma migrations (after testing)
- Update menu items via admin panel
- Upload images via admin panel
- Modify styles/CSS

---

## 📦 Deployment Workflow

### Standard Deployment

```bash
# 1. LOCAL: Make changes and test
npm run dev          # Test in development
npm run build        # Test production build
npm run start        # Test production server

# 2. COMMIT: Save to git
git add .
git commit -m "Description of changes"
git push origin main

# 3. VPS: Deploy
ssh root@77.243.85.8
cd /var/www/alessa-ordering
git pull origin main
npm install          # If package.json changed
npm run build
pm2 restart alessa-ordering

# 4. VERIFY: Check status
pm2 logs alessa-ordering --lines 20
curl -I https://lapoblanitamexicanfood.com/order
```

**See**: [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md) for detailed procedures.

---

## 🧪 Testing

### Quick Smoke Test

```bash
# All should return 200 OK or 307 redirect
curl -I https://lapoblanitamexicanfood.com
curl -I https://lapoblanitamexicanfood.com/order
curl -I https://lapoblanitamexicanfood.com/admin/login
curl -I https://alessacloud.com
```

### Full Testing Suite

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for:
- 40+ test procedures
- Login credentials
- Expected results
- Troubleshooting steps

---

## 📁 Important Files

### Configuration Files
```
/ecosystem.config.js       ← PM2 config (PORT: 4000)
/.env                      ← Local environment (git-ignored)
/prisma/schema.prisma      ← Database schema
/next.config.js            ← Next.js config
/middleware.ts             ← Tenant routing
```

### Application Files
```
/app/order/page.tsx        ← Order page (cache directives!)
/app/admin/                ← Admin panel
/lib/prisma.ts             ← Prisma client
/lib/tenant.ts             ← Tenant resolution
/public/uploads/           ← Uploaded images
```

### Documentation
```
/DO_NOT_MODIFY.md              ← Critical configurations
/VPS_PORT_REGISTRY.md          ← Port allocations
/PRISMA_ISOLATION_REVIEW.md    ← Database isolation
/TESTING_GUIDE.md              ← Testing procedures
/LOGIN_CREDENTIALS.md          ← Access credentials
/DEPLOYMENT_SUMMARY.md         ← Deployment guide
```

---

## 🔍 Common Issues

### Menu items not appearing after adding in admin

**Cause**: Item not assigned to a menu section
**Solution**: Edit item, select a section (e.g., "Tacos Tradicionales"), save

---

### Changes not appearing on frontend

**Cause**: Browser cache
**Solution**: Hard refresh (Ctrl+Shift+R) or test in incognito

**If still not working**:
1. Check `app/order/page.tsx` has cache directives
2. Check PM2 logs: `pm2 logs alessa-ordering`
3. Check no errors in console

---

### PM2 process keeps restarting

**Cause**: Usually port conflict or database connection error
**Solution**:
1. Check logs: `pm2 logs alessa-ordering --err`
2. Check port: `lsof -i :4000`
3. Check database: Test connection with `npx prisma studio`

---

### Image uploads fail

**Cause**: File size, format, or permissions
**Solution**:
1. Check file < 5MB
2. Check format is JPG, PNG, or WebP
3. Check permissions:
   ```bash
   ssh root@77.243.85.8 "ls -la /var/www/alessa-ordering/public/uploads/"
   ```
   Directory: 755, Files: 644

---

## 📞 Support & Resources

### Documentation
- **Next.js**: https://nextjs.org/docs
- **Prisma**: https://www.prisma.io/docs
- **PM2**: https://pm2.keymetrics.io/docs
- **Nginx**: https://nginx.org/en/docs

### Project Documents
- All critical configurations: [DO_NOT_MODIFY.md](./DO_NOT_MODIFY.md)
- All test procedures: [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- All login credentials: [LOGIN_CREDENTIALS.md](./LOGIN_CREDENTIALS.md)

### VPS Access
```bash
ssh root@77.243.85.8
```

---

## 🎉 Success Metrics

Your MVP is running successfully if:

- ✅ PM2 process online with 0-1 restarts
- ✅ All URLs return 200 OK or 307 redirect
- ✅ Admin changes appear in < 2 seconds
- ✅ No errors in last 100 log lines
- ✅ Menu shows 24+ items
- ✅ Images load correctly
- ✅ Port 4000 dedicated to alessa-ordering
- ✅ Database isolated (alessa_ordering)

**Current Status**: ✅ **ALL METRICS PASSING**

---

## 🗺️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  INTERNET                                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  NGINX (Port 443) - SSL Termination                         │
│                                                               │
│  lapoblanitamexicanfood.com → http://127.0.0.1:4000         │
│  alessacloud.com            → http://127.0.0.1:4000         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  ALESSA-ORDERING (Port 4000)                                 │
│                                                               │
│  Framework:  Next.js 14.2.21                                 │
│  Process:    PM2 (alessa namespace)                          │
│  Directory:  /var/www/alessa-ordering                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  POSTGRESQL (Port 5432 - localhost only)                     │
│                                                               │
│  Database:  alessa_ordering                                  │
│  User:      alessa_ordering_user                             │
│  Status:    ISOLATED from azteka_dsd                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 What's Next?

### Immediate Next Steps
1. **Test the platform** using [TESTING_GUIDE.md](./TESTING_GUIDE.md)
2. **Monitor logs** for first 24 hours: `pm2 logs alessa-ordering`
3. **Backup database** before making changes
4. **Test ordering flow** end-to-end

### Future Enhancements
- [ ] Customer email notifications
- [ ] SMS order confirmations
- [ ] Stripe payment integration
- [ ] Kitchen display system
- [ ] Analytics dashboard
- [ ] Mobile app

---

## ✅ Deployment Checklist

Before going live:
- [x] App running on dedicated port 4000
- [x] Database isolated (alessa_ordering)
- [x] SSL certificates valid
- [x] Nginx proxying correctly
- [x] Cache-busting working
- [x] Image uploads working
- [x] Admin panel accessible
- [x] Menu items displaying
- [x] Logo displaying
- [x] No errors in logs
- [x] PM2 process stable (0 restarts)
- [x] Documentation complete

**Status**: ✅ **READY FOR PRODUCTION**

---

## 🎊 Congratulations!

Your Alessa Ordering Platform MVP is:
- ✅ **Live** at https://lapoblanitamexicanfood.com
- ✅ **Stable** (0 restarts in 20+ minutes)
- ✅ **Isolated** (dedicated port, database)
- ✅ **Fast** (cache-busting < 2 seconds)
- ✅ **Secure** (HTTPS, isolated database)
- ✅ **Documented** (5 comprehensive guides)

**You're ready to serve customers!** 🌮

---

**Last Deployed**: November 8, 2025
**Next Review**: November 9, 2025
**Owner**: Ernesto Ponce

---

**END OF PRODUCTION README**
