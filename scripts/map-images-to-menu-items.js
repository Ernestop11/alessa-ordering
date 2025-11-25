const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

// Mapping of menu item names to image file names
// Based on images downloaded from Wix site
// Update this to match your actual menu items
const IMAGE_MAPPING = {
  'Al Pastor Taco': 'tacos.jpg',
  'Carne Asada Taco': 'tacos.jpg',
  // Add more mappings as needed
};

async function main() {
  console.log('🗺️  Mapping images to menu items...\n');
  
  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'lasreinas' },
  });
  
  if (!tenant) {
    console.error('❌ Las Reinas tenant not found!');
    process.exit(1);
  }
  
  console.log(`✅ Found tenant: ${tenant.name}\n`);
  
  const menuItemsDir = path.join(__dirname, '../public/tenant/lasreinas/images/menu-items');
  const availableImages = fs.existsSync(menuItemsDir)
    ? fs.readdirSync(menuItemsDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'))
    : [];
  
  console.log(`📸 Available images (${availableImages.length}):`);
  availableImages.forEach(img => console.log(`   - ${img}`));
  console.log('');
  
  const updates = [];
  
  for (const [itemName, imageFileName] of Object.entries(IMAGE_MAPPING)) {
    const imagePath = `/tenant/lasreinas/images/menu-items/${imageFileName}`;
    const fullPath = path.join(__dirname, '../public', imagePath);
    
    // Check if image exists
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  Image not found: ${imageFileName}`);
      console.log(`   Looking for: ${fullPath}`);
      continue;
    }
    
    // Update menu item
    const result = await prisma.menuItem.updateMany({
      where: {
        tenantId: tenant.id,
        name: itemName,
      },
      data: {
        image: imagePath,
      },
    });
    
    if (result.count > 0) {
      console.log(`✅ Updated "${itemName}" → ${imagePath}`);
      updates.push({ itemName, imagePath });
    } else {
      console.log(`⚠️  Menu item not found: "${itemName}"`);
    }
  }
  
  console.log(`\n✨ Updated ${updates.length} menu items\n`);
  
  // Save mapping for reference
  const mappingPath = path.join(menuItemsDir, 'menu-item-mapping.json');
  if (fs.existsSync(menuItemsDir)) {
    fs.writeFileSync(mappingPath, JSON.stringify({
      tenant: tenant.name,
      slug: tenant.slug,
      updatedAt: new Date().toISOString(),
      mappings: updates,
    }, null, 2));
    console.log(`📝 Saved mapping to: ${path.relative(process.cwd(), mappingPath)}\n`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

