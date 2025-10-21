import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    experimental: {
        proxyTimeout: 600000,
    },
    async rewrites() {
        // Hardcoded for K8s deployment
        const BASE_URL = 'http://dev-backend:80';

        console.log(
            `Next.js proxy configuration: forwarding /api/* to ${BASE_URL}/api/*`,
        );

        return [
            {
                source: '/api/:path*',
                destination: `${BASE_URL}/api/:path*`,
            },
        ];
    },
};

export default nextConfig;
