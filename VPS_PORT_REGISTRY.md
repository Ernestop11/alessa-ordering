# 🔌 VPS Port Allocation Registry

**VPS IP**: 77.243.85.8
**Last Updated**: December 19, 2025

---

## 📊 Port Allocation Table

| Port | Application | Type | Status | Owner | Notes |
|------|-------------|------|--------|-------|-------|
| **22** | SSH | System | 🟢 Active | System | Default SSH port |
| **80** | HTTP | Nginx | 🟢 Active | Nginx | Redirects to HTTPS |
| **443** | HTTPS | Nginx | 🟢 Active | Nginx | SSL termination |
| **3000** | azteka-api | Vite | 🟢 Active | azteka-dsd | Vite preview server |
| **4000** | alessa-ordering | Next.js | 🟢 Active | alessa-ordering | **RESERVED - DO NOT USE** |
| **4010** | alfred-ai | Next.js | 🟢 Active | alessa | AI Assistant (Alfred) |
| **5432** | PostgreSQL | Database | 🟢 Active | System | Multiple databases |

---

## ⛔ RESERVED PORTS - DO NOT USE

### Port 4000: alessa-ordering (Next.js)

```
┌─────────────────────────────────────────────────────────────────┐
│  PORT 4000 - RESERVED FOR ALESSA ORDERING                       │
│                                                                   │
│  Application:  alessa-ordering (Next.js 14.2.21)                 │
│  Process:      PM2 (namespace: alessa)                           │
│  Directory:    /var/www/alessa-ordering                          │
│  Domains:      lapoblanitamexicanfood.com, alessacloud.com       │
│  Status:       PRODUCTION - CRITICAL                             │
│                                                                   │
│  ⚠️ DO NOT START ANY OTHER SERVICE ON THIS PORT ⚠️              │
└─────────────────────────────────────────────────────────────────┘
```

**Check if port is in use**:
```bash
lsof -i :4000
# Expected: PM2 v6.0.13: alessa-ordering
```

**If you see "EADDRINUSE :4000"**:
```bash
# Find what's using the port
lsof -i :4000

# If it's NOT alessa-ordering, kill it:
kill -9 [PID]

# Then restart alessa-ordering
pm2 restart alessa-ordering
```

---

### Port 3000: azteka-api (Vite)

```
┌─────────────────────────────────────────────────────────────────┐
│  PORT 3000 - RESERVED FOR AZTEKA DSD                            │
│                                                                   │
│  Application:  azteka-api (Vite preview)                         │
│  Process:      PM2 (namespace: default)                          │
│  Directory:    /srv/azteka-dsd                                   │
│  Status:       PRODUCTION                                        │
│                                                                   │
│  ⚠️ ALESSA-ORDERING MUST NOT USE THIS PORT ⚠️                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Port Conflict History

### Issue #1: November 7-8, 2025 (RESOLVED)
**Problem**: Both azteka-api and alessa-ordering configured for port 3000
**Symptom**: alessa-ordering failing to start, 15+ PM2 restarts
**Root Cause**: Hardcoded port in azteka-api Vite config, alessa using default 3000
**Solution**: Moved alessa-ordering to dedicated port 4000
**Status**: ✅ RESOLVED - Both apps running stable

**Evidence**:
```bash
# Before fix (BROKEN)
$ lsof -i :3000
COMMAND     PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
PM2\x20v6 85103 root    3u  IPv6 581234      0t0  TCP *:3000 (LISTEN)  # azteka-api
# alessa-ordering: FAILED TO START

# After fix (WORKING)
$ lsof -i :4000
COMMAND     PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
PM2\x20v6 88348 root    3u  IPv6 585862      0t0  TCP *:4000 (LISTEN)  # alessa-ordering

$ lsof -i :3000
COMMAND     PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
PM2\x20v6 85103 root    3u  IPv6 581234      0t0  TCP *:3000 (LISTEN)  # azteka-api
```

---

## 📋 Port Assignment Rules

### ✅ DO:
1. **Check port availability** before assigning
   ```bash
   lsof -i :[PORT]
   netstat -tlnp | grep :[PORT]
   ```

2. **Document new port assignments** in this file

3. **Use dedicated ports** for each application (no sharing)

4. **Test port binding** after configuration changes

5. **Reserve ports** in advance for new applications

### ❌ DON'T:
1. **Reuse ports** from active applications
2. **Assume port 3000** is free (it's not!)
3. **Share ports** between applications
4. **Use well-known ports** (< 1024) without sudo
5. **Modify port configs** without checking PM2 status first

---

## 🚨 Emergency Port Recovery

### If alessa-ordering won't start due to port conflict:

```bash
# 1. Check what's using port 4000
lsof -i :4000

# 2. If it's a rogue process, kill it
kill -9 [PID]

# 3. Verify port is free
lsof -i :4000
# Should return: nothing

# 4. Start alessa-ordering
pm2 start /var/www/alessa-ordering/ecosystem.config.js

