import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    experimental: {
        proxyTimeout: 600000,
    },
    async rewrites() {
        const host_url =
            process.env.NEXT_PUBLIC_BACKEND_HOST || 'http://localhost';
        const port = process.env.NEXT_PUBLIC_BACKEND_PORT || null;

        let BASE_URL = '';

        if (!port) {
            BASE_URL = host_url;
        } else {
            BASE_URL = `${host_url}:${port}`;
        }

        console.log(`Next.js proxy will forward /api/* to ${BASE_URL}/api/* (updated)`);

        return [
            {
                source: '/api/:path*',
                destination: `${BASE_URL}/api/:path*`,
            },
        ];
    },
};

export default nextConfig;
