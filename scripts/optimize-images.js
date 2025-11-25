const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '../public/tenant/lasreinas/images/menu-items');

async function optimizeImages() {
  console.log('🖼️  Optimizing downloaded images...\n');
  
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error('❌ Images directory not found!');
    return;
  }
  
  const files = fs.readdirSync(IMAGES_DIR).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
  
  if (files.length === 0) {
    console.log('⚠️  No images found to optimize');
    return;
  }
  
  console.log(`Found ${files.length} images to optimize\n`);
  
  for (const file of files) {
    const inputPath = path.join(IMAGES_DIR, file);
    const stats = fs.statSync(inputPath);
    const originalSize = stats.size;
    
    // Skip if already small
    if (originalSize < 200000) { // Less than 200KB
      console.log(`⏭️  Skipping ${file} (already small: ${(originalSize / 1024).toFixed(1)}KB)`);
      continue;
    }
    
    try {
      const outputPath = path.join(IMAGES_DIR, `optimized-${file}`);
      
      // Optimize: resize to max 800x800, compress JPEG
      await sharp(inputPath)
        .resize(800, 800, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({
          quality: 85,
          mozjpeg: true,
        })
        .toFile(outputPath);
      
      const newStats = fs.statSync(outputPath);
      const newSize = newStats.size;
      const savings = ((1 - newSize / originalSize) * 100).toFixed(1);
      
      console.log(`✅ Optimized ${file}`);
      console.log(`   ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(newSize / 1024).toFixed(1)}KB (${savings}% smaller)`);
      
      // Replace original with optimized
      fs.renameSync(outputPath, inputPath);
      
    } catch (error) {
      console.log(`❌ Failed to optimize ${file}: ${error.message}`);
    }
  }
  
  console.log('\n✨ Optimization complete!\n');
}

// Check if sharp is available
try {
  require.resolve('sharp');
  optimizeImages().catch(console.error);
} catch (e) {
  console.log('⚠️  Sharp not installed. Installing...\n');
  console.log('Run: npm install --save-dev sharp');
  console.log('Then run this script again.\n');
  process.exit(0);
}

