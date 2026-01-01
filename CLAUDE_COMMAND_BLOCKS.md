# 🚀 Claude Command Blocks - Quick Reference

Ready-to-use command blocks for Claude in VS Code. Copy and paste these prompts directly into your chat.

---

## 📦 DEPLOYMENT COMMANDS

### Deploy Latest Changes to VPS
```
## 🚀 Deploy to VPS
I need to deploy the latest changes to the VPS. Please:
1. Commit and push changes to git
2. SSH into VPS (root@77.243.85.8)
3. Pull latest changes
4. Install dependencies if needed
5. Build the application
6. Restart PM2 process

The VPS path is /var/www/alessa-ordering and the PM2 process name is "alessa-ordering".
```

### Quick Deploy (No Commit)
```
## ⚡ Quick Deploy
Deploy current changes to VPS without committing:
1. SSH into VPS
2. Pull latest from git
3. Install dependencies
4. Build
5. Restart PM2

VPS: root@77.243.85.8
Path: /var/www/alessa-ordering
```

---

## ✅ VERIFICATION COMMANDS

### Check System Status
```
## ✅ Check System Status
Please verify:
1. PM2 process status
2. Application logs (last 50 lines)
3. Order page accessibility (HTTP status)
4. Admin dashboard accessibility
5. Database connection
6. Cache-busting timestamps in HTML

VPS: root@77.243.85.8
App: /var/www/alessa-ordering
```

### Verify Deployment
```
## 🔍 Verify Deployment
Check if deployment was successful:
1. PM2 status (should be online)
2. Recent logs (no errors)
3. Build artifacts exist (.next/BUILD_ID)
4. Application responds on port 4000
5. Cache-busting working (check HTML for ?t= timestamps)

VPS: root@77.243.85.8
```

### Quick Health Check
```
## 🏥 Quick Health Check
Run a quick health check:
- PM2 status
- Order page HTTP status
- Recent error logs
- Disk space
- Memory usage

VPS: root@77.243.85.8
```

---

## 🧪 TESTING COMMANDS

### Test Image Cache Fix
```
## 🧪 Test Image Cache Fix
Test that image cache-busting is working:
1. Check if build includes cache-busting changes
2. Verify tenant updatedAt field is being used
3. Test uploading a new image via admin panel
4. Verify image URL includes ?t= timestamp parameter
5. Check that frontend shows new image immediately

Admin login: /admin/login
Order page: /order
```

### Test Landing Page
```
## 🌐 Test Landing Page
Test the landing page functionality:
1. Verify landing page shows on root domain (alessacloud.com)
2. Check tenant subdomains redirect to /order
3. Test admin login links work
4. Verify super admin can access dashboard
5. Check responsive design on mobile/tablet
```

### Test Full System
```
## 🧪 Test Full System
Run comprehensive tests:
1. Order page loads correctly
2. Admin dashboard works
3. Super admin dashboard works
4. Image upload and cache-busting
5. Stripe integration (test mode)
6. Menu management
7. Cart functionality
```

---

## 🔧 TROUBLESHOOTING COMMANDS

### Fix Build Errors
```
## 🔧 Fix Build Errors
I'm getting build errors. Please:
1. Check the build output
2. Identify the error
3. Fix the issue
4. Rebuild and verify

Show me the error and the fix.
```

### Application Not Responding
```
## 🚨 App Not Responding
The application is not responding. Please:
1. Check PM2 status
2. Check recent logs for errors
3. Check if port 4000 is listening
4. Check database connection
5. Restart PM2 if needed
6. Check system resources (memory, disk)

VPS: root@77.243.85.8
```

### Database Connection Issues
```
## 🗄️ Database Connection Issues
Having database connection problems. Please:
1. Test database connection
2. Check DATABASE_URL in .env
3. Verify PostgreSQL is running
4. Check connection string format
5. Test with Prisma Client

VPS: root@77.243.85.8
```

### PM2 Process Issues
```
## ⚙️ PM2 Process Issues
PM2 process is having issues. Please:
1. Check PM2 status
2. View recent logs
3. Check for errors
4. Restart the process
5. Check PM2 configuration
6. Verify environment variables

Process: alessa-ordering
VPS: root@77.243.85.8
```

---

## 📊 MONITORING COMMANDS

### Check Performance
```
## 📊 Check Performance
Monitor application performance:
1. PM2 memory and CPU usage
2. Response times
3. Database query performance
4. Build size
5. Recent error rate

VPS: root@77.243.85.8
```

### View Logs
```
## 📋 View Logs
Show me the application logs:
1. Last 50 lines of output logs
2. Last 50 lines of error logs
3. Any critical errors
4. Recent warnings

VPS: root@77.243.85.8
Process: alessa-ordering
```

