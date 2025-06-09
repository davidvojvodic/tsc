/** @type {import('next').NextConfig} */
const nextConfig = {
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
        unoptimized: process.env.NODE_ENV === 'development'
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
        // Properly handle language detection and server components
        serverComponentsExternalPackages: ['cookies-next', 'https'],
    },
    async headers() {
        return [
            {
                // matching all API routes
                source: "/api/:path*",
                headers: [
                  { key: "Access-Control-Allow-Credentials", value: "true" },
                  { key: "Access-Control-Allow-Origin", value: process.env.NEXT_PUBLIC_APP_URL || "*" },
                  { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
                  { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
                ]
            },
            {
                // Add Content Security Policy for iframe access
                source: "/(.*)",
                headers: [
                  { 
                    key: "Content-Security-Policy", 
                    value: "frame-src 'self' http://194.249.165.38:* https://194.249.165.38:* https://www.youtube.com https://*.youtube.com https://tsc-testing.vercel.app; img-src 'self' data: blob: http://194.249.165.38:* https://194.249.165.38:* https://res.cloudinary.com https://utfs.io https://*.ufs.sh https://tsc-testing.vercel.app; media-src 'self' http://194.249.165.38:* https://194.249.165.38:* rtsp://194.249.165.38:*; connect-src 'self' http://194.249.165.38:* https://194.249.165.38:* https://tsc-testing.vercel.app;" 
                  }
                ]
            }
        ];
    },
    // Disable SSL certificate verification for specific hosts (industrial controllers often use self-signed certs)
    // This only affects server-side requests
    webpack: (config, { isServer }) => {
        if (isServer) {
            // This allows the server to ignore SSL certificate errors when proxying requests
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        }
        return config;
    },
};

export default nextConfig;