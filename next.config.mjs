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
                protocol: 'http',
                hostname: 'localhost',
                port: '3000',
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
        serverComponentsExternalPackages: ['cookies-next'],
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
              }
        ];
    },
};

export default nextConfig;