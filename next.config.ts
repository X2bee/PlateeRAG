import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
        return [
            {
                source: '/api/workflow/execute/based_id',

                destination: `${BASE_URL}/api/workflow/execute/based_id`,
            },
        ];
    },
};

export default nextConfig;
