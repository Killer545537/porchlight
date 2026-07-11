import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    reactCompiler: true,
    typedRoutes: false,
    cacheComponents: true,
    logging: {
        browserToTerminal: true,
    },
    experimental: {
        typedEnv: true,
    },
    output: 'standalone',
};

export default nextConfig;
