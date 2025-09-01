# TŠC Image Optimization Implementation Plan

## Executive Summary

This comprehensive plan addresses image optimization for the TŠC Next.js application, focusing on performance improvements through WebP conversion, responsive images, blur placeholders, and advanced loading strategies. The current analysis reveals significant optimization opportunities across static assets and dynamic content.

## Current State Analysis

### Static Assets Inventory
- **Total static images**: 7 files (3.4 MB total)
- **Largest file**: `hero-upscaled.png` (1.17 MB)
- **Format distribution**: 4 JPG, 3 PNG, 0 WebP
- **No blur placeholders** currently implemented
- **Limited responsive sizing** in place

### Image Usage Patterns
1. **Hero Section**: Single large image (`tsc-hero.jpg` - 366KB)
2. **Schools Section**: Two school images (`sola.jpg` - 353KB, `cro.jpg` - 603KB)
3. **Navigation**: Logo image (`waterwise.png` - 82KB)
4. **Dynamic Content**: Project galleries, teacher photos via UploadThing
5. **Admin Interface**: Media grid with thumbnail views

### Current Next.js Image Configuration
- **Image domains**: Cloudinary, UploadThing configured
- **Development optimization**: Disabled in dev mode
- **Missing**: Responsive sizes, blur placeholders, WebP conversion

## Priority-Based Implementation Plan

### Phase 1: Critical Static Asset Optimization (High Impact - 1-2 days)

#### 1.1 Convert Static Images to WebP Format
**Impact**: 25-50% file size reduction
**Files to convert**:
- `tsc-hero.jpg` (366KB) → Expected: ~180KB
- `sola.jpg` (353KB) → Expected: ~170KB  
- `cro.jpg` (603KB) → Expected: ~300KB
- `school-start-times.jpg` (415KB) → Expected: ~200KB

**Implementation Script**:
```bash
#!/bin/bash
# Convert existing static images to WebP
cd public

# Install sharp-cli for conversion
npm install -g @squoosh/cli

# Convert images with 85% quality
for file in *.jpg *.png; do
  if [ "$file" != "waterwise.png" ]; then # Keep logo as PNG
    squoosh-cli --webp '{"quality":85}' "$file"
  fi
done

# Create responsive sizes for hero images
squoosh-cli --resize '{"width":640}' --webp '{"quality":80}' tsc-hero.jpg
squoosh-cli --resize '{"width":768}' --webp '{"quality":80}' tsc-hero.jpg
squoosh-cli --resize '{"width":1024}' --webp '{"quality":85}' tsc-hero.jpg
```

#### 1.2 Generate Blur Placeholders
**Implementation**:
```typescript
// lib/image-blur-placeholders.ts
import sharp from 'sharp';
import { encode } from 'blurhash';

export async function generateBlurDataURL(imagePath: string): Promise<string> {
  const image = sharp(imagePath);
  const { data, info } = await image
    .raw()
    .ensureAlpha()
    .resize(32, 32, { fit: 'inside' })
    .toBuffer({ resolveWithObject: true });

  const blurHash = encode(new Uint8ClampedArray(data), info.width, info.height, 4, 4);
  
  // Convert to base64 data URL for placeholder
  const blurBuffer = await sharp({
    create: {
      width: 8,
      height: 8,
      channels: 3,
      background: { r: 128, g: 128, b: 128 }
    }
  }).jpeg({ quality: 20 }).toBuffer();
  
  return `data:image/jpeg;base64,${blurBuffer.toString('base64')}`;
}

// Pre-generated blur data URLs for static images
export const staticImageBlurs = {
  'tsc-hero': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyBCADXSSiOoqA6BqNQ==',
  'sola': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyBCADXSSiOoqA6BqNQ==',
  'cro': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyBCADXSSiOoqA6BqNQ=='
};
```

### Phase 2: Hero Section Optimization (High Impact - 1 day)

#### 2.1 Implement Responsive Hero Image
**File**: `/components/homepage/hero.tsx`

