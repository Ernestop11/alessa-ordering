# 🚀 Alfred AI Assistant - Deployment Guide

## Sprint 1: Infrastructure Setup

### Step 1: Update Port Registry ✅
- Port 4010 allocated to Alfred
- Documented in VPS_PORT_REGISTRY.md

### Step 2: Deploy Alfred Service

```bash
# SSH into VPS
ssh root@77.243.85.8

# Navigate to agent-console
cd /srv/agent-console

# Copy ecosystem config
cp /path/to/alfred-setup/ecosystem.config.cjs ecosystem.config.cjs

# Copy API routes
cp -r /path/to/alfred-setup/app/api/alfred app/api/

# Install dependencies (if needed)
npm install --legacy-peer-deps

# Build the application
npm run build

# Start with PM2
pm2 start ecosystem.config.cjs
pm2 save

# Check status
pm2 status alfred-ai
pm2 logs alfred-ai --lines 50
```

### Step 3: Configure Caddy/Nginx

Add to `/etc/caddy/Caddyfile`:

```
alfred.alessacloud.com {
    reverse_proxy 127.0.0.1:4010
}
```

Or add route to existing alessacloud.com:

```
alessacloud.com {
    # ... existing config ...
    
    handle /alfred/* {
        reverse_proxy 127.0.0.1:4010
    }
}
```

Reload Caddy:
```bash
sudo systemctl reload caddy
# or
sudo nginx -t && sudo systemctl reload nginx
```

### Step 4: Environment Variables

Add to `/srv/agent-console/.env.local`:

```env
PORT=4010
ALFRED_MODE=production
ALESSA_API_URL=http://localhost:4000
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here
```

### Step 5: Update Alessa Ordering

Add to `/var/www/alessa-ordering/.env`:

```env
ALFRED_API_URL=http://localhost:4010
```

### Step 6: Test Connection

```bash
# Test Alfred API directly
curl http://localhost:4010/api/alfred/status

# Test from Alessa Ordering
curl http://localhost:4000/api/alfred/status
```

## Verification Checklist

- [ ] Port 4010 is free and listening
- [ ] PM2 process `alfred-ai` is running
- [ ] Alfred API responds at `/api/alfred/status`
- [ ] Super Admin shows Alfred tab
- [ ] Alfred panel loads and shows status
- [ ] Caddy/Nginx routes correctly

## Next Sprints

### Sprint 2: Learning System
- Event recording
- Pattern analysis
- Improvement generation

### Sprint 3: Communication
- WebSocket real-time updates
- Task queue integration

### Sprint 4: Capabilities
- Code cleaning
- UI improvements
- Performance monitoring

