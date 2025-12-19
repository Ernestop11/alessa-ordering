# 🚀 Sprint 2 Deployment Guide

## Learning System Core

### Dependencies Needed

```bash
npm install ioredis openai
npm install --save-dev @types/node
```

### Files to Deploy

1. **Learning System Core:**
   - `lib/learning/event-recorder.ts`
   - `lib/learning/pattern-analyzer.ts`
   - `lib/learning/improvement-engine.ts`
   - `lib/learning/index.ts`

2. **Updated API Routes:**
   - `app/api/alfred/status/route.ts` (updated)
   - `app/api/alfred/improve/route.ts` (updated)
   - `app/api/alfred/apply/route.ts` (updated)
   - `app/api/alfred/record/route.ts` (new)

### Deployment Steps

```bash
# 1. SSH into VPS
ssh root@77.243.85.8

# 2. Navigate to agent-console
cd /srv/agent-console

# 3. Install dependencies
npm install ioredis openai --legacy-peer-deps

# 4. Create lib directory structure
mkdir -p lib/learning

# 5. Copy learning system files
# (Use scp or git pull)

# 6. Copy updated API routes
# (Use scp or git pull)

# 7. Update .env.local with codebase path
echo "CODBASE_PATH=/var/www/alessa-ordering" >> .env.local

# 8. Rebuild
npm run build

# 9. Restart Alfred
pm2 restart alfred-ai

# 10. Test
curl http://localhost:4010/api/alfred/status
curl -X POST http://localhost:4010/api/alfred/improve
```

### Environment Variables

Add to `/srv/agent-console/.env.local`:

```env
REDIS_URL=redis://localhost:6379
CODBASE_PATH=/var/www/alessa-ordering
OPENAI_API_KEY=your_key_here
```

### Testing

1. **Test Event Recording:**
```bash
curl -X POST http://localhost:4010/api/alfred/record \
  -H "Content-Type: application/json" \
  -d '{
    "type": "user_action",
    "metadata": {
      "action": "click",
      "component": "AlfredPanel"
    }
  }'
```

2. **Test Improvement Cycle:**
```bash
curl -X POST http://localhost:4010/api/alfred/improve
```

3. **Check Status:**
```bash
curl http://localhost:4010/api/alfred/status
```

### Redis Setup

If Redis is not installed:

```bash
# Install Redis
apt-get update
apt-get install redis-server -y

# Start Redis
systemctl start redis-server
systemctl enable redis-server

# Test
redis-cli ping
```

### Verification

After deployment, verify:

- [ ] Redis is running
- [ ] Dependencies installed
- [ ] Learning system files in place
- [ ] API routes updated
- [ ] Alfred restarted
- [ ] Status API returns data
- [ ] Improvement cycle runs
- [ ] Events are recorded