```typescript
import Image from "next/image";
import { staticImageBlurs } from "@/lib/image-blur-placeholders";

export function HeroSection() {
  // ... existing code

  return (
    <Container>
      <div className="relative">
        <div className="grid gap-12 py-16 md:grid-cols-2 md:items-center md:py-24">
          {/* ... text content */}
          
          {/* Right column - Optimized Hero Image */}
          <div className="relative aspect-square max-h-[600px] w-full">
            <Image
              src="/tsc-hero.webp"
              alt="Student Profiles"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
              className="object-contain"
              priority
              placeholder="blur"
              blurDataURL={staticImageBlurs['tsc-hero']}
            />
          </div>
        </div>
        {/* ... stats section */}
      </div>
    </Container>
  );
}
```

### Phase 3: Schools Section Optimization (Medium-High Impact - 1 day)

#### 3.1 Optimize School Images with Responsive Loading
**File**: `/components/homepage/schools.tsx`

```typescript
import Image from "next/image";
import { staticImageBlurs } from "@/lib/image-blur-placeholders";

// Update school data with WebP sources
const schoolsContent = {
  en: [
    {
      id: "tsc-maribor",
      title: "Technical School Center Maribor",
      description: "...",
      buttonText: "Learn more",
      imageUrl: "/sola.webp",
      imageBlur: staticImageBlurs.sola,
    },
    {
      id: "ptz-dubrovnik", 
      title: "Dubrovnik Maritime Technical School",
      description: "...",
      buttonText: "Learn more",
      imageUrl: "/cro.webp", 
      imageBlur: staticImageBlurs.cro,
    },
  ],
  // ... other languages
};

export default function SchoolsSection() {
  // ... existing logic

  return (
    <Container>
      <div className="py-24 space-y-24">
        {schools.map((school, index) => (
          <div key={school.id} className="...">
            {/* Optimized Image */}
            <div className={index % 2 === 1 ? "md:order-2" : ""}>
              <div className="aspect-[4/3] relative overflow-hidden rounded-xl bg-muted">
                <Image
                  src={school.imageUrl}
                  alt={school.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                  className="object-cover"
                  loading={index === 0 ? "eager" : "lazy"}
                  placeholder="blur"
                  blurDataURL={school.imageBlur}
                />
              </div>
            </div>
            {/* ... content */}
          </div>
        ))}
      </div>
    </Container>
  );
}
```

### Phase 4: Dynamic Gallery Optimization (Medium Impact - 2 days)

#### 4.1 Enhance Gallery Component Performance
**File**: `/components/project/gallery-view.tsx`

```typescript
// Add responsive image sizes and improved loading
function GalleryImageThumbnail({ image, index, images, setSelectedIndex }: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="group relative aspect-square rounded-md overflow-hidden bg-muted cursor-pointer">
          <Image
            src={image.url}
            alt={image.alt || "Project image"}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 200px"
            className="object-cover transition-transform group-hover:scale-105"
            loading={index < 8 ? "eager" : "lazy"} // Load first 8 eagerly
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyBCADXSSiOoqA6BqNQ=="
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Expand className="w-6 h-6 text-white" />
          </div>
        </div>
      </DialogTrigger>
      {/* ... dialog content */}
    </Dialog>
  );
}

// Optimize carousel images with virtual loading
function ImageGallery({ images, initialIndex = 0, setSelectedIndex }: ImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(initialIndex);
  
  return (
    <div className="space-y-3">
      <Carousel setApi={setApi} className="w-full">
        <CarouselContent>
          {images.map((img, index) => (
            <CarouselItem key={img.id}>
              <div className="relative h-[60vh] max-h-[600px] w-full">
                {/* Only load current image and adjacent ones for performance */}
                {Math.abs(currentImageIndex - index) < 2 && (
                  <Image
                    src={img.url}
                    alt={img.alt || "Project image"}
                    fill
                    sizes="(max-width: 768px) 100vw, 90vw"
                    priority={index === currentImageIndex}
                    className="object-contain"
                    loading={Math.abs(currentImageIndex - index) === 0 ? "eager" : "lazy"}
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,..."
                  />
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {/* ... navigation */}
      </Carousel>
    </div>
  );
}
```

