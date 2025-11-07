# ⚡ Quick Start - Deploy in 30 Minutes

**Last Updated**: November 7, 2025

---

## 🎯 What You Need

1. **VPS** with Ubuntu 20.04+ (DigitalOcean, Linode, AWS EC2, etc.)
2. **SSH access** to your VPS
3. **Domain name** (alessacloud.com) with DNS access
4. **Stripe account** (test mode is fine for now)

---

## 📝 Step-by-Step Deployment

### Step 1: DNS Configuration ⏱️ START NOW (longest wait)

**Go to your DNS provider** and add these records:

```
Type: A    Name: @           Value: YOUR_VPS_IP    TTL: 300
Type: A    Name: www         Value: YOUR_VPS_IP    TTL: 300
Type: A    Name: lapoblanita Value: YOUR_VPS_IP    TTL: 300
Type: A    Name: *           Value: YOUR_VPS_IP    TTL: 300
```

**Don't wait for DNS to propagate - continue with next steps!**

---

### Step 2: Verify VPS Access (2 minutes)

```bash
# Test SSH connection
ssh root@YOUR_VPS_IP

# If successful, you'll see a command prompt
# Exit for now
exit
```

---

### Step 3: Deploy Application (10-15 minutes)

**One command does everything**:

```bash
cd ~/alessa-ordering
./scripts/deploy-vps.sh root@YOUR_VPS_IP
```

This will:
- ✅ Install Node.js, PostgreSQL, Nginx, PM2
- ✅ Create database
- ✅ Clone code
- ✅ Install dependencies
- ✅ Build application
- ✅ Start services

**If you see any errors, save the output and we'll troubleshoot.**

---

### Step 4: Install SSL Certificate (5 minutes)

**Wait for DNS to propagate first** (use `dig alessacloud.com` to check)

Once DNS works:

```bash
ssh root@YOUR_VPS_IP

# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate (wildcardneeds manual DNS validation)
sudo certbot --nginx -d alessacloud.com -d www.alessacloud.com -d lapoblanita.alessacloud.com

# Follow the prompts
# Choose: Redirect HTTP to HTTPS
```

---

### Step 5: Configure Stripe Webhook (3 minutes)

1. **Go to**: https://dashboard.stripe.com/test/webhooks
2. **Click**: "Add endpoint"
3. **Endpoint URL**: `https://lapoblanita.alessacloud.com/api/payments/webhook`
4. **Select events**:
   - payment_intent.succeeded
   - payment_intent.payment_failed
   - account.updated
5. **Click**: "Add endpoint"
6. **Copy the signing secret** (starts with `whsec_`)
7. **Update on VPS**:
   ```bash
   ssh root@YOUR_VPS_IP
   nano /var/www/alessa-ordering/.env
   # Find STRIPE_WEBHOOK_SECRET and paste the new value
   # Ctrl+O to save, Ctrl+X to exit
   pm2 restart alessa-ordering
   ```

---

### Step 6: Test Everything (5 minutes)

**Open these URLs in your browser**:

1. **Homepage**: https://alessacloud.com
2. **Order page**: https://lapoblanita.alessacloud.com/order
3. **Admin**: https://lapoblanita.alessacloud.com/admin
4. **Super admin**: https://alessacloud.com/super-admin

**Login credentials** (from `.env.production`):
- Admin: `admin@lapoblanita.com` / `LYa++lSuolc0Yf5U+aa2AX/1i1VIpYaX`
- Super: `super@alessacloud.com` / `TA7FfVDGCH05eqh+sa2zOSGVwHkkcz1E`

**Test checkout**:
1. Add items to cart
2. Click "Proceed to Checkout"
3. Use test card: `4242 4242 4242 4242`
4. Complete payment
5. Verify order created

---

## ✅ Success Checklist

After deployment, verify:

- [ ] Site loads over HTTPS
- [ ] Menu displays correctly
- [ ] Cart works
- [ ] Test payment completes
- [ ] Admin login works
- [ ] Stripe Connect shows "Connected"
- [ ] PM2 process running: `ssh root@YOUR_VPS_IP 'pm2 status'`

---

## 🚨 Common Issues

### "502 Bad Gateway"
```bash
ssh root@YOUR_VPS_IP
pm2 logs alessa-ordering --lines 50
# Look for errors in the output
```

### "SSL Certificate Error"
```bash
# Make sure DNS has propagated first
dig alessacloud.com
# Then retry Certbot
```

### "Stripe Payment Fails"
- Check webhook secret is correct in `.env`
- Verify webhook endpoint shows "Success" in Stripe Dashboard

---

## 📊 Monitoring

```bash
# View live logs
ssh root@YOUR_VPS_IP 'pm2 logs alessa-ordering'

# Check status
ssh root@YOUR_VPS_IP 'pm2 status'

# Restart if needed
ssh root@YOUR_VPS_IP 'pm2 restart alessa-ordering'
```

---

## 🎉 You're Live!

Once all checks pass:
- ✅ Application is running on VPS
- ✅ HTTPS enabled
- ✅ Payments working
- ✅ Ready for testing

**Next**: Switch to live Stripe keys when ready for real payments

---

## 📞 Need Help?

**Check**:
1. [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Full details
2. PM2 logs: `pm2 logs alessa-ordering`
3. Nginx logs: `sudo tail -f /var/log/nginx/error.log`

**Common Commands**:
```bash
# Restart everything
pm2 restart alessa-ordering
sudo systemctl restart nginx

# Update code
cd /var/www/alessa-ordering
git pull origin main
npm install
npm run build
pm2 restart alessa-ordering
```

---

**Total Time**: ~30 minutes active work + DNS propagation time
