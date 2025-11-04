# Deployment Configuration

## Database Setup

### Option 1: MongoDB Atlas (Recommended for starting)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (choose the region closest to your users)
4. Set up database access:
   - Create a database user
   - Allow network access from your VPS IP
5. Get your connection string

### Option 2: Self-hosted MongoDB
1. SSH into your VPS
2. Install MongoDB:
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
```

3. Enable and start MongoDB:
```bash
sudo systemctl enable mongod
sudo systemctl start mongod
```

4. Secure your MongoDB:
```bash
sudo nano /etc/mongod.conf
# Add/modify these lines:
security:
  authorization: enabled
```

5. Create admin user:
```bash
mongosh
use admin
db.createUser({
  user: "adminUser",
  pwd: "your_secure_password",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
})
```

## Hostinger Deployment

1. In your Hostinger control panel:
   - Set up a new Node.js hosting
   - Configure your domain
   - Set up SSL certificate

2. Environment variables to set in Hostinger:
```
DATABASE_URL=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/alessa-ordering
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key
NODE_ENV=production
```

3. Deploy command:
```bash
npm run build && npm start
```

## Backup Strategy

### For MongoDB Atlas:
- Automatic backups are included
- Set up additional backup alerts in Atlas

### For Self-hosted MongoDB:
1. Create backup script (/root/backup-mongo.sh):
```bash
#!/bin/bash
DATE=$(date +"%Y%m%d")
BACKUP_DIR="/var/backups/mongodb"
mkdir -p $BACKUP_DIR
mongodump --uri="mongodb://adminUser:password@localhost:27017/alessa-ordering" --out="$BACKUP_DIR/$DATE"
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +
```

2. Set up cron job:
```bash
0 0 * * * /root/backup-mongo.sh
```

## Monitoring

1. Set up basic monitoring:
```bash
# Install monitoring tools
npm install --save-dev @next/bundle-analyzer
```

2. Add to your package.json:
```json
{
  "scripts": {
    "analyze": "ANALYZE=true next build"
  }
}
```

## CI/CD Setup (Optional)

1. Create Github Actions workflow:
```yaml
name: Deploy to Hostinger
on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - name: Deploy to Hostinger
        uses: easingthemes/ssh-deploy@v2
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          REMOTE_HOST: ${{ secrets.REMOTE_HOST }}
          REMOTE_USER: ${{ secrets.REMOTE_USER }}
          TARGET: /path/to/your/app
```

## Progressive Web App (PWA)

- App icons live under `public/icons/` (`alessa-cloud-icon-192.png`, `alessa-cloud-icon-512.png`). Replace these placeholders with branded assets (192×192 and 512×512 PNG) for production.
- The PWA manifest is generated from `app/manifest.ts`. Adjust `theme_color`, `background_color`, and description as needed per tenant or deployment.
- `app/layout.tsx` references the manifest and icons. For full offline support, add a service worker (e.g., via `next-pwa`) once caching requirements are defined.

## Predeployment Checklist

- Run `npx prisma generate && npx prisma db push` to apply schema updates.
- Seed launch tenants when needed: `npm run db:seed`.
- Confirm admin tabs (Orders, Customers, Menu Sections, Menu, Settings) render correctly per tenant slug.
- Review integration logs via MongoDB `IntegrationLog` collection when testing Apple Pay or delivery quotes.
- Update environment variables for Apple Pay and DoorDash Drive credentials before going live.

### Quick Deploy


```bash
./scripts/deploy.sh /var/www/alessa-ordering
```

The script syncs the workspace (excluding node_modules/.next), installs production dependencies, builds the Next.js app, and reloads the PM2 process defined in `ecosystem.config.js`.
