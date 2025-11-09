# VPS Multi-App Setup Guide

## Current Applications on VPS

Your Hostinger VPS (77.243.85.8) is running **multiple independent applications**. Here's the complete inventory:

### 1. Alessa Ordering Platform
- **Directories**: `/var/www/alessa-ordering`
- **PM2 Process**: `alessa-ordering` (namespace: `alessa`)
- **Port**: 3000
- **Domains**:
  - `alessacloud.com` (root domain + super admin)
  - `lapoblanitamexicanfood.com` (La Poblanita tenant)
  - `*.alessacloud.com` (any subdomain for multi-tenancy)
- **Tech Stack**: Next.js 14.2.21, PostgreSQL, Prisma
- **Nginx Config**: `/etc/nginx/sites-enabled/alessacloud.com`, `/etc/nginx/sites-enabled/lapoblanita`

### 2. Azteka Foods API
- **Directories**: `/srv/azteka-dsd` (likely)
- **PM2 Process**: `azteka-api`
- **Port**: 3002
- **Domains**: `aztekafoods.com`
- **Nginx Config**: `/etc/nginx/sites-enabled/azteka-dsd`

### 3. SwitchMenu (if active)
- **Status**: Config files found but may be inactive
- **Port**: Unknown
- **Nginx Configs**: Broken (referenced non-existent SSL certs)

---

## Port Allocation Registry

| Port | App | PM2 Name | Status | Notes |
|------|-----|----------|--------|-------|
| 3000 | Alessa Ordering | alessa-ordering | ✅ Running | Multi-tenant Next.js app |
| 3001 | *Available* | - | - | Reserved |
| 3002 | Azteka API | azteka-api | ✅ Running | Azteka Foods backend |
| 3003+ | *Available* | - | - | For future apps |
| 5432 | PostgreSQL | - | ✅ Running | Alessa DB |
| 27017 | MongoDB | - | ✅ Running | Possibly for Azteka/other apps |
| 6379 | Redis | - | ✅ Running | Cache/sessions |

---

## Nginx Configuration Strategy

### Best Practices for Multi-App Setup

Each app should have:
1. **Separate nginx config file** in `/etc/nginx/sites-available/`
2. **Unique server_name** (domain)
3. **Unique port** for the backend
4. **SSL certificate** via Certbot

### Current Issues Fixed

1. ✅ **Removed broken configs**: `switchmenu.conf`, `switchmenupro.conf` had invalid SSL certs
2. ✅ **Removed duplicate**: `alessa-ordering` config was duplicate of `alessacloud.com`
3. ✅ **Added uploads serving**: Both alessacloud.com and lapoblanita now serve `/uploads/`

### Nginx Config Template for New Apps

```nginx
# /etc/nginx/sites-available/your-app.conf
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Certbot will add SSL config here

    location / {
        proxy_pass http://127.0.0.1:YOUR_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 10M;
    }
}
```

**Enable the config:**
```bash
ln -s /etc/nginx/sites-available/your-app.conf /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

**Add SSL:**
```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## PM2 Process Isolation

### Current PM2 Processes

```bash
pm2 list
```

Expected output:
- `alessa-ordering` (namespace: alessa) - Port 3000
- `azteka-api` - Port 3002
- Other apps as needed

### PM2 Best Practices

1. **Unique names**: Each app must have a unique PM2 process name
2. **Namespaces**: Use namespaces to group related apps
3. **Explicit ports**: Always set PORT in env vars
4. **Reload by name**: Use `pm2 reload app-name`, never `pm2 reload all`

### Managing Alessa Ordering

```bash
# Start
pm2 start ecosystem.config.js

# Reload (zero-downtime)
pm2 reload alessa-ordering

# View logs
pm2 logs alessa-ordering

# Monitor
pm2 monit
```

---

## Avoiding Conflicts

### Nginx Conflicts

**Problem**: Multiple configs with same `server_name`
**Solution**: Each domain should appear in only ONE nginx config

**Problem**: Missing SSL certificates
**Solution**: Always run `certbot` before enabling configs with SSL

**Check for conflicts:**
```bash
# Find duplicate server names
for domain in $(grep -h 'server_name' /etc/nginx/sites-enabled/* | awk '{print $2}' | tr -d ';' | sort | uniq -d); do
    echo "Duplicate: $domain"
    grep -l "server_name.*$domain" /etc/nginx/sites-enabled/*
done

# Test nginx config
nginx -t
```

### PM2 Conflicts

**Problem**: Apps using same port
**Solution**: Assign unique ports (see Port Allocation Registry above)

**Problem**: Apps with same name
**Solution**: Use unique names + namespaces in `ecosystem.config.js`

**Check PM2 status:**
```bash
pm2 list
pm2 describe app-name
```

### Database Conflicts

**Alessa Ordering** uses:
- Database: `alessa_ordering`
- User: `alessa_ordering_user`
- PostgreSQL on default port 5432

**Other apps** should use:
- Different database names
- Different users (or same user with different databases)
- Or different ports if running separate DB instances

