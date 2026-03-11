/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        // Keep rewrites disabled by default so Next route handlers power /api on Vercel.
        if (process.env.USE_EXPRESS_PROXY === "true") {
            return [
                {
                    source: '/api/:path*',
                    destination: 'http://localhost:3001/api/:path*',
                },
            ];
        }
        return [];
    },
};

export default nextConfig;
