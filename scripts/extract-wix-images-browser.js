/**
 * BROWSER CONSOLE SCRIPT
 * 
 * Copy and paste this entire script into your browser console
 * while on www.lasreinascolusa.com
 * 
 * It will extract all image URLs and display them for copying
 */

(function() {
  console.log('🔍 Extracting all images from Wix site...\n');
  
  const images = [];
  const seenUrls = new Set();
  
  // Get all img elements
  document.querySelectorAll('img').forEach((img) => {
    let src = img.src || img.getAttribute('src') || img.getAttribute('data-src') || img.currentSrc;
    if (!src || src.includes('data:image') || seenUrls.has(src)) return;
    
    seenUrls.add(src);
    
    // Get context
    let context = '';
    let alt = img.alt || '';
    
    // Find nearby text
    let parent = img.parentElement;
    for (let i = 0; i < 5 && parent; i++) {
      const text = parent.textContent?.trim();
      if (text && text.length > 5 && text.length < 150) {
        context = text.split('\n')[0].trim();
        break;
      }
      parent = parent.parentElement;
    }
    
    const width = img.naturalWidth || img.width || 0;
    const height = img.naturalHeight || img.height || 0;
    
    images.push({
      url: src,
      alt,
      context,
      width,
      height,
    });
  });
  
  // Check background images
  document.querySelectorAll('[style*="background"]').forEach((elem) => {
    const style = window.getComputedStyle(elem);
    const bgImage = style.backgroundImage;
    if (bgImage && bgImage !== 'none') {
      const match = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
      if (match && match[1]) {
        const url = match[1];
        if (!seenUrls.has(url) && !url.includes('data:image')) {
          seenUrls.add(url);
          images.push({
            url,
            alt: '',
            context: elem.textContent?.trim().substring(0, 100) || '',
            width: elem.offsetWidth || 0,
            height: elem.offsetHeight || 0,
          });
        }
      }
    }
  });
  
  // Filter and sort by size (product images are usually larger)
  const productImages = images
    .filter(img => {
      // Exclude small icons
      if (img.width < 200 && img.height < 200) return false;
      
      // Exclude common non-product patterns
      const urlLower = img.url.toLowerCase();
      const exclude = ['logo', 'icon', 'favicon', 'button', 'arrow', 'close', 'menu'];
      return !exclude.some(pattern => urlLower.includes(pattern));
    })
    .sort((a, b) => (b.width * b.height) - (a.width * a.height));
  
  console.log(`✅ Found ${images.length} total images`);
  console.log(`📸 Found ${productImages.length} potential product images\n`);
  
  console.log('📋 Product Images (sorted by size):');
  console.log('─'.repeat(100));
  productImages.forEach((img, idx) => {
    console.log(`\n${idx + 1}. ${img.context || img.alt || 'No context'}`);
    console.log(`   ${img.width}x${img.height}px`);
    console.log(`   ${img.url}`);
  });
  console.log('─'.repeat(100));
  
  // Create JSON output for easy copying
  const jsonOutput = JSON.stringify(productImages.map(img => ({
    url: img.url,
    context: img.context || img.alt,
    dimensions: `${img.width}x${img.height}`,
  })), null, 2);
  
  console.log('\n📄 JSON Output (copy this):');
  console.log('─'.repeat(100));
  console.log(jsonOutput);
  console.log('─'.repeat(100));
  
  // Copy to clipboard if possible
  if (navigator.clipboard) {
    navigator.clipboard.writeText(jsonOutput).then(() => {
      console.log('\n✅ JSON copied to clipboard!');
    });
  }
  
  return productImages;
})();

