const puppeteer = require('puppeteer');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const WIX_SITE = 'https://www.lasreinascolusa.com/online-ordering';
const OUTPUT_DIR = path.join(__dirname, '../public/tenant/lasreinas/images/menu-items');

// Menu items we're looking for (exact names from seed)
const MENU_ITEMS = [
  'Carnitas Plate',
  'Birria Tacos',
  'Carne Asada (1 lb)',
  'Homemade Salsa Roja (16oz)',
];

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`📁 Created directory: ${OUTPUT_DIR}\n`);
}

function sanitizeFileName(name) {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, '') // Remove parenthetical text
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function downloadImage(url, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol === 'https:' ? https : http;
      
      const file = fs.createWriteStream(outputPath);
      
      const request = protocol.get(url, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
          file.close();
          fs.unlinkSync(outputPath);
          return downloadImage(response.headers.location, outputPath)
            .then(resolve)
            .catch(reject);
        }
        
        if (response.statusCode !== 200) {
          file.close();
          fs.unlinkSync(outputPath);
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          resolve(outputPath);
        });
      });
      
      request.on('error', (err) => {
        file.close();
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
        reject(err);
      });
      
      request.setTimeout(30000, () => {
        request.destroy();
        file.close();
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
        reject(new Error('Request timeout'));
      });
    } catch (error) {
      reject(error);
    }
  });
}