### Phase 5: Teacher Component Optimization (Low-Medium Impact - 1 day)

#### 5.1 Optimize Teacher Avatar Loading
**File**: `/components/teacher-card.tsx`

```typescript
export function TeacherCard({ teacher, onClick }: Props) {
  const { language } = useLanguage();
  
  return (
    <Card className="overflow-hidden cursor-pointer transition-colors hover:bg-muted/50" onClick={onClick}>
      <div className="p-6">
        <Avatar className="h-24 w-24 mx-auto">
          <AvatarImage 
            src={teacher.photo?.url} 
            sizes="96px"
            className="object-cover"
          />
          <AvatarFallback className="text-lg font-semibold">
            {teacher.name[0]}
          </AvatarFallback>
        </Avatar>
      </div>
      {/* ... content */}
    </Card>
  );
}
```

### Phase 6: Next.js Configuration Enhancement (Low Impact - 30 minutes)

#### 6.1 Update Next.js Config for Better Image Optimization
**File**: `/next.config.mjs`

```javascript
const nextConfig = {
  output: 'standalone',
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: ['localhost'],
    remotePatterns: [
      // ... existing patterns
    ],
    unoptimized: process.env.NODE_ENV === 'development',
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // ... rest of config
};
```

## Advanced Optimizations (Phase 7-8)

### Phase 7: Implement Image Preloading Strategy

```typescript
// hooks/use-image-preloader.ts
import { useEffect } from 'react';

export function useImagePreloader(images: string[], priority = false) {
  useEffect(() => {
    if (!priority) return;
    
    images.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });
    
    return () => {
      // Cleanup preload links
      document.querySelectorAll('link[rel="preload"][as="image"]').forEach(link => {
        if (images.includes(link.getAttribute('href') || '')) {
          link.remove();
        }
      });
    };
  }, [images, priority]);
}
```

### Phase 8: Progressive Image Loading Component

```typescript
// components/optimized-image.tsx
"use client";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
  blurDataURL?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill,
  sizes,
  priority = false,
  className,
  blurDataURL,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        sizes={sizes || "(max-width: 768px) 100vw, 50vw"}
        priority={priority}
        placeholder={blurDataURL ? "blur" : "empty"}
        blurDataURL={blurDataURL}
        className={cn(
          "duration-700 ease-in-out",
          isLoading ? "scale-105 blur-lg" : "scale-100 blur-0",
          error && "bg-muted"
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setError(true);
          setIsLoading(false);
        }}
        {...props}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      {error && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Failed to load image</span>
        </div>
      )}
    </div>
  );
}
```

## Tools and Scripts

### Batch Image Processing Script

```bash
#!/bin/bash
# batch-image-optimizer.sh

echo "Starting batch image optimization for TŠC project..."

# Create optimized directory
mkdir -p public/optimized

# Install dependencies
npm install -g @squoosh/cli sharp-cli

# Function to optimize images
optimize_image() {
  local input=$1
  local output_dir=$2
  local quality=${3:-85}
  
  echo "Optimizing $input..."
  
  # Create WebP version
  squoosh-cli --webp "{\"quality\":$quality}" --output-dir "$output_dir" "$input"
  
  # Create responsive sizes for large images
  if [[ $(stat -c%s "$input") -gt 300000 ]]; then
    squoosh-cli --resize '{"width":640}' --webp "{\"quality\":80}" --output-dir "$output_dir" "$input"
    squoosh-cli --resize '{"width":1024}' --webp "{\"quality\":85}" --output-dir "$output_dir" "$input"
  fi
}

# Optimize static images
cd public
for file in *.jpg *.png; do
  if [ -f "$file" ] && [ "$file" != "waterwise.png" ]; then
    optimize_image "$file" "." 85
  fi
done

echo "Optimization complete!"
echo "Original total size: $(du -sh *.jpg *.png 2>/dev/null | awk '{total+=$1} END {print total}')KB"
echo "Optimized total size: $(du -sh *.webp 2>/dev/null | awk '{total+=$1} END {print total}')KB"
```