---

## Adding a New App (SwitchMenu Example)

When you want to add SwitchMenu or any new app:

### 1. Choose a Port
```bash
# Check what's in use
ss -tlnp | grep LISTEN
```
Pick next available port (e.g., 3003)

### 2. Deploy App Code
```bash
mkdir -p /var/www/switchmenu
cd /var/www/switchmenu
# ... deploy your code
```

### 3. Create PM2 Config
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'switchmenu-api',
    namespace: 'switchmenu',
    cwd: '/var/www/switchmenu',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3003
    },
    error_file: '/var/log/pm2/switchmenu-error.log',
    out_file: '/var/log/pm2/switchmenu-out.log',
  }]
}
```

### 4. Start with PM2
```bash
cd /var/www/switchmenu
pm2 start ecosystem.config.js
pm2 save
```

### 5. Create Nginx Config
```bash
nano /etc/nginx/sites-available/switchmenu.conf
```

Add:
```nginx
server {
    listen 80;
    server_name switchmenupro.com www.switchmenupro.com;

    location / {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 6. Enable & Add SSL
```bash
ln -s /etc/nginx/sites-available/switchmenu.conf /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
certbot --nginx -d switchmenupro.com -d www.switchmenupro.com
```

### 7. Update Documentation
Add to [PORT_ALLOCATION.md](PORT_ALLOCATION.md):
```markdown
| 3003 | SwitchMenu API | switchmenu-api | /var/www/switchmenu |
```

---

## Troubleshooting

### Nginx Won't Reload
```bash
# Test config
nginx -t

# Common issues:
# 1. Missing SSL cert - run certbot first
# 2. Syntax error - check the error message
# 3. Port conflict - check ss -tlnp
```

### PM2 App Won't Start
```bash
# Check logs
pm2 logs app-name --err --lines 50

# Common issues:
# 1. Port in use - change PORT in ecosystem.config.js
# 2. Missing dependencies - run npm install
# 3. Database connection - check .env file
```

### App Returns 502 Bad Gateway
```bash
# Check if app is running
pm2 list

# Check logs
pm2 logs app-name

# Common issues:
# 1. App crashed - check logs
# 2. Wrong port in nginx - verify proxy_pass matches app PORT
# 3. App not started - pm2 restart app-name
```

### Site Shows Wrong Content
```bash
# Check nginx config
cat /etc/nginx/sites-enabled/yourdomain.conf

# Common issues:
# 1. Proxying to wrong port
# 2. Duplicate server_name in multiple configs
# 3. Cached responses - clear browser cache
```

---

## Maintenance Commands

### Daily Health Check
```bash
# Check all services
pm2 list
systemctl status nginx
systemctl status postgresql

# Check disk space
df -h

# Check memory
free -h

# Check logs for errors
pm2 logs --err --lines 20
```

### Weekly Maintenance
```bash
# Update PM2
pm2 update

# Restart apps (during low traffic)
pm2 reload all

# Check for SSL cert expiry
certbot renew --dry-run
```

### Database Backups
```bash
# Backup Alessa Ordering DB
pg_dump -U alessa_ordering_user alessa_ordering > backup_$(date +%Y%m%d).sql

# Restore if needed
psql -U alessa_ordering_user alessa_ordering < backup_20251107.sql
```

---

## Current Status Summary

✅ **Working**:
- Alessa Ordering on alessacloud.com (super admin)
- La Poblanita on lapoblanitamexicanfood.com
- Azteka Foods on aztekafoods.com
- Photo uploads working on all Alessa domains
- PM2 process isolation configured

⚠️ **Monitoring**:
- PM2 restarts (currently stable after initial deployment)
- Nginx warnings about conflicting server names (cleaned up)

❌ **Broken** (cleaned up):
- switchmenu.conf (invalid SSL cert - removed)
- switchmenupro.conf (invalid SSL cert - removed)
- Duplicate alessa-ordering config (removed)

---

## Next Steps

When you want to deploy SwitchMenu or another app:

1. **Contact me** - I'll help you:
   - Choose the right port
   - Create isolated PM2 config
   - Set up Nginx properly
   - Avoid conflicts with existing apps

2. **Follow the "Adding a New App" section above**

3. **Update this document** with the new app details

---

## Support

For issues with:
- **Alessa Ordering**: Check [PM2_ISOLATION_GUIDE.md](PM2_ISOLATION_GUIDE.md) and [PORT_ALLOCATION.md](PORT_ALLOCATION.md)
- **Nginx conflicts**: Run `nginx -t` and check error messages
- **PM2 issues**: Run `pm2 logs app-name --err`
- **SSL certificates**: Run `certbot certificates` to see status

**Emergency recovery:**
```bash
# If nginx totally breaks
systemctl restart nginx

# If PM2 totally breaks
pm2 kill
pm2 resurrect

# If app won't start
pm2 delete app-name
cd /var/www/app-directory
pm2 start ecosystem.config.js
pm2 save
```
