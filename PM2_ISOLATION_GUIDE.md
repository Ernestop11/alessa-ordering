# PM2 Process Isolation Guide

## Problem Solved

This document explains how we implemented PM2 process isolation to prevent conflicts when running multiple Node.js applications on the same VPS.

## What Changed

### 1. Unique Process Naming

**Before:**
```javascript
// ecosystem.config.js
{
  name: 'alessa',  // Generic name - can conflict with other apps
  ...
}
```

**After:**
```javascript
// ecosystem.config.js
{
  name: 'alessa-ordering',      // Unique, descriptive name
  namespace: 'alessa',          // Group related apps together
  ...
}
```

### 2. Explicit Port Configuration

Added explicit `PORT` environment variable to prevent port conflicts:

```javascript
env: {
  NODE_ENV: 'production',
  PORT: 3000  // Explicit port assignment
}
```

### 3. Dedicated Log Files

Configured separate log files per application:

```javascript
error_file: '/var/log/pm2/alessa-ordering-error.log',
out_file: '/var/log/pm2/alessa-ordering-out.log',
```

### 4. Resource Limits

Added memory limit to prevent one app from consuming all resources:

```javascript
max_memory_restart: '1G',
```

### 5. Deployment Script Updates

Updated [scripts/deploy.sh](scripts/deploy.sh) to reload only this specific app:

```bash
# Before: This would reload ALL PM2 apps
pm2 reload ecosystem.config.js

# After: This reloads only alessa-ordering
pm2 reload alessa-ordering || pm2 start ecosystem.config.js
pm2 save --force
```

## Port Allocation

All apps on the VPS should use unique ports. See [PORT_ALLOCATION.md](PORT_ALLOCATION.md) for the registry.

| App | Port | PM2 Name |
|-----|------|----------|
| Alessa Ordering | 3000 | alessa-ordering |
| Your Next App | 3001 | your-next-app |
| Another App | 3002 | another-app |

## Admin Panel Fix

We also fixed the issue where admin panel changes weren't reflecting on the frontend:

### Root Cause
Next.js was caching rendered pages in production, so database updates weren't visible without a rebuild.

### Solution
Added `export const dynamic = 'force-dynamic'` to:
- [app/layout.tsx:39](app/layout.tsx#L39)
- [app/order/page.tsx:6](app/order/page.tsx#L6)

This forces Next.js to render pages dynamically on every request, ensuring admin changes appear immediately.

## Deployment Commands

### Deploy This App
```bash
# From your local machine
./scripts/deploy.sh

# Or manually on VPS
cd /var/www/alessa-ordering
git pull
npm ci
npm run build
pm2 reload alessa-ordering
pm2 save --force
```

### Start/Stop/Restart
```bash
# Start the app
pm2 start ecosystem.config.js

# Reload (zero-downtime restart)
pm2 reload alessa-ordering

# Restart (with brief downtime)
pm2 restart alessa-ordering

# Stop
pm2 stop alessa-ordering

# Delete from PM2
pm2 delete alessa-ordering
```

### View Logs
```bash
# View real-time logs
pm2 logs alessa-ordering

# View last 100 lines
pm2 logs alessa-ordering --lines 100

# View only errors
pm2 logs alessa-ordering --err

# View only output
pm2 logs alessa-ordering --out
```

### Monitor
```bash
# Interactive monitoring
pm2 monit

# Process list
pm2 list

# Detailed info about this app
pm2 describe alessa-ordering

# Environment variables
pm2 env 0
```

## Adding a New App to the VPS

When you need to deploy another application:

1. **Choose a unique port** from [PORT_ALLOCATION.md](PORT_ALLOCATION.md)

2. **Create ecosystem config** in your new app:
```javascript
module.exports = {
  apps: [{
    name: 'your-app-name',        // Unique name
    namespace: 'your-namespace',   // Group identifier
    cwd: '/var/www/your-app',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3001                   // Different port!
    },
    error_file: '/var/log/pm2/your-app-error.log',
    out_file: '/var/log/pm2/your-app-out.log',
  }]
}
```

3. **Update Nginx** to proxy the domain:
```nginx
# /etc/nginx/sites-enabled/your-domain.com
server {
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3001;  # Your app's port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4. **Deploy your app**:
```bash
cd /var/www/your-app
pm2 start ecosystem.config.js
pm2 save --force
```

5. **Update [PORT_ALLOCATION.md](PORT_ALLOCATION.md)** with your app's details

## Troubleshooting

### Port Already in Use
```bash
# Find what's using the port
lsof -i :3000

# Kill the process
kill -9 <PID>

# Restart the PM2 app
pm2 restart alessa-ordering
```

### Process Keeps Restarting
```bash
# Check error logs
pm2 logs alessa-ordering --err --lines 50

# Check if .env file exists
ls -la /var/www/alessa-ordering/.env

# Verify environment variables
pm2 env 0
```

### Out of Memory
```bash
# Check memory usage
pm2 list
free -h

# Increase max_memory_restart in ecosystem.config.js
# Or reduce instances count
```

### Multiple Processes Running
```bash
# List all PM2 processes
pm2 list

# Delete duplicates
pm2 delete <id or name>

# Save the clean state
pm2 save --force
```

## Best Practices

1. **Always use unique names** - Never reuse PM2 process names
2. **Explicit ports** - Always set `PORT` in the `env` section
3. **Separate logs** - Configure dedicated log files per app
4. **Reload by name** - Use `pm2 reload app-name`, not `pm2 reload all`
5. **Save after changes** - Always run `pm2 save --force` after PM2 changes
6. **Namespace related apps** - Use namespaces to group related applications
7. **Document ports** - Keep [PORT_ALLOCATION.md](PORT_ALLOCATION.md) up to date
8. **Monitor resources** - Use `pm2 monit` to watch CPU/memory usage

## Current Status

✅ **Admin panel updates now reflect immediately** (no rebuild needed)
✅ **PM2 process isolation configured** (no conflicts with other apps)
✅ **Unique naming and port allocation** (documented in PORT_ALLOCATION.md)
✅ **Deployment script updated** (reloads only this app)
✅ **Site live at:** https://lapoblanitamexicanfood.com/

## Next Steps for Other Apps

1. Review [PORT_ALLOCATION.md](PORT_ALLOCATION.md) and assign ports
2. Create ecosystem.config.js for each app following this template
3. Update Nginx configs for each domain
4. Deploy and test each app independently
5. Use `pm2 list` to verify all apps run without conflicts

## Support Commands Reference

```bash
# Full system status
pm2 list && pm2 status

# All logs from all apps
pm2 logs

# Restart all apps (use with caution!)
pm2 restart all

# Save current PM2 state
pm2 save --force

# Restore PM2 apps on boot
pm2 startup
pm2 save

# Kill PM2 daemon (will stop all apps!)
pm2 kill
```