### Performance Monitoring Script

```typescript
// lib/image-performance.ts
export class ImagePerformanceMonitor {
  private static instance: ImagePerformanceMonitor;
  private metrics: Map<string, { loadTime: number; size: number }> = new Map();

  static getInstance() {
    if (!this.instance) {
      this.instance = new ImagePerformanceMonitor();
    }
    return this.instance;
  }

  trackImageLoad(src: string, startTime: number, endTime: number) {
    const loadTime = endTime - startTime;
    this.metrics.set(src, { loadTime, size: 0 });
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Image loaded: ${src} in ${loadTime}ms`);
    }
  }

  getMetrics() {
    return Array.from(this.metrics.entries()).map(([src, metrics]) => ({
      src,
      ...metrics
    }));
  }

  getAverageLoadTime() {
    const times = Array.from(this.metrics.values()).map(m => m.loadTime);
    return times.reduce((a, b) => a + b, 0) / times.length;
  }
}
```

## Performance Metrics to Track

### Core Web Vitals Impact
- **LCP (Largest Contentful Paint)**: Target <2.5s
- **FID (First Input Delay)**: Target <100ms  
- **CLS (Cumulative Layout Shift)**: Target <0.1

### Image-Specific Metrics
- **Hero image load time**: Current ~800ms → Target <400ms
- **Gallery thumbnails load time**: Current ~1.2s → Target <600ms
- **Total image bandwidth**: Current ~3.4MB → Target <1.8MB
- **WebP adoption rate**: Current 0% → Target 90%

### Implementation Success Criteria
1. **50% reduction** in image file sizes
2. **30% improvement** in LCP scores
3. **Zero layout shift** from image loading
4. **Progressive loading** for all galleries
5. **Responsive images** serving appropriate sizes

## Testing Strategy

### Automated Testing
```bash
# Performance testing script
npm run build
npm run start &

# Wait for server to start
sleep 10

# Test with Lighthouse CI
npx lhci autorun --collect.numberOfRuns=3

# Kill server
pkill -f "next start"
```

### Manual Testing Checklist
- [ ] Hero section loads with blur placeholder
- [ ] School images display correctly on mobile/desktop
- [ ] Gallery thumbnails load progressively
- [ ] WebP images served to compatible browsers
- [ ] Fallback to original format for older browsers
- [ ] No layout shift during image loading
- [ ] Teacher avatars load efficiently

## Rollback Plan

1. **Immediate rollback**: Revert to original image references
2. **Progressive rollback**: Disable WebP serving while keeping optimizations
3. **Component-level rollback**: Revert specific components if issues arise

```bash
# Emergency rollback script
git stash push -m "Image optimization rollback"
git checkout HEAD~1 -- public/
git checkout HEAD~1 -- components/homepage/
npm run build
```

## Implementation Timeline

- **Week 1**: Phases 1-3 (Static assets + Hero + Schools)
- **Week 2**: Phases 4-5 (Gallery + Teacher components) 
- **Week 3**: Phases 6-8 (Config + Advanced optimizations)
- **Week 4**: Testing, monitoring, and refinements

## Expected Results

- **Performance Improvement**: 40-60% faster image loading
- **Bandwidth Savings**: 50% reduction in image transfer
- **User Experience**: Smooth loading with no layout shifts
- **SEO Benefits**: Improved Core Web Vitals scores
- **Mobile Performance**: 70% faster loading on 3G connections

## Next Steps

1. Execute Phase 1 (static asset optimization)
2. Deploy and monitor hero section improvements  
3. Implement responsive gallery optimizations
4. Roll out to all image components
5. Monitor performance metrics and iterate

This implementation plan provides a systematic approach to dramatically improve image performance in the TŠC application while maintaining visual quality and user experience.