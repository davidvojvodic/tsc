const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const { getPlaiceholder } = require('plaiceholder');

const INPUT_DIR = path.join(process.cwd(), 'public');
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'optimized');
const BLUR_DATA_FILE = path.join(process.cwd(), 'lib', 'blur-data.json');

const IMAGE_SIZES = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];

const IMAGES_TO_OPTIMIZE = [
  'hero.png',
  'hero-upscaled.png', 
  'tsc-hero.jpg',
  'cro.jpg',
  'sola.jpg',
  'school-start-times.jpg',
  'waterwise.png'
];

async function ensureDirectoryExists(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function generateBlurDataURL(imagePath) {
  try {
    const file = await fs.readFile(imagePath);
    const { base64 } = await getPlaiceholder(file);
    return base64;
  } catch (error) {
    console.error(`Error generating blur for ${imagePath}:`, error);
    return null;
  }
}

async function optimizeImage(filename) {
  const inputPath = path.join(INPUT_DIR, filename);
  const nameWithoutExt = path.parse(filename).name;
  
  console.log(`\nOptimizing ${filename}...`);
  
  try {
    await fs.access(inputPath);
  } catch {
    console.log(`Skipping ${filename} - file not found`);
    return null;
  }

  const metadata = await sharp(inputPath).metadata();
  console.log(`Original: ${metadata.width}x${metadata.height}, ${metadata.format}`);

  const results = {
    original: filename,
    webp: {},
    blur: null,
    sizes: []
  };

  // Generate blur placeholder
  console.log('Generating blur placeholder...');
  results.blur = await generateBlurDataURL(inputPath);

  // Generate WebP versions at different sizes
  for (const size of IMAGE_SIZES) {
    if (size > metadata.width) continue;

    const outputFilename = `${nameWithoutExt}-${size}w.webp`;
    const outputPath = path.join(OUTPUT_DIR, outputFilename);

    try {
      const info = await sharp(inputPath)
        .resize(size, null, {
          withoutEnlargement: true,
          fit: 'inside'
        })
        .webp({ quality: 85 })
        .toFile(outputPath);

      results.sizes.push({
        width: size,
        filename: `/optimized/${outputFilename}`,
        size: info.size
      });

      console.log(`✓ Generated ${size}w WebP (${Math.round(info.size / 1024)}KB)`);
    } catch (error) {
      console.error(`Error generating ${size}w version:`, error);
    }
  }

  // Generate main WebP version (full size)
  const mainWebPFilename = `${nameWithoutExt}.webp`;
  const mainWebPPath = path.join(OUTPUT_DIR, mainWebPFilename);
  
  try {
    const info = await sharp(inputPath)
      .webp({ quality: 85 })
      .toFile(mainWebPPath);

    results.webp = {
      filename: `/optimized/${mainWebPFilename}`,
      size: info.size,
      width: metadata.width,
      height: metadata.height
    };

    console.log(`✓ Generated full-size WebP (${Math.round(info.size / 1024)}KB)`);
  } catch (error) {
    console.error(`Error generating full-size WebP:`, error);
  }

  return results;
}

async function main() {
  console.log('Starting image optimization...\n');

  await ensureDirectoryExists(OUTPUT_DIR);

  const blurData = {};
  const optimizationResults = [];

  for (const image of IMAGES_TO_OPTIMIZE) {
    const result = await optimizeImage(image);
    if (result) {
      optimizationResults.push(result);
      if (result.blur) {
        const nameWithoutExt = path.parse(image).name;
        blurData[nameWithoutExt] = result.blur;
      }
    }
  }

  // Save blur data to JSON file
  await fs.writeFile(
    BLUR_DATA_FILE,
    JSON.stringify(blurData, null, 2)
  );

  console.log('\n✅ Optimization complete!');
  console.log(`Blur data saved to: ${BLUR_DATA_FILE}`);
  console.log(`Optimized images saved to: ${OUTPUT_DIR}`);

  // Generate summary report
  console.log('\n📊 Optimization Summary:');
  console.log('========================');
  
  for (const result of optimizationResults) {
    console.log(`\n${result.original}:`);
    if (result.webp.filename) {
      const originalPath = path.join(INPUT_DIR, result.original);
      const originalStats = await fs.stat(originalPath);
      const savings = Math.round((1 - result.webp.size / originalStats.size) * 100);
      console.log(`  WebP: ${Math.round(result.webp.size / 1024)}KB (${savings}% smaller)`);
    }
    console.log(`  Responsive sizes: ${result.sizes.length} variants`);
    console.log(`  Blur placeholder: ${result.blur ? '✓' : '✗'}`);
  }

  // Create image configuration file for Next.js
  const imageConfig = optimizationResults.reduce((acc, result) => {
    const name = path.parse(result.original).name;
    acc[name] = {
      src: result.webp.filename || `/${result.original}`,
      blur: result.blur,
      width: result.webp.width,
      height: result.webp.height,
      sizes: result.sizes
    };
    return acc;
  }, {});

  await fs.writeFile(
    path.join(process.cwd(), 'lib', 'image-config.json'),
    JSON.stringify(imageConfig, null, 2)
  );

  console.log('\n✅ Image configuration saved to lib/image-config.json');
}

main().catch(console.error);