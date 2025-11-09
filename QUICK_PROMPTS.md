# ⚡ Quick Prompts - Copy & Paste

## 🚀 Deploy to VPS
```
Deploy latest changes to VPS:
1. Commit and push: git add . && git commit -m "Update" && git push
2. SSH and deploy: ssh root@77.243.85.8 "cd /var/www/alessa-ordering && git pull && npm install && npm run build && pm2 restart alessa-ordering && pm2 status"
```

## ✅ Check Status
```
Check deployment status:
ssh root@77.243.85.8 "pm2 list && pm2 logs alessa-ordering --lines 20 --nostream"
```

## 🔄 Restart App
```
Restart application:
ssh root@77.243.85.8 "cd /var/www/alessa-ordering && pm2 restart alessa-ordering && pm2 status"
```

## 🧪 Test Cache-Busting
```
Verify cache-busting is working:
ssh root@77.243.85.8 "cd /var/www/alessa-ordering && curl -s http://localhost:4000/order | grep -o '?t=[0-9]\{13\}' | head -5"
```

## 🔍 Check Logs
```
Show recent logs:
ssh root@77.243.85.8 "pm2 logs alessa-ordering --lines 50"
```

## 🗄️ Check Database
```
Test database connection:
ssh root@77.243.85.8 "cd /var/www/alessa-ordering && node -e \"const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\\\$connect().then(() => console.log('✅ OK')).catch(err => console.log('❌ FAIL:', err.message));\""
```

## 🏗️ Build Locally
```
Build application locally:
npm run build
```

## 🧪 Test Locally
```
Run development server:
npm run dev
```

## 📊 Full Health Check
```
Run comprehensive health check:
ssh root@77.243.85.8 "cd /var/www/alessa-ordering && pm2 list && pm2 describe alessa-ordering && echo '---' && pm2 logs alessa-ordering --lines 30 --nostream && echo '---' && ls -la .next/BUILD_ID && echo '---' && node -e \"const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\\\$connect().then(() => console.log('✅ DB OK')).catch(err => console.log('❌ DB FAIL'));\""
```

## 🚨 Site Down? Emergency Fix
```
Emergency troubleshooting:
ssh root@77.243.85.8 "cd /var/www/alessa-ordering && pm2 restart alessa-ordering && sleep 3 && pm2 status && pm2 logs alessa-ordering --lines 20 --nostream"
```

---

**VPS Details:**
- Host: `root@77.243.85.8`
- Path: `/var/www/alessa-ordering`
- PM2: `alessa-ordering`
- Port: `4000`

**Quick Copy:**
- Deploy: First prompt above
- Status: Second prompt above
- Restart: Third prompt above

