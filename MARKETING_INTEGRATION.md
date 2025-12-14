# Marketing Integration Guide

## Overview
Two options for creating marketing posts from weekend specials:

### Option A: Simple API (✅ IMPLEMENTED)
Quick API endpoint to generate marketing images for social media.

**Endpoint**: `/api/marketing/generate-post`

**Usage**:
```bash
# Get available products
curl https://lasreinas.alessacloud.com/api/marketing/generate-post?action=products

# Get templates
curl https://lasreinas.alessacloud.com/api/marketing/generate-post?action=templates

# Generate post
curl -X POST https://lasreinas.alessacloud.com/api/marketing/generate-post \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "abc-123",
    "templateStyle": "bold",
    "platform": "instagram"
  }'
```

**Response**:
```json
{
  "success": true,
  "imageUrl": "/api/marketing/render?...",
  "product": {
    "id": "abc-123",
    "name": "Pork Shoulder",
    "price": 12.99,
    "weekendPrice": 9.99
  },
  "metadata": {
    "platform": "instagram",
    "templateStyle": "bold",
    "dimensions": { "width": 1080, "height": 1080 }
  }
}
```

### Option B: Full Marketing Dashboard (📦 READY TO INTEGRATE)

**Project**: Alessa Social Marketing
- **Location**: `/Users/ernestoponce/alessa-social-marketing`
- **Domain**: `social.alessacloud.com`
- **Status**: Built, needs VPS deployment

**Features**:
- ✅ AI-powered post generation (GPT-4, Claude, Gemini)
- ✅ Canvas/Canva integration for design
- ✅ Facebook & Instagram API integration
- ✅ Scheduling with node-cron
- ✅ Product sync via Prisma ORM
- ✅ Template library
- ✅ Auto-posting to social media

## Integration Steps

### Step 1: Deploy Alessa Social Marketing to VPS

```bash
# On VPS
cd /var/www
git clone <repo-url> alessa-social-marketing
cd alessa-social-marketing

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with:
# - DATABASE_URL (same PostgreSQL as alessa-ordering)
# - OPENAI_API_KEY
# - FACEBOOK_ACCESS_TOKEN
# - INSTAGRAM_ACCESS_TOKEN
# - CANVA_API_KEY

# Run database migrations
npx prisma db push

# Build
npm run build

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
```

### Step 2: Configure Nginx

```nginx
# /etc/nginx/sites-available/social.alessacloud.com
server {
    server_name social.alessacloud.com;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site and get SSL
ln -s /etc/nginx/sites-available/social.alessacloud.com /etc/nginx/sites-enabled/
certbot --nginx -d social.alessacloud.com
systemctl restart nginx
```

### Step 3: Sync Weekend Specials

The marketing app can pull weekend specials via:

**API Endpoint**: `https://lasreinas.alessacloud.com/api/smp/grocery/weekend-specials`

**Marketing App Integration**:
```javascript
// In alessa-social-marketing/backend/routes/sync.js
router.get('/sync/weekend-specials', async (req, res) => {
  const response = await axios.get(
    'https://lasreinas.alessacloud.com/api/smp/grocery/weekend-specials'
  );

  const specials = response.data.weekendSpecials;

  // Save to marketing database
  for (const special of specials) {
    await prisma.product.upsert({
      where: { externalId: special.id },
      create: {
        name: special.name,
        description: special.description,
        price: special.regularPrice,
        salePrice: special.specialPrice,
        image: special.image,
        externalId: special.id,
        source: 'alessa-ordering',
      },
      update: {
        price: special.regularPrice,
        salePrice: special.specialPrice,
        image: special.image,
      },
    });
  }

  res.json({ synced: specials.length });
});
```

### Step 4: Create Automated Posts

```javascript
// In alessa-social-marketing/backend/jobs/auto-post.js
const cron = require('node-cron');

// Every Friday at 9 AM, generate weekend special posts
cron.schedule('0 9 * * 5', async () => {
  // Sync weekend specials
  await axios.get('http://localhost:5001/api/sync/weekend-specials');

  // Get all weekend specials
  const products = await prisma.product.findMany({
    where: { source: 'alessa-ordering', salePrice: { not: null } }
  });

  // Generate posts for each
  for (const product of products) {
    const post = await generatePost({
      productId: product.id,
      template: 'weekend-special',
      platform: 'instagram',
    });

    // Schedule for Saturday morning
    await schedulePost(post, 'Saturday 8:00 AM');
  }
});
```

## Current Setup

**Weekend Specials Flow**:
1. Admin marks items as weekend specials in Admin → Menu Editor → Grocery → Weekend Specials
2. Items appear in carousel on grocery page: `https://lasreinas.alessacloud.com/grocery`
3. SMP API provides data: `https://lasreinas.alessacloud.com/api/smp/grocery/weekend-specials`

**Marketing Options**:
- **Option A (Simple)**: Use `/api/marketing/generate-post` for manual post creation
- **Option B (Advanced)**: Deploy full marketing app for automated AI-powered posting

## Templates Available

1. **Default Weekend Special**
   - Yellow/orange gradient (matches grocery carousel)
   - Product image on left, details on right
   - Savings badge

2. **Bold Sale Banner**
   - Red background
   - Large "SAVE XX%" text
   - High contrast

3. **Minimal Clean**
   - White background
   - Product-focused
   - Simple pricing display

## Next Steps

To activate **Option B** (Full Marketing App):

1. Deploy to VPS (see Step 1 above)
2. Configure social media API keys
3. Set up sync endpoint (Step 3)
4. Enable automated posting (Step 4)
5. Access dashboard at `https://social.alessacloud.com`

**Estimated Time**: 30 minutes for deployment + API key setup

---

**Links**:
- Weekend Specials Admin: https://lasreinas.alessacloud.com/admin/menu-editor (Grocery tab)
- SMP API: https://lasreinas.alessacloud.com/api/smp/grocery/weekend-specials
- Marketing API: https://lasreinas.alessacloud.com/api/marketing/generate-post
