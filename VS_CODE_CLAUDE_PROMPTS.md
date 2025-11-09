# 🤖 VS Code Claude Chat Prompts

Copy and paste these prompts directly into Claude in VS Code chat to perform common tasks.

---

## 🚀 DEPLOYMENT PROMPTS

### Prompt 1: Deploy Latest Changes to VPS
```
Deploy the latest changes to VPS. Steps:
1. Commit and push all changes to git
2. SSH into VPS (root@77.243.85.8)
3. Navigate to /var/www/alessa-ordering
4. Pull latest changes (git pull origin main)
5. Install dependencies if needed (npm install)
6. Build application (npm run build)
7. Restart PM2 process (pm2 restart alessa-ordering)
8. Check PM2 status and logs

VPS: root@77.243.85.8
Path: /var/www/alessa-ordering
PM2 Process: alessa-ordering
```

### Prompt 2: Quick Deployment (One Command)
```
Run the deployment script: ./deploy.sh
If it doesn't exist, execute these commands:
1. git add . && git commit -m "Deploy latest changes" && git push
2. ssh root@77.243.85.8 "cd /var/www/alessa-ordering && git pull && npm install && npm run build && pm2 restart alessa-ordering && pm2 status"
```

---

## ✅ VERIFICATION PROMPTS

### Prompt 3: Check Deployment Status
```
Check deployment status:
1. PM2 process status (pm2 list)
2. Application logs (last 50 lines)
3. Build artifacts (.next/BUILD_ID exists)
4. Database connection test
5. Application responds (curl http://localhost:4000/order)

VPS: root@77.243.85.8
Path: /var/www/alessa-ordering
```

### Prompt 4: Verify Cache-Busting is Working
```
Verify image cache-busting is working:
1. Check database timestamps (tenant.updatedAt, menuItem.updatedAt)
2. Check HTML for ?t= parameters in image URLs
3. Verify app/layout.tsx has cache-busting code
4. Verify app/api/admin/assets/upload/route.ts has revalidatePath

Run: ./scripts/verify-cache-busting.sh
Or check manually on VPS.
```

### Prompt 5: Full System Health Check
```
Run comprehensive health check:
1. PM2 status and metrics
2. Application logs (errors and output)
3. Database connection
4. Environment variables (DATABASE_URL, NEXTAUTH_URL, PORT)
5. Nginx status
6. File permissions
7. Disk space and memory
8. Network ports (4000, 80, 443)

VPS: root@77.243.85.8
Path: /var/www/alessa-ordering
```

---

## 🧪 TESTING PROMPTS

### Prompt 6: Test Image Upload End-to-End
```
Test image cache-busting end-to-end:
1. Check current tenant.updatedAt timestamp in database
2. Upload new tenant logo via admin panel (http://lapoblanitamexicanfood.com:4000/admin/login)
3. Check new tenant.updatedAt timestamp (should be newer)
4. Check frontend HTML for new timestamp in image URL
5. Verify image appears immediately without hard refresh

Provide step-by-step instructions and verification commands.
```

### Prompt 7: Test Landing Page
```
Test landing page functionality:
1. Verify landing page shows on root domain (localhost:3000 or alessacloud.com)
2. Check tenant domains redirect to /order
3. Test admin login links work
4. Test super admin dashboard access
5. Check responsive design (mobile, tablet, desktop)

Run locally: npm run dev
Then visit http://localhost:3000
```

---

## 🔧 TROUBLESHOOTING PROMPTS

### Prompt 8: Fix Application Not Starting
```
Application won't start. Troubleshoot:
1. Check PM2 status (pm2 list)
2. Check error logs (pm2 logs alessa-ordering --err --lines 100)
3. Check build errors (npm run build)
4. Check database connection
5. Check environment variables
6. Check port 4000 is available
7. Check file permissions

VPS: root@77.243.85.8
Path: /var/www/alessa-ordering
```

### Prompt 9: Fix Images Not Updating
```
Images not updating on frontend after admin upload. Debug:
1. Check cache-busting code in app/layout.tsx
2. Check tenant.updatedAt updates when saving settings
3. Check revalidatePath is called in upload route
4. Check HTML has ?t= parameters
5. Check browser cache (try hard refresh)
6. Check PM2 logs for errors

Provide debugging steps and fix if needed.
```

### Prompt 10: Fix Build Errors
```
Build is failing. Help me:
1. Check build output (npm run build)
2. Check TypeScript errors
3. Check ESLint errors
4. Check missing dependencies
5. Check import errors
6. Fix any issues found

Run: npm run build 2>&1 | tail -50
```

---

## 📊 MONITORING PROMPTS

### Prompt 11: Check Application Performance
```
Check application performance:
1. PM2 memory and CPU usage
2. Response times (HTTP latency)
3. Database query performance
4. Build size (.next folder size)
5. Number of requests per minute
6. Error rate

VPS: root@77.243.85.8
Path: /var/www/alessa-ordering
```

### Prompt 12: Check Application Logs
```
Show me recent application logs:
1. Last 100 lines of output log
2. Last 100 lines of error log
3. Any warnings or errors
4. Application startup messages
5. Recent requests

VPS: root@77.243.85.8
Command: pm2 logs alessa-ordering --lines 100
```

---

## 🔄 MAINTENANCE PROMPTS