async function scrapeWixImages() {
  console.log('🚀 Starting Wix image scraper...\n');
  console.log(`📍 Target site: ${WIX_SITE}\n`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    
    // Set a realistic viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Set user agent to avoid bot detection
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('📡 Loading Wix ordering page...');
    await page.goto(WIX_SITE, { 
      waitUntil: 'networkidle2',
      timeout: 60000 
    });
    
    // Wait for ordering interface to load
    console.log('⏳ Waiting for menu items to load...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Try to click any menu section tabs to trigger loading
    try {
      const menuTabs = await page.$$('button, [role="tab"], .menu-category, a[href*="#"]');
      if (menuTabs.length > 0) {
        console.log(`📑 Found ${menuTabs.length} potential menu elements, exploring...`);
        // Click through a few sections to load their images
        for (let i = 0; i < Math.min(5, menuTabs.length); i++) {
          try {
            await menuTabs[i].click();
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (e) {
            // Ignore click errors
          }
        }
      }
    } catch (e) {
      console.log('⚠️  Could not interact with menu tabs, continuing...');
    }
    
    // Scroll page to trigger lazy loading
    console.log('📜 Scrolling page to load dynamic content...');
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
      
      // Scroll back to top
      window.scrollTo(0, 0);
    });
    
    // Wait for images to load after scrolling
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🔍 Extracting images...\n');
    
    // Extract all images with context - optimized for Wix ordering page
    const images = await page.evaluate(() => {
      const imageData = [];
      const seenUrls = new Set();
      
      // Function to get product name from nearby elements
      function getProductContext(img) {
        // Check for common product card structures
        const card = img.closest('[class*="product"], [class*="item"], [class*="menu"], [class*="card"]');
        if (card) {
          // Look for price, title, or name elements
          const title = card.querySelector('h1, h2, h3, h4, [class*="title"], [class*="name"], [class*="product-name"]');
          if (title) {
            const text = title.textContent?.trim();
            if (text && text.length > 2 && text.length < 100) {
              return text;
            }
          }
          
          // Get all text and find the most relevant line
          const allText = card.textContent?.trim();
          if (allText) {
            const lines = allText.split('\n').map(l => l.trim()).filter(l => 
              l.length > 3 && 
              l.length < 80 && 
              !l.match(/^\$[\d.]+$/) && // Not just a price
              !l.match(/^[\d]+$/) && // Not just a number
              !l.includes('Add to cart') &&
              !l.includes('Order') &&
              !l.includes('Pickup')
            );
            if (lines.length > 0) {
              return lines[0];
            }
          }
        }
        
        // Fallback: check parent elements for text
        let parent = img.parentElement;
        for (let i = 0; i < 5 && parent; i++) {
          const text = parent.textContent?.trim();
          if (text && text.length > 5 && text.length < 150) {
            const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            if (lines.length > 0 && !lines[0].match(/^\$[\d.]+$/)) {
              return lines[0];
            }
          }
          parent = parent.parentElement;
        }
        
        return '';
      }
      
      // Get all img elements
      const imgElements = Array.from(document.querySelectorAll('img'));
      
      imgElements.forEach((img) => {
        // Try multiple sources for image URL
        let src = img.src || 
                  img.getAttribute('src') || 
                  img.getAttribute('data-src') || 
                  img.getAttribute('data-lazy-src') ||
                  img.getAttribute('data-image') ||
                  img.currentSrc;
        
        // Skip data URIs, very small images, and duplicates
        if (!src || 
            src.includes('data:image') || 
            src.includes('1x1') ||
            src.includes('transparent') ||
            seenUrls.has(src)) {
          return;
        }
        
        // Get dimensions
        const width = img.naturalWidth || img.width || img.offsetWidth || 0;
        const height = img.naturalHeight || img.height || img.offsetHeight || 0;
        
        // Skip very small images (likely icons)
        if (width < 100 && height < 100) {
          return;
        }
        
        seenUrls.add(src);
        
        const alt = img.alt || img.getAttribute('aria-label') || '';
        const context = getProductContext(img) || alt;
        
        imageData.push({
          src,
          alt,
          context,
          width,
          height,
        });
      });
      
      // Check for background images in product cards
      const productCards = document.querySelectorAll('[class*="product"], [class*="item"], [class*="menu-item"]');
      productCards.forEach((card) => {
        const style = window.getComputedStyle(card);
        const bgImage = style.backgroundImage;
        if (bgImage && bgImage !== 'none') {
          const urlMatch = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
          if (urlMatch && urlMatch[1]) {
            const src = urlMatch[1];
            if (!seenUrls.has(src) && !src.includes('data:image')) {
              seenUrls.add(src);
              
              const title = card.querySelector('h1, h2, h3, h4, [class*="title"], [class*="name"]');
              const context = title?.textContent?.trim() || card.textContent?.trim().split('\n')[0] || '';
              
              const width = card.offsetWidth || 0;
              const height = card.offsetHeight || 0;
              
              if (width >= 200 || height >= 200) {
                imageData.push({
                  src,
                  alt: '',
                  context: context.substring(0, 100),
                  width,
                  height,
                });
              }
            }
          }
        }
      });
      
      return imageData;
    });
    
    console.log(`✅ Found ${images.length} images on the page\n`);
    
    // Filter for product images - we want both category headers AND individual product images
    const productImages = images.filter(img => {
      // Filter by size - product images are usually at least 200px
      const minSize = 200;
      if (img.width < minSize && img.height < minSize) return false;
      
      // Filter out common non-product images
      const excludePatterns = [
        'logo', 'icon', 'favicon', 'button', 'arrow', 'close', 'menu-icon',
        'background', 'bg-', 'hero', 'header', 'footer', 'social', 'avatar',
        'profile', 'user', 'cart-icon', 'search-icon'
      ];
      
      const srcLower = img.src.toLowerCase();
      const altLower = img.alt.toLowerCase();
      const contextLower = (img.context || '').toLowerCase();
      
      if (excludePatterns.some(pattern => 
        srcLower.includes(pattern) || altLower.includes(pattern) || contextLower.includes(pattern)
      )) {
        return false;
      }
      
      // Include category headers (they're useful too) AND individual products
      return true;
    });
    
    // Sort by size - larger images are likely individual products
    productImages.sort((a, b) => (b.width * b.height) - (a.width * a.height));
    
    console.log(`📸 Found ${productImages.length} potential product images\n`);
    
    // Display found images for user to review
    console.log('🔎 Image Analysis:');
    console.log('─'.repeat(80));
    productImages.slice(0, 20).forEach((img, idx) => {
      console.log(`\n${idx + 1}. ${img.context || img.alt || 'No context'}`);
      console.log(`   Size: ${img.width}x${img.height}`);
      console.log(`   URL: ${img.src.substring(0, 80)}${img.src.length > 80 ? '...' : ''}`);
    });
    console.log('─'.repeat(80));
    console.log('\n');
    
    // Save all potential product images with their metadata
    const imageMetadata = productImages.map(img => ({
      url: img.src,
      context: img.context,
      alt: img.alt,
      dimensions: `${img.width}x${img.height}`,
    }));
    
    const metadataPath = path.join(OUTPUT_DIR, 'image-metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(imageMetadata, null, 2));
    console.log(`📝 Saved image metadata to: ${path.relative(process.cwd(), metadataPath)}\n`);
    
    // Now try to download all product images
    console.log('⬇️  Downloading images...\n');
    const downloadedImages = [];
    
    for (let i = 0; i < productImages.length; i++) {
      const img = productImages[i];
      const contextName = img.context || img.alt || `image-${i + 1}`;
      const fileName = `${sanitizeFileName(contextName)}.jpg`;
      const outputPath = path.join(OUTPUT_DIR, fileName);
      
      // Skip if already exists
      if (fs.existsSync(outputPath)) {
        console.log(`⏭️  Skipping ${fileName} (already exists)`);
        continue;
      }
      
      try {
        await downloadImage(img.src, outputPath);
        const relativePath = `/tenant/lasreinas/images/menu-items/${fileName}`;
        downloadedImages.push({
          originalUrl: img.src,
          fileName,
          relativePath,
          context: contextName,
        });
        console.log(`✅ Downloaded: ${fileName}`);
      } catch (error) {
        console.log(`❌ Failed to download ${fileName}: ${error.message}`);
      }
    }
    
    console.log(`\n✨ Download complete! Downloaded ${downloadedImages.length} images\n`);
    
    // Save download mapping
    const mappingPath = path.join(OUTPUT_DIR, 'download-mapping.json');
    fs.writeFileSync(mappingPath, JSON.stringify(downloadedImages, null, 2));
    console.log(`📝 Saved download mapping to: ${path.relative(process.cwd(), mappingPath)}\n`);
    
    return downloadedImages;
    
  } catch (error) {
    console.error('❌ Error scraping Wix site:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the scraper
scrapeWixImages()
  .then(() => {
    console.log('🎉 Scraping completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Review the downloaded images in:', OUTPUT_DIR);
    console.log('2. Check image-metadata.json for all found images');
    console.log('3. Map images to menu items manually or run the mapping script');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
