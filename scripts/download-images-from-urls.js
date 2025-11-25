const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const OUTPUT_DIR = path.join(__dirname, '../public/tenant/lasreinas/images/menu-items');

// Image URLs extracted from Wix site
// Paste the JSON output from the browser console script here
const IMAGE_URLS = [
  // Example format:
  // { url: 'https://static.wixstatic.com/media/...', context: 'Carnitas Plate', dimensions: '800x600' },
  // Add your URLs here
];

function sanitizeFileName(name) {
  if (!name) return 'image';
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
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
        if ([301, 302, 307, 308].includes(response.statusCode)) {
          file.close();
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          return downloadImage(response.headers.location, outputPath)
            .then(resolve)
            .catch(reject);
        }
        
        if (response.statusCode !== 200) {
          file.close();
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          reject(new Error(`HTTP ${response.statusCode}`));
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
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        reject(err);
      });
      
      request.setTimeout(30000, () => {
        request.destroy();
        file.close();
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        reject(new Error('Timeout'));
      });
    } catch (error) {
      reject(error);
    }
  });
}

async function main() {
  if (IMAGE_URLS.length === 0) {
    console.log('❌ No image URLs provided!');
    console.log('\n📋 Instructions:');
    console.log('1. Open www.lasreinascolusa.com in your browser');
    console.log('2. Open browser console (F12)');
    console.log('3. Run the script from: scripts/extract-wix-images-browser.js');
    console.log('4. Copy the JSON output');
    console.log('5. Paste it into IMAGE_URLS array in this file');
    console.log('6. Run this script again\n');
    return;
  }
  
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  console.log(`📥 Downloading ${IMAGE_URLS.length} images...\n`);
  
  const results = [];
  
  for (const imgData of IMAGE_URLS) {
    const context = imgData.context || imgData.alt || 'image';
    const fileName = `${sanitizeFileName(context)}.jpg`;
    const outputPath = path.join(OUTPUT_DIR, fileName);
    
    // Skip if exists
    if (fs.existsSync(outputPath)) {
      console.log(`⏭️  Skipping ${fileName} (exists)`);
      results.push({
        fileName,
        relativePath: `/tenant/lasreinas/images/menu-items/${fileName}`,
        status: 'exists',
      });
      continue;
    }
    
    try {
      await downloadImage(imgData.url, outputPath);
      const relativePath = `/tenant/lasreinas/images/menu-items/${fileName}`;
      results.push({
        fileName,
        relativePath,
        context,
        originalUrl: imgData.url,
        status: 'downloaded',
      });
      console.log(`✅ Downloaded: ${fileName}`);
    } catch (error) {
      console.log(`❌ Failed ${fileName}: ${error.message}`);
      results.push({
        fileName,
        context,
        status: 'failed',
        error: error.message,
      });
    }
  }
  
  // Save results
  const resultsPath = path.join(OUTPUT_DIR, 'download-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  
  console.log(`\n✨ Done! Results saved to: ${resultsPath}\n`);
  
  const downloaded = results.filter(r => r.status === 'downloaded').length;
  console.log(`📊 Summary: ${downloaded} downloaded, ${results.length - downloaded} skipped/failed\n`);
}

main().catch(console.error);