### Prompt 13: Restart Application
```
Restart the application:
1. Stop PM2 process (pm2 stop alessa-ordering)
2. Wait 5 seconds
3. Start PM2 process (pm2 start ecosystem.config.js)
4. Check status (pm2 status)
5. Check logs for errors

VPS: root@77.243.85.8
Path: /var/www/alessa-ordering
```

### Prompt 14: Update Dependencies
```
Update dependencies safely:
1. Check current versions (npm outdated)
2. Update package.json (npm update)
3. Test locally first
4. Commit and push changes
5. Deploy to VPS
6. Test after deployment

Be careful with major version updates.
```

### Prompt 15: Rollback to Previous Version
```
Rollback to previous deployment:
1. Check git log for previous commit
2. Show me last 5 commits
3. Revert to previous commit
4. Rebuild application
5. Restart PM2
6. Verify rollback worked

VPS: root@77.243.85.8
Path: /var/www/alessa-ordering
```

---

## 🗄️ DATABASE PROMPTS

### Prompt 16: Check Database Connection
```
Test database connection:
1. Connect to database using Prisma
2. Run a simple query (SELECT 1)
3. Check tenant data exists
4. Check menu items exist
5. Show connection status

VPS: root@77.243.85.8
Path: /var/www/alessa-ordering
Command: node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => console.log('OK')).catch(err => console.log('FAIL:', err.message));"
```

### Prompt 17: Check Database Timestamps
```
Check database timestamps for cache-busting:
1. Get tenant.updatedAt for lapoblanita
2. Get latest menuItem.updatedAt
3. Show timestamps in milliseconds
4. Show cache-buster parameters (?t=...)

VPS: root@77.243.85.8
Path: /var/www/alessa-ordering
```

---

## 🌐 NETWORK PROMPTS

### Prompt 18: Check Application Accessibility
```
Check if application is accessible:
1. Test localhost:4000 (curl http://localhost:4000)
2. Test public URL (curl http://lapoblanitamexicanfood.com:4000)
3. Check Nginx is proxying correctly
4. Check SSL certificate (if HTTPS)
5. Check firewall rules

VPS: root@77.243.85.8
```

### Prompt 19: Check Nginx Configuration
```
Check Nginx configuration:
1. Check Nginx status (systemctl status nginx)
2. Check Nginx config syntax (nginx -t)
3. Check Nginx logs (tail -50 /var/log/nginx/error.log)
4. Check proxy settings for port 4000
5. Check domain configuration

VPS: root@77.243.85.8
```

---

## 📝 QUICK COMMAND REFERENCE

### Local Commands (Run in VS Code Terminal)
```bash
# Build locally
npm run build

# Run locally
npm run dev

# Check for errors
npm run lint

# Run tests
npm test
```

### VPS Commands (SSH into VPS)
```bash
# SSH into VPS
ssh root@77.243.85.8

# Navigate to app
cd /var/www/alessa-ordering

# Pull changes
git pull origin main

# Install dependencies
npm install

# Build
npm run build

# PM2 commands
pm2 list
pm2 restart alessa-ordering
pm2 logs alessa-ordering --lines 50
pm2 status
pm2 monit
```

### Verification Commands
```bash
# Check if app responds
curl http://localhost:4000/order

# Check PM2
pm2 list | grep alessa-ordering

# Check logs
pm2 logs alessa-ordering --lines 100

# Check build
ls -la .next/BUILD_ID

# Check database
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => console.log('OK')).catch(err => console.log('FAIL'));"
```

---

## 🎯 MOST COMMON PROMPTS

### Daily Deployment
```
Deploy latest changes: git add . && git commit -m "Update" && git push && ssh root@77.243.85.8 "cd /var/www/alessa-ordering && git pull && npm install && npm run build && pm2 restart alessa-ordering"
```

### Quick Status Check
```
Check status: ssh root@77.243.85.8 "pm2 list && pm2 logs alessa-ordering --lines 20 --nostream"
```

### Quick Restart
```
Restart app: ssh root@77.243.85.8 "cd /var/www/alessa-ordering && pm2 restart alessa-ordering && pm2 status"
```

### Check Cache-Busting
```
Verify cache-busting: ssh root@77.243.85.8 "cd /var/www/alessa-ordering && curl -s http://localhost:4000/order | grep -o '?t=[0-9]\{13\}' | head -5"
```

---

## 💡 TIPS

1. **Copy-paste prompts directly** - They're ready to use
2. **Run one prompt at a time** - Wait for results before next
3. **Check logs after deployment** - Always verify success
4. **Test after changes** - Don't skip verification
5. **Keep backups** - Git commits are your backup

---

## 🚨 EMERGENCY PROMPTS

### Site is Down
```
Site is down! Emergency fix:
1. Check PM2 status
2. Check error logs
3. Restart PM2
4. Check database connection
5. Check disk space
6. Check memory usage
7. If all fails, rollback to previous commit

VPS: root@77.243.85.8
Path: /var/www/alessa-ordering
```

### Database Connection Lost
```
Database connection lost:
1. Check database service (systemctl status postgresql)
2. Check DATABASE_URL in .env
3. Test connection manually
4. Check database logs
5. Restart database if needed

VPS: root@77.243.85.8
```

---

## 📚 Additional Resources

- **Testing Guide**: `docs/IMAGE_CACHE_TESTING.md`
- **Deployment Script**: `deploy.sh`
- **Verification Script**: `scripts/verify-cache-busting.sh`
- **PM2 Config**: `ecosystem.config.js`

---

**Ready to use!** Just copy-paste any prompt into Claude in VS Code chat. 🚀

