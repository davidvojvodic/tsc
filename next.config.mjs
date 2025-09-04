/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    images: {
        domains: ['localhost'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'utfs.io',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https', 
                hostname: '*.ufs.sh',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'ymmxz2wp1b.ufs.sh',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '3000',
                pathname: '/**',
            },
            {
                protocol: 'http',
                hostname: '194.249.165.38',
                port: '4560',
                pathname: '/**',
            },
        ],
        unoptimized: process.env.NODE_ENV === 'development',
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },
    // Ensure cookies can be correctly used for language
    serverRuntimeConfig: {
        revalidateOnChange: true,
    },
    // Force revalidation of content when cookies change
    experimental: {
        serverActions: {
            bodySizeLimit: '5mb',
        },
    },
    // Moved from experimental.serverComponentsExternalPackages in Next.js 15
    serverExternalPackages: ['cookies-next', 'https'],
    async headers() {
        return [
            {
                // Security headers for non-auth API routes (Better Auth handles CORS for auth routes)
                source: "/api/((?!auth).)*",
                headers: [
                  // Security headers for API routes
                  { key: "X-Content-Type-Options", value: "nosniff" },
                  { key: "X-Frame-Options", value: "DENY" },
                  { key: "X-XSS-Protection", value: "1; mode=block" },
                  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
                ]
            },
            {
                // Comprehensive security headers for all routes
                source: "/(.*)",
                headers: [
                  // Content Security Policy
                  { 
                    key: "Content-Security-Policy", 
                    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://ka2.tscmb.si http://194.249.165.38:* https://194.249.165.38:* https://res.cloudinary.com https://utfs.io https://*.ufs.sh https://ka2-waterwise.eu; media-src 'self' https://ka2.tscmb.si http://194.249.165.38:* https://194.249.165.38:* rtsp://194.249.165.38:*; connect-src 'self' https://ka2.tscmb.si http://194.249.165.38:* https://194.249.165.38:* https://ka2-waterwise.eu https://api.uploadthing.com https://*.ingest.uploadthing.com wss:; frame-src 'self' https://ka2.tscmb.si http://194.249.165.38:* https://194.249.165.38:* https://www.youtube.com https://*.youtube.com https://ka2-waterwise.eu https://vercel.live; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self';" 
                  },
                  // Additional Security Headers
                  { key: "X-Content-Type-Options", value: "nosniff" },
                  { key: "X-Frame-Options", value: "SAMEORIGIN" },
                  { key: "X-XSS-Protection", value: "1; mode=block" },
                  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
                  // Strict Transport Security (HSTS)
                  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
                  // Prevent MIME type sniffing
                  { key: "X-DNS-Prefetch-Control", value: "off" },
                  // Cross-Origin Policies - relaxed for external resources
                  { key: "Cross-Origin-Embedder-Policy", value: "unsafe-none" },
                  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
                  { key: "Cross-Origin-Resource-Policy", value: "cross-origin" }
                ]
            }
        ];
    },
    // Configure TLS settings for specific industrial controller endpoints only
    webpack: (config, { isServer }) => {
        if (isServer) {
            // Configure custom TLS handling for industrial controllers
            // This will be handled in specific API routes instead of globally
            config.resolve.fallback = {
                ...config.resolve.fallback,
                "https": false
            };
        }
        return config;
    },
};

export default nextConfig;