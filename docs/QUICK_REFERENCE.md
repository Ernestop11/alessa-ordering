# Cache-Busting Quick Reference

## ✅ Verify It's Working

```bash
# Run end-to-end test
cd /var/www/alessa-ordering
node scripts/testImageCacheEndToEnd.mjs
```

**Expected output:**
```
✅ Timestamp changed: 1762575230920 → 1762575681890  
✅ URL changed: YES  
🎉 SUCCESS: Cache-busting will force browser to fetch new image!
```

---

## 🔍 Check Image URLs

```bash
# View an image URL with cache-buster
sudo -u postgres psql -d alessa_ordering -c \
  "SELECT name, image, 
   CONCAT(image, '?t=', EXTRACT(EPOCH FROM \"updatedAt\") * 1000) AS cache_busted_url 
   FROM \"MenuItem\" 
   WHERE image LIKE '/uploads/%' 
   LIMIT 3;"
```

---

## 🔧 Troubleshooting

### Images not updating?

```bash
# 1. Check PM2 is running
pm2 list

# 2. Restart if needed
pm2 restart alessa-ordering

# 3. Hard refresh browser
# Chrome/Firefox: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

### Verify cache settings:

```bash
# Check cache headers
curl -I http://lapoblanitamexicanfood.com:4000/order | grep -i cache
```

Should show:
- `cache-control: private, no-cache, no-store, max-age=0, must-revalidate`

---

## 📚 Full Documentation

See [CACHE_BUSTING_SUMMARY.md](./CACHE_BUSTING_SUMMARY.md) for complete implementation details.