### System Resources
```
## 💻 System Resources
Check system resources:
1. Disk space usage
2. Memory usage
3. CPU usage
4. Running processes
5. Network connections

VPS: root@77.243.85.8
```

---

## 🎨 UI/UX COMMANDS

### Improve UI/UX
```
## 🎨 Improve UI/UX
Enhance the UI/UX:
1. Better animations and transitions
2. Improved spacing and typography
3. Better color schemes
4. Enhanced hover states
5. Improved mobile responsiveness

Focus on: [specify component/page]
```

### Add Feature
```
## ✨ Add Feature
Add a new feature:
[Describe the feature you want]

Requirements:
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]
```

### Fix UI Bug
```
## 🐛 Fix UI Bug
Fix a UI bug:
[Describe the bug]

Location: [component/page]
Expected behavior: [what should happen]
Current behavior: [what's happening]
```

---

## 🔄 MAINTENANCE COMMANDS

### Update Dependencies
```
## 📦 Update Dependencies
Update npm dependencies:
1. Check for outdated packages
2. Update safely
3. Test build
4. Check for breaking changes
5. Update package.json and package-lock.json
```

### Clean Build
```
## 🧹 Clean Build
Clean and rebuild:
1. Remove .next directory
2. Remove node_modules
3. Clear npm cache
4. Reinstall dependencies
5. Rebuild application
6. Verify build succeeds

VPS: root@77.243.85.8
```

### Backup Database
```
## 💾 Backup Database
Create a database backup:
1. Connect to database
2. Create backup file
3. Verify backup integrity
4. Store backup location

VPS: root@77.243.85.8
Database: alessa_ordering
```

---

## 🚨 EMERGENCY COMMANDS

### Emergency Rollback
```
## 🚨 Emergency Rollback
Something went wrong after deployment. Please:
1. Check git log for last working commit
2. Revert to previous commit
3. Rebuild application
4. Restart PM2
5. Verify rollback successful

VPS: root@77.243.85.8
```

### Restart Everything
```
## 🔄 Restart Everything
Restart all services:
1. Stop PM2 process
2. Clear any locks
3. Restart PM2
4. Check status
5. Verify application responds

VPS: root@77.243.85.8
```

### Check What Broke
```
## 🔍 Check What Broke
Something broke. Please:
1. Check recent git commits
2. Check PM2 logs for errors
3. Check build errors
4. Check database errors
5. Identify the root cause
6. Suggest fix

VPS: root@77.243.85.8
```

---

## 📝 QUICK ACTIONS

### Quick Status Check
```
## ⚡ Quick Status
Quick status check:
- PM2: online?
- App: responding?
- Build: successful?
- Errors: none?

VPS: root@77.243.85.8
```

### Quick Restart
```
## 🔄 Quick Restart
Restart PM2 process:
1. Stop alessa-ordering
2. Start alessa-ordering
3. Check status
4. Verify it's online

VPS: root@77.243.85.8
```

### Quick Logs
```
## 📋 Quick Logs
Show last 20 lines of logs:
- Output logs
- Error logs
- Any critical issues

VPS: root@77.243.85.8
Process: alessa-ordering
```

---

## 🎯 FEATURE-SPECIFIC COMMANDS

### Test Image Upload
```
## 🖼️ Test Image Upload
Test image upload functionality:
1. Go to admin settings
2. Upload new tenant logo
3. Verify image appears on frontend
4. Check cache-busting timestamp changes
5. Verify no cache issues

Admin: /admin/login
Order: /order
```

### Test Payment Flow
```
## 💳 Test Payment Flow
Test Stripe payment integration:
1. Add items to cart
2. Go to checkout
3. Use test card: 4242 4242 4242 4242
4. Complete payment
5. Verify order created
6. Check admin dashboard for order

Test card: 4242 4242 4242 4242
Expiry: 12/25
CVC: 123
```

### Test Menu Management
```
## 📋 Test Menu Management
Test menu management:
1. Login to admin
2. Add new menu item
3. Upload image
4. Set price and description
5. Verify appears on order page
6. Test editing and deleting

Admin: /admin/login
```

---

## 🔐 SECURITY COMMANDS

### Check Environment Variables
```
## 🔐 Check Environment Variables
Verify environment variables are set:
1. Check .env file exists
2. Verify critical variables (DATABASE_URL, NEXTAUTH_URL, STRIPE keys)
3. Check for exposed secrets
4. Verify production values

VPS: root@77.243.85.8
Path: /var/www/alessa-ordering/.env
```

### Security Audit
```
## 🛡️ Security Audit
Run a security audit:
1. Check for exposed API keys
2. Verify authentication is working
3. Check for SQL injection risks
4. Verify HTTPS/SSL
5. Check file permissions
6. Review access controls
```

---

## 📈 ANALYTICS COMMANDS

