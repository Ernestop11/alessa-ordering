# VPS Diagnostic Guide - Page Down Issue

## Quick Fix Steps

If the page is down, follow these steps in order:

### 1. Check PM2 Status
```bash
ssh root@77.243.85.8
pm2 status
pm2 logs alessa-ordering --lines 50
```

### 2. Restart the App
```bash
pm2 restart alessa-ordering
# Or if that doesn't work:
pm2 stop alessa-ordering
pm2 start ecosystem.config.js
```

### 3. Check Database Connection
```bash
cd /var/www/alessa-ordering
# Check if database is accessible
psql -U alessa_ordering_user -d alessa_ordering -c "SELECT 1;"
```

### 4. Check Nginx Status
```bash
systemctl status nginx
nginx -t
# If there are errors, restart:
systemctl restart nginx
```

### 5. Check Port Status
```bash
# Check if the app is listening on the correct port
netstat -tlnp | grep 4000
# Or
ss -tlnp | grep 4000
```

### 6. Full Restart Sequence
```bash
cd /var/www/alessa-ordering
pm2 restart alessa-ordering
systemctl restart nginx
```

## Common Issues

### Database Connection Error
If you see "Authentication failed against database server":
- Check database credentials in `.env`
- Verify PostgreSQL is running: `systemctl status postgresql`
- Check database user exists: `psql -U postgres -c "\du"`

### Port Already in Use
If port 4000 is already in use:
- Check what's using it: `lsof -i :4000`
- Kill the process or change the port in `ecosystem.config.js`

### App Crashed
If PM2 shows the app as "errored" or "stopped":
- Check logs: `pm2 logs alessa-ordering --lines 100`
- Restart: `pm2 restart alessa-ordering`
- If it keeps crashing, check the error logs

## Emergency Rollback

If the recent changes caused issues:
```bash
cd /var/www/alessa-ordering
git log --oneline -5
git checkout <previous-commit-hash>
npm run build
pm2 restart alessa-ordering
```

## Verify Fix

After restarting:
1. Check PM2 status: `pm2 status`
2. Check logs: `pm2 logs alessa-ordering --lines 20`
3. Test the site: `curl http://localhost:4000`
4. Check from browser: Visit your domain

