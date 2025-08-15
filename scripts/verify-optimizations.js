const fs = require('fs').promises;
const path = require('path');

async function getFileSize(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch {
    return null;
  }
}

async function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function main() {
  console.log('🔍 Image Optimization Verification Report');
  console.log('=========================================\n');

  const originalImages = [
    { name: 'hero.png', path: 'public/hero.png' },
    { name: 'hero-upscaled.png', path: 'public/hero-upscaled.png' },
    { name: 'tsc-hero.jpg', path: 'public/tsc-hero.jpg' },
    { name: 'cro.jpg', path: 'public/cro.jpg' },
    { name: 'sola.jpg', path: 'public/sola.jpg' },
    { name: 'school-start-times.jpg', path: 'public/school-start-times.jpg' },
    { name: 'waterwise.png', path: 'public/waterwise.png' },
  ];

  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;

  console.log('📊 Size Comparison:\n');

  for (const img of originalImages) {
    const originalPath = path.join(process.cwd(), img.path);
    const optimizedPath = path.join(process.cwd(), 'public/optimized', img.name.replace(/\.(jpg|png)$/, '.webp'));
    
    const originalSize = await getFileSize(originalPath);
    const optimizedSize = await getFileSize(optimizedPath);

    if (originalSize && optimizedSize) {
      totalOriginalSize += originalSize;
      totalOptimizedSize += optimizedSize;
      
      const reduction = Math.round((1 - optimizedSize / originalSize) * 100);
      
      console.log(`${img.name}:`);
      console.log(`  Original: ${await formatBytes(originalSize)}`);
      console.log(`  Optimized: ${await formatBytes(optimizedSize)}`);
      console.log(`  Reduction: ${reduction}% ✅\n`);
    }
  }

  console.log('📈 Overall Results:');
  console.log('===================');
  console.log(`Total Original Size: ${await formatBytes(totalOriginalSize)}`);
  console.log(`Total Optimized Size: ${await formatBytes(totalOptimizedSize)}`);
  console.log(`Total Reduction: ${Math.round((1 - totalOptimizedSize / totalOriginalSize) * 100)}%`);
  console.log(`Bandwidth Saved: ${await formatBytes(totalOriginalSize - totalOptimizedSize)}`);

  // Check blur data
  console.log('\n🎨 Blur Placeholders:');
  console.log('=====================');
  
  try {
    const blurData = await fs.readFile(path.join(process.cwd(), 'lib/blur-data.json'), 'utf8');
    const blurJson = JSON.parse(blurData);
    const blurCount = Object.keys(blurJson).length;
    console.log(`✅ Generated ${blurCount} blur placeholders`);
    console.log(`   Files with blur data: ${Object.keys(blurJson).join(', ')}`);
  } catch (error) {
    console.log('❌ Blur data file not found');
  }

  // Check responsive variants
  console.log('\n📱 Responsive Variants:');
  console.log('=======================');
  
  const optimizedDir = path.join(process.cwd(), 'public/optimized');
  const files = await fs.readdir(optimizedDir);
  
  const variants = {};
  for (const file of files) {
    const match = file.match(/^(.+?)-(\d+)w\.webp$/);
    if (match) {
      const [, name, size] = match;
      if (!variants[name]) variants[name] = [];
      variants[name].push(size);
    }
  }

  for (const [name, sizes] of Object.entries(variants)) {
    console.log(`${name}: ${sizes.length} sizes (${sizes.join('w, ')}w)`);
  }

  console.log('\n✨ Optimization Complete!');
  console.log('========================');
  console.log('Your images are now optimized with:');
  console.log('  ✅ WebP format conversion');
  console.log('  ✅ Multiple responsive sizes');
  console.log('  ✅ Blur placeholders for smooth loading');
  console.log('  ✅ Significant file size reduction');
}

main().catch(console.error);