# 5. Verify it's running
pm2 status | grep alessa-ordering
lsof -i :4000
```

### If you need to change alessa-ordering port (EMERGENCY ONLY):

```bash
# ⚠️ ONLY DO THIS IF ABSOLUTELY NECESSARY ⚠️

# 1. Stop the app
pm2 stop alessa-ordering

# 2. Update ecosystem.config.js
cd /var/www/alessa-ordering
nano ecosystem.config.js
# Change: PORT: [NEW_PORT]

# 3. Update Nginx configs
nano /etc/nginx/sites-enabled/lapoblanita
# Change: proxy_pass http://127.0.0.1:[NEW_PORT];

nano /etc/nginx/sites-enabled/alessacloud.com
# Change: proxy_pass http://127.0.0.1:[NEW_PORT];

# 4. Test Nginx
nginx -t

# 5. Reload Nginx
systemctl reload nginx

# 6. Restart app
pm2 restart alessa-ordering

# 7. Verify
curl -I https://lapoblanitamexicanfood.com/order

# 8. UPDATE THIS DOCUMENT!
```

---

## 🔒 Database Ports

### PostgreSQL (Port 5432)

```
┌─────────────────────────────────────────────────────────────────┐
│  PORT 5432 - POSTGRESQL DATABASE SERVER                         │
│                                                                   │
│  Databases:                                                      │
│    - alessa_ordering    (owner: alessa_ordering_user)            │
│    - azteka_dsd         (owner: azteka_user)                     │
│                                                                   │
│  Status:       PRODUCTION - CRITICAL                             │
│  Binding:      localhost only (not exposed externally)           │
│                                                                   │
│  ⚠️ DO NOT EXPOSE THIS PORT EXTERNALLY ⚠️                       │
└─────────────────────────────────────────────────────────────────┘
```

**Security Check**:
```bash
# Verify PostgreSQL is NOT exposed to internet
netstat -tlnp | grep 5432
# Expected: 127.0.0.1:5432 (localhost only)
# BAD:      0.0.0.0:5432 (exposed to internet!)
```

---

## 🌐 Nginx Port Mapping

### Port 443 (HTTPS) → Application Routing

```
┌──────────────────────────────────────────────────────────────┐
│  HTTPS (443) ROUTING VIA NGINX                               │
└──────────────────────────────────────────────────────────────┘

lapoblanitamexicanfood.com:443
  ↓
  Nginx SSL Termination
  ↓
  proxy_pass → http://127.0.0.1:4000
  ↓
  alessa-ordering (Next.js)

alessacloud.com:443
  ↓
  Nginx SSL Termination
  ↓
  proxy_pass → http://127.0.0.1:4000
  ↓
  alessa-ordering (Next.js)
```

---

## 📊 Port Usage Statistics

**Last Audit**: November 8, 2025

| Port | Protocol | Binding | Connections | Status |
|------|----------|---------|-------------|--------|
| 22 | TCP | 0.0.0.0 | ~5/day | ✅ Normal |
| 80 | TCP | 0.0.0.0 | ~1000/day | ✅ Normal (redirects) |
| 443 | TCP | 0.0.0.0 | ~10000/day | ✅ Normal |
| 3000 | TCP | ::1 | Internal | ✅ Normal |
| 4000 | TCP | ::1 | Internal | ✅ Normal |
| 5432 | TCP | 127.0.0.1 | Internal | ✅ Normal |

---

## 🔮 Future Port Allocations

**Reserved for future applications**:

| Port | Reserved For | Status | Notes |
|------|--------------|--------|-------|
| 4001 | Available | 🟡 Free | Consider for new tenant |
| 4002 | Available | 🟡 Free | Consider for new tenant |
| 4003 | Available | 🟡 Free | Consider for new tenant |
| 5000 | Avoid | ⚠️ Common default | Often used by dev servers |
| 8080 | Avoid | ⚠️ Common default | Often used by proxies |

---

## ✅ Port Health Checks

**Run these periodically**:

```bash
# Check all listening ports
netstat -tlnp

# Check PM2 ports
pm2 status

# Check Nginx upstream connections
nginx -T | grep proxy_pass

# Check for port conflicts
lsof -i :3000
lsof -i :4000

# Check firewall rules
ufw status
```

---

## 🚨 Port Conflict Prevention Checklist

Before deploying a new application:

- [ ] Check `netstat -tlnp` for port availability
- [ ] Choose a port from "Future Port Allocations" table
- [ ] Update this document with new port assignment
- [ ] Configure application to use assigned port
- [ ] Update Nginx config if needed
- [ ] Test port binding with `lsof -i :[PORT]`
- [ ] Add to PM2 ecosystem config
- [ ] Document in application's README

---

## 📞 Emergency Contacts

**If you encounter port conflicts**:

1. **Check this document first** for port assignments
2. **Check** `/var/log/pm2/[app]-error.log` for errors
3. **Run** `lsof -i :[PORT]` to identify the conflict
4. **DO NOT kill processes** without understanding what they do
5. **Ask project owner** before making changes

---

**REMEMBER**: Every application on this VPS must have its own dedicated port. Port sharing = production outages.

---

**END OF PORT REGISTRY**
