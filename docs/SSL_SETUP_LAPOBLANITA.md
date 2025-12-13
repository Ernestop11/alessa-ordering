# SSL Certificate Setup for lapoblanitamexicanfood.com

## 🔒 Issue
SSL certificate error: `NET::ERR_CERT_COMMON_NAME_INVALID`
The domain needs a valid SSL certificate from Let's Encrypt.

---

## ✅ Solution: Set Up SSL with Certbot

### Step 1: SSH into VPS
```bash
ssh root@77.243.85.8
```

### Step 2: Install Certbot (if not already installed)
```bash
# Check if certbot is installed
which certbot

# If not installed:
apt update
apt install certbot python3-certbot-nginx -y
```

### Step 3: Verify Nginx Configuration
```bash
# Check if Nginx config exists for lapoblanita
cat /etc/nginx/sites-available/lapoblanita
# OR
cat /etc/nginx/sites-enabled/lapoblanita
```

**Expected config should have:**
```nginx
server {
    listen 80;
    server_name lapoblanitamexicanfood.com www.lapoblanitamexicanfood.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 4: Verify DNS Points to VPS
```bash
# Check if domain resolves to VPS IP
nslookup lapoblanitamexicanfood.com

# Should show: 77.243.85.8 (or your VPS IP)
```

**If DNS is not pointing to VPS:**
- Go to your domain registrar (Hostinger)
- Update A record for `lapoblanitamexicanfood.com` to point to `77.243.85.8`
- Update A record for `www.lapoblanitamexicanfood.com` to point to `77.243.85.8`
- Wait for DNS propagation (can take up to 48 hours, usually 5-30 minutes)

### Step 5: Obtain SSL Certificate
```bash
# Request SSL certificate from Let's Encrypt
certbot --nginx -d lapoblanitamexicanfood.com -d www.lapoblanitamexicanfood.com

# Follow the prompts:
# - Enter email address (for renewal notices)
# - Agree to terms of service
# - Choose whether to redirect HTTP to HTTPS (recommend Yes)
```

**What Certbot does:**
1. Verifies domain ownership
2. Obtains certificate from Let's Encrypt
3. Automatically updates Nginx config to use SSL
4. Sets up auto-renewal

### Step 6: Verify SSL Certificate
```bash
# Test SSL configuration
certbot certificates

# Should show lapoblanitamexicanfood.com certificate

# Test Nginx config
nginx -t

# If OK, reload Nginx
systemctl reload nginx
```

### Step 7: Test in Browser
Visit: https://lapoblanitamexicanfood.com/order
- Should now show secure connection (green lock)
- No certificate errors

---

## 🔄 Auto-Renewal Setup

Certbot automatically sets up renewal, but verify:

```bash
# Check renewal timer
systemctl status certbot.timer

# Test renewal (dry run)
certbot renew --dry-run

# If timer is not active:
systemctl enable certbot.timer
systemctl start certbot.timer
```

---

## 🛠️ Troubleshooting

### Issue: "Domain not pointing to this server"
**Solution:**
- Verify DNS A record points to VPS IP
- Wait for DNS propagation
- Check: `nslookup lapoblanitamexicanfood.com`

### Issue: "Port 80 is not accessible"
**Solution:**
- Ensure Nginx is running: `systemctl status nginx`
- Check firewall allows port 80: `ufw allow 80`
- Verify port is open: `netstat -tuln | grep :80`

### Issue: "Certificate already exists for different domain"
**Solution:**
- Remove old certificate: `certbot delete --cert-name old-domain.com`
- Then request new certificate

### Issue: "Nginx config error after certbot"
**Solution:**
- Check config: `nginx -t`
- Review changes: `cat /etc/nginx/sites-available/lapoblanita`
- Restore from backup if needed

---

## 📋 Quick Command Reference

```bash
# Request certificate
certbot --nginx -d lapoblanitamexicanfood.com -d www.lapoblanitamexicanfood.com

# List certificates
certbot certificates

# Renew certificate manually
certbot renew

# Test renewal
certbot renew --dry-run

# Delete certificate
certbot delete --cert-name lapoblanitamexicanfood.com

# Check Nginx config
nginx -t

# Reload Nginx
systemctl reload nginx
```

---

## ✅ After SSL Setup

Once SSL is working:
1. ✅ Domain will show secure (green lock)
2. ✅ No certificate errors
3. ✅ HTTPS redirects automatically
4. ✅ Certificate auto-renews every 90 days

**Then you can:**
- Test ordering page: https://lapoblanitamexicanfood.com/order
- Test admin login: https://lapoblanitamexicanfood.com/admin/login
- Complete Stripe onboarding (requires HTTPS)

---

## 🎯 Next Steps After SSL

1. ✅ SSL certificate installed
2. ✅ Test domain works with HTTPS
3. ✅ Update CUSTOM_DOMAIN_MAP in .env (if not done)
4. ✅ Test admin login
5. ✅ Complete Stripe onboarding

---

**Need help?** Check Nginx logs: `tail -f /var/log/nginx/error.log`

