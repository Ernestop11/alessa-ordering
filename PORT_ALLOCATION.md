# VPS Port Allocation

This document tracks port assignments for all applications on the Hostinger VPS to prevent conflicts.

## Port Registry

| Port | App Name | Directory | PM2 Process Name | Notes |
|------|----------|-----------|------------------|-------|
| 3000 | Alessa Ordering Platform | /var/www/alessa-ordering | alessa-ordering | Multi-tenant restaurant ordering (Next.js) |
| 3001 | *Available* | - | - | Reserved for future apps |
| 3002 | *Available* | - | - | Reserved for future apps |
| 3003 | *Available* | - | - | Reserved for future apps |
| 3004 | *Available* | - | - | Reserved for future apps |
| 80 | Nginx | - | - | HTTP (redirects to HTTPS) |
| 443 | Nginx | - | - | HTTPS with SSL certificates |

## PM2 Process Naming Convention

To avoid conflicts, each app should use a unique PM2 process name and namespace:

```javascript
// ecosystem.config.js
{
  name: 'app-name',           // Unique identifier (e.g., alessa-ordering)
  namespace: 'project-group',  // Group related apps (e.g., alessa, azteka)
  env: {
    PORT: 3000                 // Explicit port assignment
  }
}
```

## Adding a New App

When deploying a new application:

1. **Choose an unused port** from the table above
2. **Update this document** with the new allocation
3. **Configure ecosystem.config.js** with unique name and port
4. **Update Nginx** to proxy the domain to the port:
   ```nginx
   location / {
     proxy_pass http://127.0.0.1:PORT;
   }
   ```
5. **Deploy with PM2** using the specific process name:
   ```bash
   pm2 start ecosystem.config.js
   pm2 save --force
   ```

## Checking Current Port Usage

```bash
# List all PM2 processes
pm2 list

# Check what's listening on each port
ss -tlnp | grep :3000
ss -tlnp | grep :3001
```

## PM2 Management Commands

```bash
# Start this app only
pm2 start ecosystem.config.js

# Reload this app only (zero-downtime)
pm2 reload alessa-ordering

# Stop this app only
pm2 stop alessa-ordering

# Restart this app only
pm2 restart alessa-ordering

# View logs for this app only
pm2 logs alessa-ordering

# Delete this app from PM2
pm2 delete alessa-ordering

# Save PM2 process list (run after any changes)
pm2 save --force
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using the port
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or restart PM2
pm2 restart alessa-ordering
```

### Multiple Apps Conflicting

```bash
# List all processes with details
pm2 list

# Delete old/duplicate processes
pm2 delete <id or name>

# Reload from ecosystem.config.js
pm2 start ecosystem.config.js
pm2 save --force
```

## Isolation Best Practices

1. **Unique Names**: Never reuse PM2 process names across apps
2. **Explicit Ports**: Always set `PORT` in `env` section
3. **Separate Logs**: Configure `error_file` and `out_file` per app
4. **Namespaces**: Group related apps with the `namespace` property
5. **Reload by Name**: Always use `pm2 reload <app-name>` not `pm2 reload all`
6. **Save Often**: Run `pm2 save --force` after any PM2 changes

## Environment Variables per App

Each app should have its own `.env` file in its directory:
- `/var/www/alessa-ordering/.env` - Alessa Ordering Platform
- `/var/www/your-other-app/.env` - Your Other App

This prevents environment variable conflicts between applications.
