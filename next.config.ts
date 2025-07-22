import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/workflow/execute/based_id',

                destination: `${process.env.NEXT_PUBLIC_BACKEND_HOST}:${process.env.NEXT_PUBLIC_BACKEND_PORT}/api/workflow/execute/based_id`,
            },
        ];
    },
};

export default nextConfig;