### Check Metrics
```
## 📈 Check Metrics
Show platform metrics:
1. Total tenants
2. Total orders
3. 7-day volume
4. Top performers
5. Recent activity

Super admin: /super-admin
```

### Tenant Performance
```
## 📊 Tenant Performance
Check tenant performance:
1. Orders last 7 days
2. Revenue last 7 days
3. All-time stats
4. Last order date
5. Stripe connection status

Tenant: [tenant name/slug]
```

---

## 🎨 DESIGN COMMANDS

### Improve Component
```
## 🎨 Improve Component
Improve this component:
[Component name/path]

Requirements:
- Better visual design
- Improved animations
- Better spacing
- Enhanced typography
- Mobile responsive
```

### Add Animation
```
## ✨ Add Animation
Add smooth animations to:
[Component/page]

Type: [fade, slide, scale, etc.]
Duration: [specify]
Trigger: [hover, scroll, load, etc.]
```

---

## 💡 TIPS FOR USING THESE COMMANDS

1. **Copy the entire block** - Include the header (##) for context
2. **Customize as needed** - Add specific details for your situation
3. **One command at a time** - Don't combine multiple commands
4. **Be specific** - Add file paths, component names, or error messages
5. **Follow up** - Ask for clarification if needed

---

## 🚀 QUICK START EXAMPLES

### First Time Deployment
```
## 🚀 First Time Deployment
Deploy for the first time:
1. Check git status
2. Commit all changes
3. Push to GitHub
4. SSH to VPS
5. Clone repository
6. Install dependencies
7. Build application
8. Set up PM2
9. Configure Nginx
10. Test everything

VPS: root@77.243.85.8
Path: /var/www/alessa-ordering
```

### Daily Check
```
## ☕ Daily Check
Morning status check:
- PM2: online?
- Recent errors?
- Disk space OK?
- Memory usage OK?
- App responding?

VPS: root@77.243.85.8
```

### After Code Changes
```
## 🔄 After Code Changes
I made code changes. Please:
1. Test build locally
2. Commit changes
3. Push to GitHub
4. Deploy to VPS
5. Verify deployment
6. Test functionality

VPS: root@77.243.85.8
```

---

## 🏢 MULTI-TENANT RULES (CRITICAL)

### ⚠️ NEVER DO
- **NEVER hardcode tenant slugs** (e.g., 'lasreinas', 'lapoblanita')
- **NEVER hardcode tenant UUIDs**
- **NEVER use fallback tenant** - fail explicitly if tenant can't be resolved
- **NEVER expose VPS-specific data** (UUIDs, internal IPs, etc.) in code

### ✅ ALWAYS DO
- **ALWAYS use `requireTenant()`** or tenant context from session/cookie
- **ALWAYS filter by `tenantId`** in every database query involving tenant data
- **ALWAYS parameterize URLs** using tenant's domain or subdomain
- **ALWAYS use env vars for credentials** - pattern: `TENANT_ADMIN_{SLUG}_*`

### 🔧 Environment Variable Patterns
```bash
# Per-tenant admin credentials
TENANT_ADMIN_LASREINAS_EMAIL=admin@lasreinas.com
TENANT_ADMIN_LASREINAS_PASSWORD=[secure]
TENANT_ADMIN_LAPOBLANITA_EMAIL=admin@lapoblanita.com
TENANT_ADMIN_LAPOBLANITA_PASSWORD=[secure]
```

### 🛡️ Protected Tenant: Las Reinas
- Baseline tag: `v1.2.0-mvp-jan1`
- Production since: January 1, 2026
- Any changes require explicit approval
- Monitor for regressions after any deployment

### 📋 Multi-Tenant Checklist
```
## 🏢 Multi-Tenant Checklist
When adding new features or fixing bugs:
[ ] Does this code use requireTenant() or tenant context?
[ ] Are all database queries filtered by tenantId?
[ ] Are URLs dynamically built from tenant domain?
[ ] Are there NO hardcoded tenant slugs or UUIDs?
[ ] Is Las Reinas unaffected by this change?
[ ] Did I test on at least 2 tenants?
```

### 🆕 New Tenant Setup Checklist
```
## 🆕 New Tenant Setup
To set up a new tenant:
1. [ ] Create tenant in database (via super admin or script)
2. [ ] Set tenant status to LIVE
3. [ ] Add TENANT_ADMIN_{SLUG}_EMAIL and _PASSWORD to VPS .env
4. [ ] Configure operating hours in TenantSettings
5. [ ] Set up Stripe Connect (admin → settings → connect)
6. [ ] Configure custom domain in Nginx (if applicable)
7. [ ] Set up SSL certificate with certbot
8. [ ] Upload menu items
9. [ ] Test order flow end-to-end
10. [ ] Set up print relay (if physical location)
```

---

**💡 Pro Tip:** Bookmark this file and keep it open in VS Code for quick access to these command blocks!

